#!/bin/bash
set -u

APP_ROOT="$(cd -- "$(dirname -- "$0")" && pwd)"
SERVER="$APP_ROOT/app/server.js"

if [ -x "$APP_ROOT/runtime/macos-$(uname -m)/node" ]; then
  NODE_BIN="$APP_ROOT/runtime/macos-$(uname -m)/node"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  echo "ERROR: Node.js 18 or newer is required on macOS."
  echo "Install it from https://nodejs.org/ and run this file again."
  echo
  read -r -p "Press Enter to close..."
  exit 1
fi

NODE_MAJOR="$($NODE_BIN -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18 or newer is required. Found version $($NODE_BIN --version)."
  read -r -p "Press Enter to close..."
  exit 1
fi

clear
"$NODE_BIN" "$SERVER"
STATUS=$?
echo
if [ "$STATUS" -ne 0 ]; then read -r -p "Press Enter to close..."; fi
exit "$STATUS"
