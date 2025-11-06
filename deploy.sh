#!/bin/bash
set -e

# Crear la red externa de Docker si no existe
docker network inspect mailkit_net >/dev/null 2>&1 || docker network create mailkit_net

# Iniciar la pila principal
sudo docker compose -f mailkit/docker-compose.prod.yml --env-file mailkit/.env up -d

# Iniciar la pila de Jitsi
sudo docker compose -f mailkit/docker-compose.jitsi.yml --env-file mailkit/.env.jitsi up -d
