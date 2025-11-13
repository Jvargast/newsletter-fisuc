#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Vars portables
export PORT=${PORT:-3000}
export HOST=${HOST:-127.0.0.1}
export NODE_ENV=production
export npm_config_cache="$PWD/.npm-cache"
export npm_config_prefix="$PWD/.npm-prefix"

NODE_BIN="$PWD/bin/node-macos-x64"
if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node || true)"
fi

if [[ -z "${NODE_BIN}" || ! -x "${NODE_BIN}" ]]; then
  echo "[Error] Node.js no esta instalado o no esta en PATH ni en ./bin"
  echo "Instala desde https://nodejs.org o incluye bin/node-macos-x64"
  exit 1
fi

if [[ ! -d "node_modules" ]]; then
  if [[ -f "package-lock.json" ]]; then
    echo "Instalando dependencias (npm ci)..."
    npm ci
  else
    echo "Instalando dependencias (npm i)..."
    npm i
  fi
fi

mkdir -p "./public/uploads"

echo "Iniciando mini-app en http://$HOST:$PORT/admin.html"
( open "http://$HOST:$PORT/admin.html" ) >/dev/null 2>&1 || true

exec "$NODE_BIN" server.mjs
