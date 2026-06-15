#!/usr/bin/env bash
# Wipe EVERY cache the project might use. Run this whenever you want a fully
# clean rebuild, or hand it to users when they hit stale-state issues.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_DIR="${ROOT_DIR}/backend"

printf '\n=== Removing Next.js build cache ===\n'
rm -rf "${FRONTEND_DIR}/.next" "${FRONTEND_DIR}/.swc" "${FRONTEND_DIR}/out" \
       "${FRONTEND_DIR}/tsconfig.tsbuildinfo" "${FRONTEND_DIR}"/node_modules/.cache
find "${FRONTEND_DIR}" -name "*.tsbuildinfo" -delete 2>/dev/null || true

printf '\n=== Removing frontend node_modules (optional full reset) ===\n'
# Uncomment the next line to also wipe node_modules:
# rm -rf "${FRONTEND_DIR}/node_modules"

printf '\n=== Removing Python build caches ===\n'
rm -rf "${BACKEND_DIR}/.venv" "${BACKEND_DIR}/__pycache__" \
       "${BACKEND_DIR}/.pytest_cache" "${BACKEND_DIR}/.ruff_cache" \
       "${BACKEND_DIR}/.mypy_cache" "${BACKEND_DIR}"/**/__pycache__
find "${BACKEND_DIR}" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "${BACKEND_DIR}" -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
find "${BACKEND_DIR}" -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
find "${BACKEND_DIR}" -name "*.pyc" -delete 2>/dev/null || true
find "${BACKEND_DIR}" -name "*.pyo" -delete 2>/dev/null || true

printf '\n=== Clearing pnpm and uv package caches ===\n'
if command -v pnpm >/dev/null 2>&1; then
  pnpm store prune >/dev/null 2>&1 || true
fi
if command -v uv >/dev/null 2>&1; then
  uv cache clean >/dev/null 2>&1 || true
fi

printf '\n=== Done. Now run ./start-dev.sh or rebuild Docker images. ===\n'
