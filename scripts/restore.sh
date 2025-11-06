#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <backup_dir>" >&2
  exit 1
fi

BACKUP_DIR="$1"
volumes=(
  stalwart-data
  synapse-data
  caddy-data
  caddy-config
  nextcloud-data
  nextcloud-db-data
  prometheus-data
  restic-data
)
for volume in "${volumes[@]}"; do
  archive="$BACKUP_DIR/${volume}.tgz"
  if [[ ! -f "$archive" ]]; then
    echo "[restore] Missing archive $archive" >&2
    continue
  fi
  echo "[restore] Restoring $volume from $archive"
  docker volume create "$volume" >/dev/null 2>&1 || true
  docker run --rm \
    -v "$volume:/dest" \
    -v "$BACKUP_DIR:/backup" \
    alpine sh -c "rm -rf /dest/* && tar xzf /backup/${volume}.tgz -C /dest"
done

echo "[restore] Completed"
