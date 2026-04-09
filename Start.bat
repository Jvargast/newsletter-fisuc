@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

set PORT=3000
set HOST=127.0.0.1
set NODE_ENV=production
set npm_config_cache=%cd%\.npm-cache
set npm_config_prefix=%cd%\.npm-prefix

set NODE_BIN=%cd%\bin\node-win-x64.exe
if not exist "%NODE_BIN%" set NODE_BIN=%cd%\bin\node.exe
if not exist "%NODE_BIN%" set NODE_BIN=node

%NODE_BIN% -v >nul 2>&1
if errorlevel 1 (
  echo [Error] No encuentro Node. Pon un Node embebido en .\bin o instala desde https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  if exist "package-lock.json" (
    echo Instalando dependencias (npm ci)...
    call npm ci
  ) else (
    echo Instalando dependencias (npm i)...
    call npm i
  )
)

if not exist ".\public\uploads" mkdir ".\public\uploads"

echo Iniciando mini-app en http://%HOST%:%PORT%/admin.html
start "" "http://%HOST%:%PORT%/admin.html"
%NODE_BIN% server.mjs

echo.
pause
