#!/usr/bin/env bash
# Run from repo root on Render (rootDir: backend → invoked as bash ../scripts/render-build.sh)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Installing Python dependencies…"
pip install -r "$ROOT/backend/requirements.txt"

echo "Building frontend…"
cd "$ROOT/frontend"
if command -v npm >/dev/null 2>&1; then
  npm ci
  npm run build
else
  echo "npm not found on PATH" >&2
  exit 1
fi

echo "Build complete. Static files: $ROOT/frontend/dist"
