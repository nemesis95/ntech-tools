# NTech Tools

NTech Tools is a public repository for small, practical utilities that solve everyday technical problems.

Each stable tool is developed on its own branch so that it can be downloaded, tested, and maintained independently.

## Available tools

| Tool | Version | Stable branch | Development branch | Description |
| --- | --- | --- | --- | --- |
| LAN File Transfer | 0.0.1 | `lan-file-transfer-v0.0.1` | `lan-file-transfer-dev` | Transfer files and complete folders between Windows, macOS, and Linux computers over a trusted local network. |
| PS2 BIN to ISO | 0.0.1 | `ps2-bin-to-iso-v0.0.1` | `ps2-bin-to-iso-dev` | Convert compatible BIN/CUE disc images to ISO locally through a drag-and-drop interface on Windows, macOS, and Linux. |
| PS3 Legacy Browser Bridge | 0.1.0 | `ps3-legacy-browser-bridge-v0.1.0` | `ps3-legacy-browser-bridge-dev` | Let a PS3 legacy browser reach PS3Tool through a computer that handles the modern HTTPS connection. |

### LAN File Transfer

Runs a local receiver on one computer and opens a simple browser interface on the sending device. It transfers individual files or complete folder trees across a trusted local network, preserves folder structure, streams large files, reports progress, and avoids overwriting existing files. It supports Windows, macOS, and Linux.

### PS2 BIN to ISO

Provides a local drag-and-drop interface for converting compatible PlayStation 2 CD images from BIN/CUE to ISO. It reads the CUE track layout and extracts the actual 2048-byte data sectors instead of merely changing the file extension. It supports common Mode 1 and Mode 2 layouts, multiple referenced BIN files, and Windows, macOS, and Linux.

### PS3 Legacy Browser Bridge

Runs a local compatibility bridge between the PS3's legacy browser and PS3Tool. The PS3 communicates with the computer over the local network, while the computer handles the upstream modern TLS connection. It does not include PS3Tool, firmware, patch payloads, or Sony files, and it does not remove the risks associated with flash modification.

## Repository structure

- `main` — public catalog, repository information, and links to individual tools. Tool source code is not merged into this branch.
- `*-dev` branches — active development and documentation work for a tool.
- Versioned tool branches — stable source code and documentation for a specific tool release.
- Git tags — immutable release markers, such as `v0.0.1`.

All tool branches share repository history with `main`. Development happens on the tool's development branch and stable releases are published to a versioned branch without merging the complete tool into the catalog branch.

See [Branch Guide](docs/BRANCHES.md) for the complete workflow.

## Status

This repository is in early development. Published utilities currently include LAN File Transfer `0.0.1`, PS2 BIN to ISO `0.0.1`, and PS3 Legacy Browser Bridge `0.1.0`.
