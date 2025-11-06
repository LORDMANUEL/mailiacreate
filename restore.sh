#!/bin/bash
set -e

# ID del snapshot a restaurar (por defecto, el último)
SNAPSHOT_ID=${1:-latest}

# Ejecutar el comando de restauración de restic dentro de un nuevo contenedor
sudo docker run --rm \
    --env-file mailkit/.env \
    -v ./mailkit/backups:/backups \
    -v ./mailkit/stalwart_data:/data \
    restic/restic restore ${SNAPSHOT_ID} --target /data
