#!/usr/bin/env bash
set -u

APP_ROOT="$(cd -- "$(dirname -- "$0")" && pwd)"
PID_FILE="$APP_ROOT/app/server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "The transfer server is not running."
  exit 0
fi

SERVER_PID="$(tr -cd '0-9' < "$PID_FILE")"
COMMAND="$(ps -p "$SERVER_PID" -o command= 2>/dev/null || true)"
case "$COMMAND" in
  *node*server.js*)
    kill "$SERVER_PID"
    echo "The transfer server has been stopped."
    ;;
  *)
    echo "The saved process is not the transfer server; nothing was stopped."
    ;;
esac
rm -f -- "$PID_FILE"
