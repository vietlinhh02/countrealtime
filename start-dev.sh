#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:${BACKEND_PORT}}"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}"
  fi

  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}"
  fi
}

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    printf 'Missing command: %s\n%s\n' "${command_name}" "${install_hint}" >&2
    exit 1
  fi
}

trap cleanup EXIT INT TERM

require_command uv "Install uv first: https://docs.astral.sh/uv/"
require_command pnpm "Install pnpm first: corepack enable && corepack prepare pnpm@latest --activate"

printf 'Syncing backend dependencies...\n'
(cd "${BACKEND_DIR}" && uv sync)

printf 'Syncing frontend dependencies...\n'
(cd "${FRONTEND_DIR}" && pnpm install)

printf 'Starting backend on http://localhost:%s\n' "${BACKEND_PORT}"
(
  cd "${BACKEND_DIR}"
  uv run uvicorn app.main:app --reload --host 0.0.0.0 --port "${BACKEND_PORT}"
) &
BACKEND_PID="$!"

printf 'Starting frontend on http://localhost:%s\n' "${FRONTEND_PORT}"
(
  cd "${FRONTEND_DIR}"
  NEXT_PUBLIC_API_BASE_URL="${API_BASE_URL}" pnpm dev
) &
FRONTEND_PID="$!"

printf '\nReady:\n'
printf '  Backend:  http://localhost:%s\n' "${BACKEND_PORT}"
printf '  Frontend: http://localhost:%s\n' "${FRONTEND_PORT}"
printf '\nPress Ctrl+C to stop both servers.\n\n'

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
