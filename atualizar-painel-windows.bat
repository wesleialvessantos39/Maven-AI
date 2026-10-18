@echo off
setlocal
cd /d "%~dp0"
call npm install --no-audit --no-fund
if errorlevel 1 ( echo [ERRO] npm install & pause & exit /b 1 )
call npm run build
if errorlevel 1 ( echo [ERRO] npm run build & pause & exit /b 1 )
echo [OK] Painel atualizado. Reinicie a IA.
pause
