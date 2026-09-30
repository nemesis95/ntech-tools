# NTech Tools

NTech Tools is a public repository for small, practical utilities that solve everyday technical problems.

Each stable tool is developed on its own branch so that it can be downloaded, tested, and maintained independently.

## Available tools

| Tool | Version | Stable branch | Development branch | Description |
| --- | --- | --- | --- | --- |
| LAN File Transfer | 0.0.1 | `lan-file-transfer-v0.0.1` | `lan-file-transfer-dev` | Transfer files and complete folders between Windows, macOS, and Linux computers over a trusted local network. |
| PS3 Legacy Browser Bridge | 0.1.0 | `ps3-legacy-browser-bridge-v0.1.0` | `ps3-legacy-browser-bridge-dev` | Forward legacy PS3 browser requests through a computer that handles modern HTTPS. |

## Repository structure

- `main` — public catalog, repository information, and links to individual tools. Tool source code is not merged into this branch.
- `*-dev` branches — active development and documentation work for a tool.
- Versioned tool branches — stable source code and documentation for a specific tool release.
- Git tags — immutable release markers, such as `v0.0.1`.

All tool branches share repository history with `main`. Development happens on the tool's development branch and stable releases are published to a versioned branch without merging the complete tool into the catalog branch.

See [Branch Guide](docs/BRANCHES.md) for the complete workflow.

## Status

This repository is in early development. Published utilities include LAN File Transfer `0.0.1` and PS3 Legacy Browser Bridge `0.1.0`.
