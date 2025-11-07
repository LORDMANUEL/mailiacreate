#!/bin/bash
set -e

echo "### Iniciando Copia de Seguridad de MailKit ###"

# --- Comprobaciones de Prerrequisitos ---
if [ ! -f "mailkit/.env" ]; then
    echo "ERROR: No se encuentra el archivo .env en mailkit/.env. Asegúrate de que existe."
    exit 1
fi

# --- Ejecución de la Copia de Seguridad ---
echo "Ejecutando la copia de seguridad de Restic para el volumen de Stalwart..."
# Usamos un contenedor efímero de restic para realizar la copia de seguridad.
# Los datos de Stalwart se montan en /data y el repositorio de la copia de seguridad en /backups.
sudo docker run --rm \
    --env-file mailkit/.env \
    -v ./mailkit/backups:/backups \
    -v ./mailkit/stalwart_data:/data:ro \
    restic/restic backup /data

echo "### Copia de seguridad completada con éxito. ###"
echo "Los datos se han guardado en la carpeta ./mailkit/backups."
