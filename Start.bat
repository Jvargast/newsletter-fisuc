@echo off
setlocal enabledelayedexpansion

REM 
cd /d "%~dp0"

REM 
set PORT=3000
set HOST=127.0.0.1
set NODE_ENV=production
set npm_config_cache=%cd%\.npm-cache
set npm_config_prefix=%cd%\.npm-prefix

REM 
set NODE_BIN="%cd%\bin\node-win-x64.exe"
if not exist %NODE_BIN% set NODE_BIN=node

REM 
%NODE_BIN% -v >nul 2>&1
if errorlevel 1 (
  echo [Error] No encuentro Node. Pon un Node embebido en .\bin o instala desde https://nodejs.org
  pause
  exit /b 1
)

REM 
  if exist package-lock.json (
    echo Instalando dependencias (npm ci)...
    call npm ci
  ) else (
    echo Instalando dependencias (npm i)...
    call npm i
  )
)

REM 
if not exist ".\public\uploads" mkdir ".\public\uploads"

echo Iniciando mini-app en http://%HOST%:%PORT%/admin.html
start "" "http://%HOST%:%PORT%/admin.html"
%NODE_BIN% server.mjs

echo.
echo (
pause
