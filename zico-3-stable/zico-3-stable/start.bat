@echo off
echo ==========================================
echo   WADJET GRC Platform - Starting...
echo ==========================================

set "APP_DIR="
for /d %%D in ("%~dp0*") do if exist "%%~fD\server\mock-server.mjs" set "APP_DIR=%%~fD"
if not defined APP_DIR (
	echo Could not locate the application directory.
	pause
	exit /b 1
)

start "WADJET Backend (API)" /D "%APP_DIR%\server" cmd /k node mock-server.mjs
start "WADJET Audit API" /D "%~dp0audit-module\backend" cmd /k npx tsx src/index.ts
timeout /t 3 /nobreak > nul
start "WADJET Frontend (UI)" /D "%APP_DIR%\client" cmd /k npm run dev

echo.
echo ==========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173
echo ==========================================
echo.
echo Login: admin / admin123
echo.
echo Press any key to close this window...
pause > nul
