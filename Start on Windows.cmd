@echo off
setlocal
title LAN File Transfer
set "APP_ROOT=%~dp0"
set "NODE_EXE=%APP_ROOT%runtime\node.exe"

if exist "%NODE_EXE%" goto run

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js 18 or newer is required.
  echo Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
set "NODE_EXE=node"

:run
"%NODE_EXE%" "%APP_ROOT%app\server.js"
echo.
pause
