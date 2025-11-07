#!/bin/bash
set -e

echo "### Iniciando Restauración de MailKit ###"

# --- Comprobaciones de Prerrequisitos ---
if [ ! -f "mailkit/.env" ]; then
    echo "ERROR: No se encuentra el archivo .env en mailkit/.env. Asegúrate de que existe."
    exit 1
fi

# --- Selección del Snapshot ---
# Usa el primer argumento como ID del snapshot, o "latest" si no se proporciona.
SNAPSHOT_ID=${1:-latest}
echo "Se restaurará el snapshot: ${SNAPSHOT_ID}"

# --- Confirmación del Usuario ---
read -p "¿Estás seguro de que quieres sobrescribir los datos actuales con esta copia de seguridad? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]
then
    echo "Restauración cancelada."
    exit 1
fi

# --- Ejecución de la Restauración ---
echo "Restaurando los datos de Restic al volumen de Stalwart..."
# Usamos un contenedor efímero de restic para la restauración.
# El volumen de destino /data se sobrescribirá.
sudo docker run --rm \
    --env-file mailkit/.env \
    -v ./mailkit/backups:/backups \
    -v ./mailkit/stalwart_data:/data \
    restic/restic restore ${SNAPSHOT_ID} --target /data

echo "### Restauración completada con éxito. ###"
echo "Asegúrate de reiniciar los servicios para que los cambios surtan efecto."
