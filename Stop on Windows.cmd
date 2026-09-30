@echo off
setlocal
powershell -NoProfile -Command "$pidPath = Join-Path '%~dp0app' 'server.pid'; if (!(Test-Path -LiteralPath $pidPath)) { Write-Host 'The transfer server is not running.'; exit }; $serverPid = [int](Get-Content -LiteralPath $pidPath); $process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue; if ($process -and $process.ProcessName -eq 'node') { Stop-Process -Id $serverPid; Write-Host 'The transfer server has been stopped.' } else { Write-Host 'The transfer server is not running.' }; Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue"
pause
