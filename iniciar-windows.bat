@echo off
setlocal
cd /d "%~dp0"
title Maven AI Studio v2
where node >nul 2>&1
if errorlevel 1 ( echo [ERRO] Instale Node.js 24 LTS em https://nodejs.org/ & pause & exit /b 1 )
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 ( echo [ERRO] Node.js antigo. Instale Node.js 24 LTS. & pause & exit /b 1 )
where npm >nul 2>&1
if errorlevel 1 ( echo [ERRO] npm nao encontrado. & pause & exit /b 1 )
if not exist ".env" ( copy ".env.example" ".env" >nul )
echo [1/2] Conferindo dependencias pelo package-lock.json...
call npm ci --no-audit --no-fund
if errorlevel 1 ( echo [ERRO] Falha na instalacao. Confira a internet e execute npm ci. & pause & exit /b 1 )
echo [2/2] Iniciando. O painel sera recompilado automaticamente se necessario.
echo Acesse http://127.0.0.1:8787 quando o servidor informar que iniciou.
echo Ollama e opcional para abrir o painel. Modelo local: ollama pull qwen2.5-coder:1.5b
call npm start
pause
