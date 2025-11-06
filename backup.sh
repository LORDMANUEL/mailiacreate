#!/bin/bash
set -e

# Ejecutar el comando de copia de seguridad de restic dentro de un nuevo contenedor
sudo docker run --rm \
    --env-file mailkit/.env \
    -v ./mailkit/backups:/backups \
    -v ./mailkit/stalwart_data:/data \
    restic/restic backup /data
