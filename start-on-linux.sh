#!/usr/bin/env bash
set -u

APP_ROOT="$(cd -- "$(dirname -- "$0")" && pwd)"
SERVER="$APP_ROOT/app/server.js"

if [ -x "$APP_ROOT/runtime/linux-$(uname -m)/node" ]; then
  NODE_BIN="$APP_ROOT/runtime/linux-$(uname -m)/node"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  echo "ERROR: Node.js 18 or newer is required on Linux."
  echo "Install the nodejs package for your distribution and run this script again."
  exit 1
fi

NODE_MAJOR="$($NODE_BIN -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18 or newer is required. Found version $($NODE_BIN --version)."
  exit 1
fi

exec "$NODE_BIN" "$SERVER"
