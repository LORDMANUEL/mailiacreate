#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/compose/docker-compose.prod.yml"

if ! command -v docker >/dev/null; then
  echo "docker is required" >&2
  exit 1
fi

docker compose -f "$COMPOSE_FILE" up -d "$@"
