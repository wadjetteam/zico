@echo off
echo ==========================================
echo   WADJET GRC Platform - Starting...
echo ==========================================

start "WADJET Backend (API)" cmd /k "cd /d \"%~dp0الكود بعد تعديل الاجازة\server\" && node mock-server.mjs"
timeout /t 3 /nobreak > nul
start "WADJET Frontend (UI)" cmd /k "cd /d \"%~dp0الكود بعد تعديل الاجازة\client\" && npm run dev"

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
