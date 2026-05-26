#!/bin/bash

SESSION="foodtracker"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill existing session if it exists
tmux kill-session -t "$SESSION" 2>/dev/null

# Create a new session with the first window (backend)
tmux new-session -d -s "$SESSION" -n "backend"
tmux send-keys -t "$SESSION:backend" "cd ~/foodtracker-backend && yarn run build && NODE_ENV=production node dist/main.js" Enter

# Create second window (frontend)
tmux new-window -t "$SESSION" -n "frontend"
tmux send-keys -t "$SESSION:frontend" "cd ~/foodtracker-frontend && npx expo export --platform web && npx serve dist -l 7776" Enter

# Create third window (docker)
tmux new-window -t "$SESSION" -n "docker"
tmux send-keys -t "$SESSION:docker" "cd \"$SCRIPT_DIR\" && docker compose up" Enter

# Select the first window
tmux select-window -t "$SESSION:backend"

# Attach to the session
tmux attach-session -t "$SESSION"

