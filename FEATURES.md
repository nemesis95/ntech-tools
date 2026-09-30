# LAN File Transfer — Features

LAN File Transfer moves files and folders directly between computers connected to the same local network. It does not require cloud storage or a user account.

## Supported systems

- **Windows** — start with `Start on Windows.cmd`. A bundled Node.js runtime can be used when present.
- **macOS** — start with `Start on macOS.command`. Node.js 18 or newer is required.
- **Linux** — start with `start-on-linux.sh`. Node.js 18 or newer is required.
- The sending device only needs a modern browser such as Safari, Chrome, Edge, or Firefox.

## File transfer

- Send one file or multiple files at once.
- Select a complete folder in the browser.
- Drag files and folders onto the page.
- Stream large files without loading the whole file into memory.
- Display progress for every file.
- Display queued, completed, and failed file counts.
- Display the total amount of transferred data.

## Folder organization

- Automatically create required directories on the receiving computer.
- Preserve the original folder and subfolder structure.
- Store all received content in `Received Files`.
- Never overwrite an existing file; create a numbered copy such as `photo (1).jpg`.
- Reject invalid or unsafe paths, including attempts to escape the `Received Files` directory.

## Communication between computers

- Check the connection to the receiving computer every two seconds.
- Show whether the receiver is connected or unavailable.
- Return a receiver acknowledgement after each file is saved.
- Display a specific error to the sender when a transfer fails.
- Mark interrupted or incomplete transfers as failed.
- Delete temporary `.part` files after an error or disconnection.

## Multiple computers

- One running server can receive files from multiple computers and devices at the same time.
- Windows, macOS, and Linux computers can send data to the same receiver.
- Phones and tablets can send files when their browsers support file selection.
- One open transfer page currently sends data to one receiving computer.
- Automatic simultaneous delivery of the same file to multiple receivers is not supported in version 0.0.1.

## Activity and error records

- Show successful transfers and errors live on the web page.
- Record receiver activity in `transfer.log`.
- Include event time, result, and file path in the log.
- Show activity in the server terminal while it is running.

## Security

- Generate a new random private URL every time the server starts.
- Require the complete private URL to open the transfer page.
- Run only while the server process is active.
- Restrict received content to the `Received Files` directory.
- Validate names and replace characters that are not allowed by the receiving operating system.
- Use the application only on a trusted private network, never on public Wi-Fi.
- On Windows, allow firewall access for **Private networks** only.

## Offline operation

- Transfer without internet access after all required components are installed.
- Send data directly through the local network instead of uploading it to a cloud service.
- Transfer speed primarily depends on the local Wi-Fi or wired network.

## Project files

- `Received Files/` — successfully received files and folders.
- `transfer.log` — transfer and error activity.
- `app/server.js` — server application and browser interface.
- `runtime/node.exe` — optional bundled Windows runtime in desktop packages.
- `README.md` — project overview and quick-start instructions.
- `TUTORIAL.md` — complete setup and usage tutorial.
- `Start on Windows.cmd` / `Stop on Windows.cmd` — Windows controls.
- `Start on macOS.command` / `Stop on macOS.command` — macOS controls.
- `start-on-linux.sh` / `stop-on-linux.sh` — Linux controls.

## Current limitations

- Computers must be on the same local network.
- Other computers are not discovered automatically; the private address is opened manually.
- An interrupted file cannot resume from a partial point and must be sent again.
- Folders are not synchronized automatically.
- The application does not delete files on another computer.
- There are no user accounts, permanent passwords, or public-internet access.
- macOS and Linux require Node.js 18 or newer.

## Basic workflow

1. Connect the computers to the same trusted network.
2. Run the correct start script on the receiving computer.
3. Open the address shown by the server on the sending device.
4. Select or drag files and folders.
5. Wait for `Receiver confirmed` for every file.
6. Check the received content in `Received Files`.
7. Stop the server with the correct stop script or `Ctrl+C`.
