@echo off
set "ROOT=%~dp0"
for /f "delims=" %%T in ('powershell -NoProfile -Command "(Get-Date).ToString('yyyyMMdd-HHmmss')"') do set "STAMP=%%T"
set "BACKUP=%ROOT%backups\%STAMP%"
mkdir "%BACKUP%" > nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%backup-data.ps1" -BackupPath "%BACKUP%"
if errorlevel 1 echo WARNING: Data backup failed. Startup was not stopped, but check the backup path.

echo ==========================================
echo   WADJET GRC Platform - Starting...
echo ==========================================

echo Backup created: %BACKUP%
echo Starting Audit backend without changing the database schema...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%start-services.ps1"

echo.
echo ==========================================
echo   Backend:  http://localhost:5000
echo   Audit API: http://localhost:5002
echo   Frontend: http://localhost:5173
echo   RAG API:  http://localhost:8008 (if Python is installed)
echo ==========================================
echo.
echo Login: admin / admin123
echo.
echo Audit database: Prisma SQLite (existing data preserved)
echo.
echo Press any key to close this window...
pause > nul
