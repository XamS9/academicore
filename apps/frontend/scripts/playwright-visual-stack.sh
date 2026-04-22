#!/usr/bin/env bash
# Starts backend (build + node), waits for /health, builds the SPA with VITE_API_URL,
# then runs vite preview for Playwright visual tests.
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$FRONTEND_DIR/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/apps/backend"
# Avoid clobbering a dev server on :3000 unless PLAYWRIGHT_BACKEND_PORT is set.
if [[ -n "${PLAYWRIGHT_BACKEND_PORT:-}" ]]; then
  PORT="$PLAYWRIGHT_BACKEND_PORT"
else
  PORT="$(node -e "const n=require('net');const s=n.createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close();});")"
fi

cleanup() {
  if [[ -n "${BACK_PID:-}" ]] && kill -0 "$BACK_PID" 2>/dev/null; then
    kill "$BACK_PID" 2>/dev/null || true
    wait "$BACK_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "$BACKEND_DIR"
npm run build
PORT="$PORT" NODE_ENV="${NODE_ENV:-development}" node dist/main.js &
BACK_PID=$!

for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; then
  echo "Backend did not become ready at http://127.0.0.1:${PORT}/health" >&2
  exit 1
fi

cd "$FRONTEND_DIR"
export VITE_API_URL="http://127.0.0.1:${PORT}/api"
npm run build
exec npx vite preview --host 127.0.0.1 --port 4173 --strictPort
