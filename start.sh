#!/usr/bin/env bash
# Start both backend (FastAPI) and frontend (Vite) from the project root.
# Usage: ./start.sh   (or: bash start.sh)

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# Backend: run from backend/ so imports resolve; use venv if present
if [ -x "$ROOT/backend/venv/bin/python" ]; then
  PYTHON="$ROOT/backend/venv/bin/python"
else
  PYTHON="python3"
fi
echo "Starting backend (FastAPI) at http://127.0.0.1:8000 ..."
(cd "$ROOT/backend" && "$PYTHON" -m uvicorn app.main:app --reload) &
BACKEND_PID=$!

# Frontend: npm run dev
echo "Starting frontend (Vite) at http://localhost:5173 ..."
(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

wait
