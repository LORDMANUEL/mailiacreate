#!/bin/bash
set -e

echo "### Iniciando despliegue de la MailKit Rust Suite ###"

# --- Comprobaciones de Prerrequisitos ---
if [ ! -f "mailkit/.env" ] || [ ! -f "mailkit/.env.jitsi" ]; then
    echo "ERROR: Faltan los archivos de entorno. Por favor, copia .env.example a .env y .env.jitsi.example a .env.jitsi y rellena los valores."
    exit 1
fi

# --- Gestión de la Red ---
echo "Verificando la red de Docker..."
docker network inspect mailkit_net >/dev/null 2>&1 || {
    echo "Creando red externa 'mailkit_net'..."
    docker network create mailkit_net
}

# --- Despliegue de los Servicios ---
echo "Iniciando la pila principal de servicios (Stalwart, Caddy, etc.)..."
sudo docker compose -f mailkit/docker-compose.prod.yml --env-file mailkit/.env up -d

echo "Iniciando la pila de servicios de Jitsi Meet..."
sudo docker compose -f mailkit/docker-compose.jitsi.yml --env-file mailkit/.env.jitsi up -d

echo "### Despliegue completado con éxito. ###"
echo "Puede tardar unos minutos para que todos los servicios estén completamente disponibles."
