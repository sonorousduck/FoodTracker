#!/usr/bin/env bash
set -euo pipefail

session_name="foodtracker"
frontend_window="frontend"
backend_window="backend"
docker_window="docker"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required to run this script." >&2
  exit 1
fi

if tmux has-session -t "${session_name}" 2>/dev/null; then
  tmux select-window -t "${session_name}:${frontend_window}" 2>/dev/null || true
  exec tmux attach -t "${session_name}"
fi

tmux new-session -d -s "${session_name}" -n "${frontend_window}" \
  "cd foodtracker-frontend && npx expo start"

tmux new-window -t "${session_name}" -n "${backend_window}" \
  "cd foodtracker-backend && nest start"

tmux new-window -t "${session_name}" -n "${docker_window}" \
  "docker compose up -d elasticsearch"

tmux select-window -t "${session_name}:${frontend_window}"
exec tmux attach -t "${session_name}"
