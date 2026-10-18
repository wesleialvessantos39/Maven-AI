@echo off
setlocal
cd /d "%~dp0"
title Minha IA Studio PRO - Windows 8GB
where node >nul 2>&1
if errorlevel 1 ( echo [ERRO] Instale Node.js LTS em https://nodejs.org/ & pause & exit /b 1 )
where npm >nul 2>&1
if errorlevel 1 ( echo [ERRO] npm nao encontrado. & pause & exit /b 1 )
where ollama >nul 2>&1
if errorlevel 1 ( echo [AVISO] Ollama nao encontrado. Instale em https://ollama.com/download )
if not exist ".env" ( copy ".env.example" ".env" >nul & echo [OK] .env criado )
if not exist "node_modules\express" (
 echo [1/3] Instalando dependencias...
 call npm install --no-audit --no-fund
 if errorlevel 1 ( echo [ERRO] Instale as dependencias manualmente. & pause & exit /b 1 )
)
if not exist "client\dist\index.html" (
 echo [2/3] Compilando painel React + Vite...
 call npm run build
 if errorlevel 1 ( echo [ERRO] Falha no build. & pause & exit /b 1 )
)
echo [3/3] Iniciando somente no notebook...
echo Painel: http://127.0.0.1:8787
echo Instalar modelo: ollama pull qwen2.5-coder:1.5b
call npm start
pause
