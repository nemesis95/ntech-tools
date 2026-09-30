#!/bin/zsh

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR" || exit 1

clear
echo "Starting PS2 BIN → ISO…"
echo "Your browser will open automatically."
echo

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 was not found on this Mac."
  echo "Install it from https://www.python.org/downloads/macos/ and try again."
  echo
  read "?Press Enter to exit…"
  exit 1
fi

python3 "$APP_DIR/app.py"
EXIT_CODE=$?

if [ "$EXIT_CODE" -ne 0 ]; then
  echo
  echo "The app exited with error code $EXIT_CODE."
  read "?Press Enter to exit…"
fi
