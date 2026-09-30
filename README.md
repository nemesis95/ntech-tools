# PS3 Legacy Browser Bridge

Version **0.1.0** — an independent NTech Tools utility.

## Branch purpose

`ps3-legacy-browser-bridge-v0.1.0` is the stable, versioned PS3 Legacy Browser Bridge **0.1.0** release branch. Use it to download and run this fixed release. Ongoing work belongs on `ps3-legacy-browser-bridge-dev`; this branch receives only release-specific documentation or critical corrections.

PS3 Legacy Browser Bridge runs a small HTTP server on a computer connected to the same trusted local network as a PlayStation 3. The PS3 connects to the computer over plain local HTTP, while the computer forwards requests to `https://ps3tool.com` using modern TLS.

This helps when the legacy PS3 browser cannot negotiate the upstream site's HTTPS connection. It is a compatibility bridge, **not an offline flasher and not a copy of PS3Tool**.

## Important legal and technical boundaries

- No PS3Tool application code, patch payload, website text, or branding is distributed here.
- The bridge contacts PS3Tool at runtime; internet access and upstream availability are required.
- PS3Tool remains the upstream service and retains its own notices and credits.
- No Sony firmware, CFW update, encryption key, or copyrighted firmware module is included.
- This project is not affiliated with PS3Tool or Sony.
- See [NOTICE.md](NOTICE.md) for attribution.

## Requirements

- Python 3 on the computer.
- The computer and PS3 on the same trusted local network.
- Working internet access on the computer.
- A CFW-capable PS3 for any CFW flash-patching operation.
- A FAT32/MBR USB drive for creating a flash backup.

## Start the bridge

### macOS

Double-click `Start on macOS.command`, or run:

```bash
chmod +x "Start on macOS.command"
./"Start on macOS.command"
```

### Windows

Install Python 3, then double-click `Start on Windows.bat`.

### Linux

```bash
chmod +x start-on-linux.sh
./start-on-linux.sh
```

The terminal prints a local URL similar to:

```text
http://192.168.1.100:8080/flashtool/?legacy=1
```

Keep the terminal open. If the operating system asks about firewall access, allow Python on the private/local network only.

## Connect from the PS3

1. Restart the PS3 and do not enable HEN.
2. Clear the PS3 browser cache, cookies, history, and authentication information.
3. Enter the exact `http://` address printed by the bridge. Do not change it to HTTPS.
4. Wait for the upstream tool to initialize before pressing anything.

If the browser reports a worker-thread or local-storage allocation failure, close the browser normally, reboot the console, and make the tool URL the first page loaded in the next browser session.

## Safety requirements before patching

Flash writing can permanently brick a console. This bridge does not make flash writing risk-free.

Proceed only when the upstream tool explicitly reports:

```text
CFW Capable: YES
```

Traditional CFW is generally supported on all FAT models, Slim CECH-20xx and CECH-21xx, and only some CECH-25xx systems. Slim CECH-30xx and Super Slim CECH-4xxx systems must not use the traditional CFW flash-patching process.

Before applying a patch:

1. Create `dump.hex` on a FAT32/MBR USB drive using the upstream tool.
2. Verify the dump with the included PyPS3checker.
3. Continue only with zero `DANGER` and zero `WARNING` results, unless a qualified repair specialist has reviewed a known documented exception.
4. Never close the browser, power off the console, or interrupt the network while flash writing is in progress.
5. Use firmware and patch files only from their original trusted maintainers and verify published hashes.

## Verify a flash dump

### macOS

Double-click `Verify dump on macOS.command` and drag `dump.hex` into the terminal window.

### Windows

Drag `dump.hex` onto:

```text
PyPS3checker/drag&drop_your_dump_here_py3.bat
```

### Linux

Run `verify-dump-on-linux.sh` and enter the path to `dump.hex`.

## Privacy and network exposure

The bridge binds to all local interfaces on TCP port `8080`. Use it only on a trusted private network and stop it with `Ctrl+C` when finished. It is not a general-purpose anonymous proxy: requests are forwarded only to the fixed upstream host `ps3tool.com`.

Browser requests, including the PS3 User-Agent and upstream session cookies, pass through the computer in memory. The bridge does not intentionally save them to disk.

## License

This tool is distributed under the [GNU General Public License, version 2](LICENSE). PyPS3checker retains its original copyright and GPL v2 terms.

## Upstream resources

- [PS3Tool](https://ps3tool.com/)
- [PS3 CFW installation guide](https://consolemods.org/wiki/PS3:Installing_CFW)
- [PyPS3tools](https://github.com/littlebalup/PyPS3tools)
