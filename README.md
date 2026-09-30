# LAN File Transfer

Version **0.0.1** — an NTech Tools utility.

## Branch purpose

`lan-file-transfer-v0.0.1` is the stable, versioned LAN File Transfer **0.0.1** release branch. Use it to download and run this fixed release. Ongoing work belongs on `lan-file-transfer-dev`; this branch receives only release-specific documentation or critical corrections.

LAN File Transfer sends files and complete folder trees directly between computers on the same trusted local network. The receiving computer runs the server; every sending device uses an ordinary web browser.

## Highlights

- Works on Windows, macOS, and Linux.
- Sends individual files, multiple files, or complete folders.
- Preserves folder and subfolder structure.
- Streams large files instead of loading them entirely into memory.
- Shows per-file progress and receiver acknowledgements.
- Reports connection and transfer errors to the sender.
- Accepts simultaneous senders on the same local network.
- Never overwrites an existing file; numbered copies are created.
- Rejects unsafe paths and removes incomplete temporary files.
- Works without cloud storage or an internet connection after setup.

## Requirements

- Node.js 18 or newer on the receiving computer.
- A modern browser on the sending device.
- Both devices connected to the same trusted local network.

## Quick start

### Windows

Double-click `Start on Windows.cmd`.

### macOS

```bash
chmod +x "Start on macOS.command" "Stop on macOS.command"
./"Start on macOS.command"
```

### Linux

```bash
chmod +x start-on-linux.sh stop-on-linux.sh
./start-on-linux.sh
```

The server prints a private address. Open that address on the sending computer, then choose or drag files and folders onto the page.

Received content is stored in `Received Files/`. Runtime activity is recorded in `transfer.log`.

## Documentation

- [Complete tutorial](TUTORIAL.md)
- [Detailed feature list](FEATURES.md)
- [Changes in this version](CHANGELOG.md)

## Security

Use this tool only on a trusted private network. A new random private URL is generated on every start, but the transfer traffic is local HTTP and is not encrypted.

## Version

This branch contains LAN File Transfer **0.0.1** and is tagged as `v0.0.1`.
