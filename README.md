# nTech Tools — PS2 BIN → ISO

Version **0.0.1** — an nTech Tools utility.

## Branch purpose

`ps2-bin-to-iso-v0.0.1` is the stable, versioned PS2 BIN to ISO **0.0.1** release branch. Use it to download and run this fixed release. Ongoing work belongs on `ps2-bin-to-iso-dev`; this branch receives only release-specific documentation or critical corrections.

A local drag-and-drop web app by [nTech](https://ntech.rs) that performs real sector conversion of PS2 CD images from `BIN/CUE` to `ISO`. It runs on Windows, Linux, and macOS without uploading your game files to the internet.

## Quick start

### Windows

1. Install [Python 3](https://www.python.org/downloads/windows/) if it is not already installed. During installation, enable **Add Python to PATH**.
2. Double-click `Start on Windows.bat`.

### macOS

1. Double-click `Start on macOS.command`.
2. If macOS blocks it the first time, right-click `Start on macOS.command`, select **Open**, and confirm.

### Linux

Run:

```sh
chmod +x start-on-linux.sh
./start-on-linux.sh
```

If Python is missing, install Python 3 using your distribution's package manager first.

## Converting a game

1. The app opens automatically in your default browser.
2. Drop one `.CUE` file and every `.BIN` file referenced by it, or drop the entire folder containing them.
3. You can also use **Choose a whole folder**.
4. Click **Convert to ISO**.
5. Click **Download** when conversion is complete.

The ISO uses the same base name as the CUE file. For example, `Game Name.cue` becomes `Game Name.iso`.

To stop the app, click **Stop app** at the bottom of the page or press `Control+C` in the terminal window.

## What the converter does

- Reads track layout and boundaries from the CUE file.
- Extracts the real 2048-byte data payload from raw CD sectors; it does not rename the file extension.
- Supports `MODE1/2048`, `MODE1/2352`, `MODE2/2048`, `MODE2/2336`, and `MODE2/2352`.
- Supports CUE sheets that reference one or several BIN files.
- Produces a separate ISO for every data track when a disc has multiple data tracks.
- Skips audio tracks because the ISO format cannot preserve CD audio. Keep the original BIN/CUE files if the game uses audio tracks.

## Privacy and files

The app listens only on the local address `127.0.0.1`. Nothing is uploaded to the internet. Temporary working copies are stored in the operating system's temporary directory and removed when the app stops. Original BIN/CUE files are never modified.

Your browser normally saves downloaded ISO files in its configured Downloads folder.

## Requirements

- Windows 10/11, a current Linux distribution, or macOS
- Python 3.9 or newer
- Safari, Chrome, Edge, Firefox, or another modern browser

No Homebrew, Node.js, external converter, or Python package installation is required.

## Branches and version

- Stable release: `ps2-bin-to-iso-v0.0.1`
- Ongoing development: `ps2-bin-to-iso-dev`

This branch contains the stable **0.0.1** release. Future changes should be committed to the development branch first and published on a new versioned branch when ready.

## Legal and ownership notice

© 2026 nTech / ntech.rs. All rights reserved.

Use this utility only with files you own or are authorized to convert. Do not use it to bypass technological protection measures or to download, share, sell, or distribute copyrighted game images without permission. The app does not include, download, or provide any game content.

PS2 is a trademark of Sony Interactive Entertainment Inc. nTech and this utility are not affiliated with, sponsored by, or endorsed by Sony Interactive Entertainment.
