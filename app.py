#!/usr/bin/env python3
# Copyright (c) 2026 nTech / ntech.rs. All rights reserved.
"""Local PS2 BIN/CUE to ISO converter with a browser interface."""

from __future__ import annotations

import atexit
import json
import os
import re
import secrets
import shutil
import signal
import sys
import tempfile
import threading
import time
import urllib.parse
import webbrowser
from dataclasses import dataclass, field
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, List, Optional, Tuple


APP_DIR = Path(__file__).resolve().parent
STATIC_DIR = APP_DIR / "static"
HOST = "127.0.0.1"
TOKEN = secrets.token_urlsafe(24)
JOBS: Dict[str, "Job"] = {}
JOBS_LOCK = threading.Lock()
TEMP_ROOT = Path(tempfile.mkdtemp(prefix="ps2-bin-u-iso-"))
SERVER: Optional[ThreadingHTTPServer] = None


class ConversionError(Exception):
    pass


@dataclass
class CueTrack:
    number: int
    mode: str
    file_name: str
    indexes: Dict[int, int] = field(default_factory=dict)

    @property
    def is_data(self) -> bool:
        return self.mode.upper() != "AUDIO"


@dataclass
class Job:
    job_id: str
    directory: Path
    status: str = "created"
    progress: float = 0.0
    message: str = "Ready for files."
    files: Dict[str, str] = field(default_factory=dict)
    results: List[dict] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    error: Optional[str] = None
    cancel_event: threading.Event = field(default_factory=threading.Event)
    lock: threading.Lock = field(default_factory=threading.Lock)

    def snapshot(self) -> dict:
        with self.lock:
            return {
                "id": self.job_id,
                "status": self.status,
                "progress": round(self.progress, 1),
                "message": self.message,
                "results": list(self.results),
                "warnings": list(self.warnings),
                "error": self.error,
            }


MODE_LAYOUTS: Dict[str, Tuple[int, int, int]] = {
    # mode: (bytes stored per sector, user-data offset, ISO bytes per sector)
    "MODE1/2048": (2048, 0, 2048),
    "MODE1/2352": (2352, 16, 2048),
    "MODE2/2048": (2048, 0, 2048),
    "MODE2/2336": (2336, 8, 2048),
    "MODE2/2352": (2352, 24, 2048),
}


def cue_time_to_sector(value: str) -> int:
    match = re.fullmatch(r"(\d+):(\d{2}):(\d{2})", value.strip())
    if not match:
        raise ConversionError(f"Invalid CUE time: {value}")
    minutes, seconds, frames = map(int, match.groups())
    if seconds >= 60 or frames >= 75:
        raise ConversionError(f"Invalid CUE time: {value}")
    return (minutes * 60 + seconds) * 75 + frames


def safe_file_name(value: str) -> str:
    value = value.replace("\\", "/")
    name = value.rsplit("/", 1)[-1].strip()
    if not name or name in {".", ".."} or "\x00" in name:
        raise ConversionError("The CUE contains an invalid file name.")
    return name


def parse_cue(cue_path: Path) -> List[CueTrack]:
    raw = cue_path.read_bytes()
    text = None
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise ConversionError("The CUE file could not be read.")

    current_file: Optional[str] = None
    current_track: Optional[CueTrack] = None
    tracks: List[CueTrack] = []

    file_re = re.compile(r'^\s*FILE\s+(?:"([^"]+)"|(\S+))\s+(\S+)\s*$', re.I)
    track_re = re.compile(r"^\s*TRACK\s+(\d+)\s+(\S+)\s*$", re.I)
    index_re = re.compile(r"^\s*INDEX\s+(\d+)\s+(\d+:\d{2}:\d{2})\s*$", re.I)

    for line_no, line in enumerate(text.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.upper().startswith(("REM ", "TITLE ", "PERFORMER ", "CATALOG ", "FLAGS ", "ISRC ", "PREGAP ", "POSTGAP ", "SONGWRITER ")):
            continue
        file_match = file_re.match(line)
        if file_match:
            file_type = file_match.group(3).upper()
            if file_type not in {"BINARY", "MOTOROLA"}:
                raise ConversionError(
                    f"FILE type {file_type} is not supported. Use an uncompressed BIN/CUE image."
                )
            current_file = safe_file_name(file_match.group(1) or file_match.group(2))
            current_track = None
            continue
        track_match = track_re.match(line)
        if track_match:
            if not current_file:
                raise ConversionError(f"TRACK appears before FILE on line {line_no}.")
            current_track = CueTrack(
                number=int(track_match.group(1)),
                mode=track_match.group(2).upper(),
                file_name=current_file,
            )
            tracks.append(current_track)
            continue
        index_match = index_re.match(line)
        if index_match:
            if not current_track:
                raise ConversionError(f"INDEX appears before TRACK on line {line_no}.")
            index_no = int(index_match.group(1))
            current_track.indexes[index_no] = cue_time_to_sector(index_match.group(2))
            continue
        # Unknown metadata is ignored; structural lines above are parsed strictly.

    if not tracks:
        raise ConversionError("The CUE does not contain any tracks.")
    if not any(track.is_data for track in tracks):
        raise ConversionError("The CUE contains audio tracks only, so an ISO cannot be created.")
    for track in tracks:
        if 1 not in track.indexes:
            raise ConversionError(f"TRACK {track.number:02d} has no INDEX 01.")
    return tracks


def find_uploaded(job: Job, cue_name: str) -> Path:
    wanted = safe_file_name(cue_name).casefold()
    matches = [job.directory / stored for original, stored in job.files.items() if original.casefold() == wanted]
    if not matches:
        raise ConversionError(f"A file referenced by the CUE is missing: {cue_name}")
    if len(matches) > 1:
        raise ConversionError(f"More than one uploaded file matches this name: {cue_name}")
    return matches[0]


def output_base(cue_name: str) -> str:
    stem = Path(cue_name).stem.strip() or "PS2 Disc"
    stem = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", stem).rstrip(". ")
    return stem or "PS2 Disc"


def build_tasks(job: Job, cue_name: str, tracks: List[CueTrack]) -> Tuple[List[dict], List[str]]:
    warnings: List[str] = []
    audio_tracks = [track.number for track in tracks if not track.is_data]
    if audio_tracks:
        labels = ", ".join(f"{number:02d}" for number in audio_tracks)
        warnings.append(
            f"Audio tracks {labels} cannot be stored in an ISO and were skipped. The original BIN/CUE still contains them."
        )

    data_tracks = [track for track in tracks if track.is_data]
    base = output_base(cue_name)
    tasks: List[dict] = []

    tracks_by_file: Dict[str, List[CueTrack]] = {}
    for track in tracks:
        tracks_by_file.setdefault(track.file_name.casefold(), []).append(track)

    for same_file_tracks in tracks_by_file.values():
        modes = {track.mode for track in same_file_tracks}
        declared_sizes = {
            MODE_LAYOUTS[mode][0] if mode in MODE_LAYOUTS else 2352
            for mode in modes
        }
        if len(declared_sizes) > 1:
            raise ConversionError(
                "One BIN contains tracks with different sector sizes. This uncommon CUE layout cannot be converted safely."
            )

    for track in data_tracks:
        if track.mode not in MODE_LAYOUTS:
            raise ConversionError(
                f"TRACK {track.number:02d} uses unsupported format {track.mode}. "
                "Supported formats are MODE1/2048, MODE1/2352, MODE2/2048, MODE2/2336, and MODE2/2352."
            )
        source = find_uploaded(job, track.file_name)
        stored_sector, data_offset, data_size = MODE_LAYOUTS[track.mode]
        file_size = source.stat().st_size
        if file_size <= 0:
            raise ConversionError(f"The BIN file is empty: {track.file_name}")
        if file_size % stored_sector != 0:
            raise ConversionError(
                f"The size of {track.file_name} is not aligned to {stored_sector}-byte sectors required by {track.mode}."
            )
        file_sectors = file_size // stored_sector
        start_sector = track.indexes[1]
        end_sector = file_sectors

        same_file = tracks_by_file[track.file_name.casefold()]
        later_tracks = [other for other in same_file if other.indexes[1] > start_sector]
        if later_tracks:
            next_track = min(later_tracks, key=lambda item: item.indexes[1])
            end_sector = next_track.indexes.get(0, next_track.indexes[1])

        if start_sector < 0 or end_sector <= start_sector or end_sector > file_sectors:
            raise ConversionError(
                f"Invalid boundaries for TRACK {track.number:02d}: sectors {start_sector}–{end_sector}."
            )

        if len(data_tracks) == 1:
            result_name = f"{base}.iso"
        else:
            result_name = f"{base} (Track {track.number:02d}).iso"
        result_path = job.directory / result_name
        tasks.append(
            {
                "track": track,
                "source": source,
                "source_name": track.file_name,
                "output": result_path,
                "output_name": result_name,
                "stored_sector": stored_sector,
                "data_offset": data_offset,
                "data_size": data_size,
                "start_sector": start_sector,
                "end_sector": end_sector,
                "sector_count": end_sector - start_sector,
            }
        )
    return tasks, warnings


def extract_track(job: Job, task: dict, completed_before: int, total_sectors: int) -> None:
    partial = task["output"].with_suffix(task["output"].suffix + ".partial")
    stored_sector = task["stored_sector"]
    data_offset = task["data_offset"]
    data_size = task["data_size"]
    sector_count = task["sector_count"]
    chunk_sectors = max(1, (4 * 1024 * 1024) // stored_sector)

    try:
        with task["source"].open("rb") as source, partial.open("wb") as output:
            source.seek(task["start_sector"] * stored_sector)
            done = 0
            last_update = 0.0
            while done < sector_count:
                if job.cancel_event.is_set():
                    raise InterruptedError("Conversion cancelled.")
                count = min(chunk_sectors, sector_count - done)
                raw = source.read(count * stored_sector)
                if len(raw) != count * stored_sector:
                    raise ConversionError(f"Unexpected end of BIN file: {task['source_name']}")
                if data_offset == 0 and data_size == stored_sector:
                    output.write(raw)
                else:
                    converted = bytearray(count * data_size)
                    for index in range(count):
                        src_start = index * stored_sector + data_offset
                        dst_start = index * data_size
                        converted[dst_start : dst_start + data_size] = raw[src_start : src_start + data_size]
                    output.write(converted)
                done += count
                now = time.monotonic()
                if now - last_update >= 0.08 or done == sector_count:
                    with job.lock:
                        job.progress = ((completed_before + done) / total_sectors) * 100
                        job.message = (
                            f"Converting TRACK {task['track'].number:02d} — "
                            f"{done * 100 // sector_count}%"
                        )
                    last_update = now
        os.replace(partial, task["output"])
    except Exception:
        try:
            partial.unlink(missing_ok=True)
        except OSError:
            pass
        raise


def run_conversion(job: Job, cue_name: str) -> None:
    try:
        cue_path = find_uploaded(job, cue_name)
        tracks = parse_cue(cue_path)
        tasks, warnings = build_tasks(job, cue_name, tracks)
        total_sectors = sum(task["sector_count"] for task in tasks)
        if total_sectors <= 0:
            raise ConversionError("There are no data sectors to convert.")
        expected_bytes = total_sectors * 2048
        free_bytes = shutil.disk_usage(job.directory).free
        if expected_bytes + 64 * 1024 * 1024 > free_bytes:
            raise ConversionError(
                "There is not enough free disk space for the ISO output. Free some space and try again."
            )

        with job.lock:
            job.status = "converting"
            job.progress = 0
            job.message = "Reading the CUE and preparing tracks…"
            job.warnings = warnings

        completed = 0
        for task in tasks:
            extract_track(job, task, completed, total_sectors)
            completed += task["sector_count"]
            with job.lock:
                job.results.append(
                    {
                        "name": task["output_name"],
                        "size": task["output"].stat().st_size,
                        "track": task["track"].number,
                        "mode": task["track"].mode,
                    }
                )

        with job.lock:
            job.status = "done"
            job.progress = 100
            count = len(job.results)
            job.message = "The ISO is ready to download." if count == 1 else f"{count} ISO files are ready."
    except InterruptedError:
        with job.lock:
            job.status = "cancelled"
            job.message = "Conversion cancelled."
            job.error = None
    except Exception as exc:
        with job.lock:
            job.status = "error"
            job.message = "Conversion failed."
            job.error = str(exc) if isinstance(exc, ConversionError) else f"Unexpected error: {exc}"


def json_bytes(payload: dict) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


class AppHandler(BaseHTTPRequestHandler):
    server_version = "PS2BinToISO/1.0"

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, message: str, status: int = 400) -> None:
        self.send_json({"error": message}, status)

    def parsed(self) -> urllib.parse.ParseResult:
        return urllib.parse.urlparse(self.path)

    def authorized(self) -> bool:
        query = urllib.parse.parse_qs(self.parsed().query)
        supplied = self.headers.get("X-App-Token") or (query.get("token", [""])[0])
        return secrets.compare_digest(supplied, TOKEN)

    def require_auth(self) -> bool:
        if not self.authorized():
            self.send_error_json("Invalid local session.", HTTPStatus.FORBIDDEN)
            return False
        return True

    def job_for(self, job_id: str) -> Optional[Job]:
        with JOBS_LOCK:
            return JOBS.get(job_id)

    def do_GET(self) -> None:
        parsed = self.parsed()
        path = parsed.path
        if path == "/":
            if not self.authorized():
                self.send_response(HTTPStatus.FORBIDDEN)
                self.end_headers()
                self.wfile.write(b"Open the app with the launcher for your operating system.")
                return
            return self.send_static("index.html", "text/html; charset=utf-8")
        if path.startswith("/static/"):
            name = path.removeprefix("/static/")
            content_types = {
                "app.js": "text/javascript; charset=utf-8",
                "style.css": "text/css; charset=utf-8",
                "ntech-symbol.png": "image/png",
            }
            if name not in content_types:
                return self.send_error(HTTPStatus.NOT_FOUND)
            return self.send_static(name, content_types[name])
        if not self.require_auth():
            return
        match = re.fullmatch(r"/api/jobs/([a-f0-9]+)/status", path)
        if match:
            job = self.job_for(match.group(1))
            if not job:
                return self.send_error_json("Job not found.", HTTPStatus.NOT_FOUND)
            return self.send_json(job.snapshot())
        match = re.fullmatch(r"/api/jobs/([a-f0-9]+)/results/(\d+)", path)
        if match:
            job = self.job_for(match.group(1))
            if not job:
                return self.send_error_json("Job not found.", HTTPStatus.NOT_FOUND)
            index = int(match.group(2))
            with job.lock:
                if job.status != "done" or index >= len(job.results):
                    return self.send_error_json("Output file not found.", HTTPStatus.NOT_FOUND)
                result = dict(job.results[index])
            file_path = job.directory / result["name"]
            return self.send_download(file_path)
        return self.send_error_json("Not found.", HTTPStatus.NOT_FOUND)

    def send_static(self, name: str, content_type: str) -> None:
        file_path = STATIC_DIR / name
        try:
            body = file_path.read_bytes()
        except OSError:
            return self.send_error(HTTPStatus.NOT_FOUND)
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_download(self, file_path: Path) -> None:
        resolved = file_path.resolve()
        if not resolved.is_file() or TEMP_ROOT.resolve() not in resolved.parents:
            return self.send_error_json("Output file not found.", HTTPStatus.NOT_FOUND)
        name = urllib.parse.quote(resolved.name)
        size = resolved.stat().st_size
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/x-iso9660-image")
        self.send_header("Content-Length", str(size))
        self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{name}")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            with resolved.open("rb") as source:
                shutil.copyfileobj(source, self.wfile, length=1024 * 1024)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_POST(self) -> None:
        if not self.require_auth():
            return
        path = self.parsed().path
        if path == "/api/jobs":
            job_id = secrets.token_hex(12)
            directory = TEMP_ROOT / job_id
            directory.mkdir(mode=0o700)
            job = Job(job_id=job_id, directory=directory)
            with JOBS_LOCK:
                JOBS[job_id] = job
            return self.send_json({"id": job_id}, HTTPStatus.CREATED)

        match = re.fullmatch(r"/api/jobs/([a-f0-9]+)/convert", path)
        if match:
            job = self.job_for(match.group(1))
            if not job:
                return self.send_error_json("Job not found.", HTTPStatus.NOT_FOUND)
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 64 * 1024:
                    raise ValueError
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                cue_name = safe_file_name(str(payload["cueName"]))
            except (ValueError, KeyError, json.JSONDecodeError, ConversionError):
                return self.send_error_json("Invalid conversion request.")
            with job.lock:
                if job.status in {"converting", "done"}:
                    return self.send_error_json("Conversion has already started.", HTTPStatus.CONFLICT)
                job.status = "converting"
                job.message = "Starting conversion…"
            threading.Thread(target=run_conversion, args=(job, cue_name), daemon=True).start()
            return self.send_json({"ok": True}, HTTPStatus.ACCEPTED)

        match = re.fullmatch(r"/api/jobs/([a-f0-9]+)/cancel", path)
        if match:
            job = self.job_for(match.group(1))
            if not job:
                return self.send_error_json("Job not found.", HTTPStatus.NOT_FOUND)
            job.cancel_event.set()
            return self.send_json({"ok": True})

        if path == "/api/shutdown":
            self.send_json({"ok": True})
            if SERVER:
                threading.Thread(target=SERVER.shutdown, daemon=True).start()
            return
        return self.send_error_json("Not found.", HTTPStatus.NOT_FOUND)

    def do_PUT(self) -> None:
        if not self.require_auth():
            return
        parsed = self.parsed()
        match = re.fullmatch(r"/api/jobs/([a-f0-9]+)/files", parsed.path)
        if not match:
            return self.send_error_json("Not found.", HTTPStatus.NOT_FOUND)
        job = self.job_for(match.group(1))
        if not job:
            return self.send_error_json("Job not found.", HTTPStatus.NOT_FOUND)
        try:
            name = safe_file_name(urllib.parse.parse_qs(parsed.query)["name"][0])
            length = int(self.headers.get("Content-Length", "-1"))
            if length <= 0:
                raise ValueError
        except (KeyError, IndexError, ValueError, ConversionError):
            return self.send_error_json("A valid file name and size are required.")
        if Path(name).suffix.casefold() not in {".bin", ".cue"}:
            return self.send_error_json("Only .BIN and .CUE files are allowed.")
        free_bytes = shutil.disk_usage(job.directory).free
        if length + 64 * 1024 * 1024 > free_bytes:
            return self.send_error_json("There is not enough free disk space.", HTTPStatus.INSUFFICIENT_STORAGE)
        with job.lock:
            if job.status not in {"created", "uploading"}:
                return self.send_error_json("Files can no longer be uploaded to this job.", HTTPStatus.CONFLICT)
            if any(existing.casefold() == name.casefold() for existing in job.files):
                return self.send_error_json(f"File {name} has already been uploaded.", HTTPStatus.CONFLICT)
            job.status = "uploading"
            job.message = f"Uploading {name}…"

        stored = f"upload-{len(job.files):03d}{Path(name).suffix.casefold()}"
        destination = job.directory / stored
        remaining = length
        try:
            with destination.open("xb") as output:
                while remaining:
                    chunk = self.rfile.read(min(1024 * 1024, remaining))
                    if not chunk:
                        raise ConnectionError("The upload was interrupted.")
                    output.write(chunk)
                    remaining -= len(chunk)
        except Exception as exc:
            destination.unlink(missing_ok=True)
            with job.lock:
                job.status = "error"
                job.error = f"Upload failed: {exc}"
            return self.send_error_json("Upload failed.", HTTPStatus.BAD_REQUEST)

        with job.lock:
            job.files[name] = stored
            job.status = "created"
            job.message = f"Uploaded: {name}"
        return self.send_json({"ok": True, "name": name}, HTTPStatus.CREATED)


def cleanup() -> None:
    try:
        shutil.rmtree(TEMP_ROOT)
    except OSError:
        pass


def main() -> int:
    global SERVER
    atexit.register(cleanup)
    try:
        SERVER = ThreadingHTTPServer((HOST, 0), AppHandler)
    except OSError as exc:
        print(f"Could not start the local server: {exc}", file=sys.stderr)
        return 1
    port = SERVER.server_address[1]
    url = f"http://{HOST}:{port}/?token={urllib.parse.quote(TOKEN)}"
    print("\nPS2 BIN → ISO is running.")
    print(f"If your browser does not open automatically, open:\n{url}")
    print("\nTo stop the app, press Control+C or click 'Stop app'.\n")

    def open_browser() -> None:
        time.sleep(0.35)
        webbrowser.open(url)

    if os.environ.get("PS2_NO_BROWSER") != "1":
        threading.Thread(target=open_browser, daemon=True).start()
    try:
        SERVER.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        pass
    finally:
        SERVER.server_close()
    print("The app has stopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
