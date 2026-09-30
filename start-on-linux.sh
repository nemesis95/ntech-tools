#!/usr/bin/env sh

APP_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$APP_DIR" || exit 1

printf '%s\n' "Starting PS2 BIN → ISO…" "Your browser will open automatically." ""

if ! command -v python3 >/dev/null 2>&1; then
  printf '%s\n' \
    "Python 3 was not found." \
    "Install it using your Linux distribution's package manager and try again."
  exit 1
fi

exec python3 "$APP_DIR/app.py"
