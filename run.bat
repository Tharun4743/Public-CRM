@echo off
title Smart Public Service CRM
echo ========================================================
echo        SMART PUBLIC SERVICE CRM - STARTUP SCRIPT
echo ========================================================
echo.
echo [1/3] Checking and installing dependencies...
call npm install
echo.
echo [2/3] Fetching Tunnel Password (Your Public IP)...
for /f "tokens=*" %%a in ('curl -s https://api.ipify.org') do set MYIP=%%a
echo.
echo ========================================================
echo  TUNNEL PASSWORD: %MYIP%
echo ========================================================
echo.
echo [3/3] Booting the Intelligence Core and Tunnel...
echo.
echo ========================================================
echo  The server is starting in a new window.
echo  The tunnel is starting in this window.
echo  Press CTRL+C in both windows to stop.
echo ========================================================
echo.

:: Start the server in a separate background window
start "PS-CRM Backend" cmd /k "npx tsx server.ts"

:: Start the tunnel in the current window
npx localtunnel --port 3001 --subdomain pscrm-teamgoat
pause
