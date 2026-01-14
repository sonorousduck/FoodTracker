#!/usr/bin/env bash
set -euo pipefail

BACKEND_SRC="foodtracker-backend/src"
FRONTEND_TYPES="foodtracker-frontend/types"
DATE_AS_STRING=$(date +"%Y-%m-%d %H:%M:%S")
ADD_BANNER=true

mkdir -p "$FRONTEND_TYPES"

TRANSFORMER_FILE="$(dirname "$0")/dto-transformer.cjs"

node "$TRANSFORMER_FILE" "$BACKEND_SRC" "$FRONTEND_TYPES" "$DATE_AS_STRING" "$ADD_BANNER" || exit 1
