@echo off
title Smart Public Service CRM
echo ========================================================
echo        SMART PUBLIC SERVICE CRM - STARTUP SCRIPT
echo ========================================================
echo.
echo [1/4] Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies already installed.
)
echo.
echo [2/4] Fetching Tunnel Password (Your Public IP)...
for /f "tokens=*" %%a in ('curl -s https://api.ipify.org') do set MYIP=%%a
echo.
echo ========================================================
echo  TUNNEL PASSWORD: %MYIP%
echo  (Use this if localtunnel prompts for a password)
echo ========================================================
echo.
echo [3/4] Starting Services...
echo.
echo [BACKEND] Starting on port 3001...
start "PS-CRM Backend" cmd /c "npx tsx server.ts"

echo [FRONTEND] Starting on port 5173 (Vite)...
start "PS-CRM Frontend" cmd /c "npx vite --host"

echo.
echo [4/4] Opening Admin Console...
echo Waiting for services to initialize...
timeout /t 5 /nobreak > nul
start http://localhost:5173/admin

echo.
echo ========================================================
echo  SERVICES ARE RUNNING
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo  Starting localtunnel for external access...
echo ========================================================
echo.

npx localtunnel --port 3001 --subdomain pscrm-teamgoat
pause

