#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR=${1:-"$ROOT_DIR/backups/$(date +%Y%m%d-%H%M%S)"}
mkdir -p "$BACKUP_DIR"

cat <<INFO
[backup] Exporting docker volumes to $BACKUP_DIR
INFO

volumes=(stalwart-data synapse-data caddy-data caddy-config)
for volume in "${volumes[@]}"; do
  echo "[backup] Saving $volume"
  docker run --rm \
    -v "$volume:/source" \
    -v "$BACKUP_DIR:/backup" \
    alpine tar czf "/backup/${volume}.tgz" -C /source .
done

echo "[backup] Completed"
