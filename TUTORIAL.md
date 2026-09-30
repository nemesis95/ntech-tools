# LAN File Transfer 0.0.1 — Tutorial

This tutorial explains how to transfer files and complete folders between Windows, macOS, and Linux computers on the same local network.

## 1. Choose the receiving computer

The receiving computer is the device that runs the server. Every successfully transferred file is stored in its `Received Files` directory.

The sending computer does not need the application installed. It only needs a modern web browser.

## 2. Install Node.js

The receiving computer requires Node.js 18 or newer.

Check the installed version:

```bash
node --version
```

If Node.js is not installed, download the current LTS version from [nodejs.org](https://nodejs.org/).

The Windows desktop package may include `runtime/node.exe`. When that runtime is present, a separate Node.js installation is not required.

## 3. Start the server

### Windows

Double-click `Start on Windows.cmd`.

If Windows Firewall prompts you, allow access for **Private networks** only.

### macOS

The first time, open Terminal in the project directory and run:

```bash
chmod +x "Start on macOS.command" "Stop on macOS.command"
```

Then start the server:

```bash
./"Start on macOS.command"
```

If macOS blocks the file, Control-click it, choose **Open**, and confirm.

### Linux

The first time, run:

```bash
chmod +x start-on-linux.sh stop-on-linux.sh
```

Then start the server:

```bash
./start-on-linux.sh
```

## 4. Open the private address

The server window displays an address similar to:

```text
http://192.168.1.25:8765/a1b2c3d4e5f6/
```

Open the complete address on the sending computer or phone using Safari, Chrome, Edge, or Firefox.

Both devices must be connected to the same Wi-Fi or wired network.

## 5. Send files or folders

On the transfer page, you can:

- select one or more files;
- select a complete folder;
- drag files or folders onto the drop area.

When a folder is sent, the server automatically recreates the folder and its subfolders inside `Received Files`.

## 6. Verify the result

The page displays progress for every file. A successful transfer ends with:

```text
Receiver confirmed
```

This message means that the receiving computer confirmed that the file was saved. Any failure is displayed next to the affected file.

Additional activity is recorded in `transfer.log` on the receiving computer.

## 7. Use multiple computers

Multiple devices can send data to one running server at the same time. Each device opens the same private address.

One browser page sends to one receiving computer. Version 0.0.1 does not automatically send the same file to multiple servers.

## 8. Stop the server

Press `Ctrl+C` in the server terminal, or run the appropriate stop script:

- Windows: `Stop on Windows.cmd`
- macOS: `Stop on macOS.command`
- Linux: `./stop-on-linux.sh`

## Troubleshooting

### The page does not open

- Confirm that the server window is still open.
- Confirm that both devices are connected to the same network.
- Enter the complete address again, including its random final segment.
- On Windows, confirm that firewall access is allowed for the private network.
- Temporarily disconnect a VPN if it isolates local network traffic.

### Node.js is not found

Install Node.js 18 or newer, close the terminal, and run the start script again.

### A file already exists

The server never overwrites it. The new copy receives a numbered name such as `file (1).pdf`.

### The connection was interrupted

The incomplete `.part` file is removed automatically. Send that file again after the connection becomes stable.

## Security recommendations

- Use the application only on a trusted private network.
- Do not share the private address with unknown people.
- Stop the server when the transfer is complete.
- Version 0.0.1 uses unencrypted local HTTP and is not designed for the public internet.
