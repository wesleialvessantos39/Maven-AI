@echo off
setlocal
cd /d "%~dp0"
call npm ci --no-audit --no-fund
if errorlevel 1 ( echo [ERRO] Falha no npm ci. & pause & exit /b 1 )
call npm run build
if errorlevel 1 ( echo [ERRO] Falha no build. & pause & exit /b 1 )
echo [OK] Painel atualizado. Reinicie a aplicacao e pressione Ctrl+F5 no navegador.
pause
