#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_MAIN="$ROOT_DIR/compose/docker-compose.prod.yml"
COMPOSE_LOCAL="$ROOT_DIR/compose/docker-compose.local.yml"
ENV_FILE="$ROOT_DIR/compose/.env"

COMPOSE_ARGS=("-f" "$COMPOSE_MAIN")

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  if [[ "${LOCAL_MODE:-false}" == "true" ]]; then
    COMPOSE_ARGS+=("-f" "$COMPOSE_LOCAL")
  fi
fi

if ! command -v docker >/dev/null; then
  echo "docker is required" >&2
  exit 1
fi

docker compose "${COMPOSE_ARGS[@]}" up -d "$@"
