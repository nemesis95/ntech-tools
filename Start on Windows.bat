@echo off
title PS3 Lokalni Flasher Proxy
cd /d "%~dp0"
py -3 ps3_proxy.py
if errorlevel 1 python ps3_proxy.py
pause
