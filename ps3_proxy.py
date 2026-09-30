#!/usr/bin/env python3
# Copyright (C) 2026 NTech Tools contributors
# SPDX-License-Identifier: GPL-2.0-only
"""Plain-HTTP LAN proxy for the PS3Tool Flash Tools web app.

The PS3 browser connects to this server over HTTP. Requests are forwarded to
https://ps3tool.com so the computer handles modern TLS while the PS3 keeps its
own User-Agent, cookies, and CSRF token.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import socket
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


UPSTREAM = "https://ps3tool.com"
LISTEN_HOST = "0.0.0.0"
LISTEN_PORT = 8080
HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


class ProxyHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        self._proxy()

    def do_POST(self):
        self._proxy()

    def _proxy(self):
        path = self.path
        if path == "/":
            self.send_response(302)
            self.send_header("Location", "/flashtool/?legacy=1")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        parsed = urlsplit(path)
        upstream_url = UPSTREAM + parsed.path
        if parsed.query:
            upstream_url += "?" + parsed.query

        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else None

        headers = {}
        for name, value in self.headers.items():
            lower = name.lower()
            if lower in HOP_BY_HOP or lower in {"host", "content-length", "accept-encoding"}:
                continue
            if lower == "referer":
                headers[name] = UPSTREAM + urlsplit(value).path
            elif lower == "origin":
                headers[name] = UPSTREAM
            else:
                headers[name] = value
        headers["Accept-Encoding"] = "identity"

        request = Request(upstream_url, data=body, headers=headers, method=self.command)
        try:
            response = urlopen(request, timeout=30)
        except HTTPError as exc:
            response = exc
        except URLError as exc:
            message = ("Proxy error: " + str(exc)).encode("utf-8", "replace")
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(message)))
            self.end_headers()
            self.wfile.write(message)
            return

        payload = response.read()
        self.send_response(response.status)
        for name, value in response.headers.items():
            lower = name.lower()
            if lower in HOP_BY_HOP or lower in {"content-length", "content-encoding"}:
                continue
            if lower == "location" and value.startswith(UPSTREAM):
                value = value[len(UPSTREAM):] or "/"
            self.send_header(name, value)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def get_lan_ip():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("10.255.255.255", 1))
        return sock.getsockname()[0]
    except OSError:
        return "IP-ADRESA-RACUNARA"
    finally:
        sock.close()


if __name__ == "__main__":
    address = f"http://{get_lan_ip()}:{LISTEN_PORT}/flashtool/?legacy=1"
    print("\nPS3 lokalni proxy je pokrenut.", flush=True)
    print("Na PS3 browseru otvori:", flush=True)
    print(address, flush=True)
    print("\nOstavi ovaj prozor otvoren. Ctrl+C za zaustavljanje.\n", flush=True)
    try:
        ReusableThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), ProxyHandler).serve_forever()
    except KeyboardInterrupt:
        print("\nServer je zaustavljen.", flush=True)
