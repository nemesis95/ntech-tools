@echo off
setlocal
set "PYTHONUTF8=1"
cd /d "%~dp0"

echo Starting PS2 BIN to ISO...
echo Your browser will open automatically.
echo.

where py >nul 2>nul
if errorlevel 1 goto try_python
py -3 "%~dp0app.py"
set "APP_EXIT=%errorlevel%"
goto finished

:try_python
where python >nul 2>nul
if errorlevel 1 goto missing_python
python "%~dp0app.py"
set "APP_EXIT=%errorlevel%"
goto finished

:missing_python
echo Python 3 was not found.
echo Install it from https://www.python.org/downloads/windows/ and try again.
echo.
pause
exit /b 1

:finished

if not "%APP_EXIT%"=="0" (
  echo.
  echo The app exited with error code %APP_EXIT%.
  pause
)

exit /b %APP_EXIT%
