# Configuración de Matrix Synapse y Element

La configuración de Synapse requiere generar primero un archivo `homeserver.yaml`.

## 1. Generar `homeserver.yaml`

Ejecuta el siguiente comando para generar el archivo de configuración. Esto creará un volumen de Docker llamado `synapse-data` y colocará el archivo `homeserver.yaml` dentro de él.

```bash
sudo docker run -it --rm \
    --mount type=volume,src=synapse-data,dst=/data \
    -e SYNAPSE_SERVER_NAME=chat.tudominio.com \
    -e SYNAPSE_REPORT_STATS=yes \
    matrixdotorg/synapse:latest generate
```

**Nota:** Necesitarás `sudo` para ejecutar este comando, ya que interactúa con el demonio de Docker.

## 2. Mover el archivo de configuración

Una vez generado, necesitas mover el archivo `homeserver.yaml` del volumen de Docker a tu directorio de configuración de `mailkit`.

Primero, crea el directorio:

```bash
mkdir -p mailkit/synapse
```

Luego, encuentra la ruta del volumen de Docker:

```bash
sudo docker volume inspect synapse-data
```

Esto te dará una salida JSON. Busca el valor de `Mountpoint`.

Finalmente, copia el archivo:

```bash
sudo cp <ruta_del_mountpoint>/homeserver.yaml mailkit/synapse/
```

## 3. Modificar `docker-compose.prod.yml`

Actualiza el servicio `synapse` en tu archivo `docker-compose.prod.yml` para montar el archivo de configuración que acabas de mover:

```yaml
  synapse:
    image: matrixdotorg/synapse:latest
    restart: unless-stopped
    volumes:
      - ./synapse/homeserver.yaml:/data/homeserver.yaml
      - synapse_media:/data/media
```

También necesitarás agregar `synapse_media` a tu lista de volúmenes.

## 4. Iniciar los servicios

Inicia todos los servicios usando `docker compose up -d`.

## 5. Configurar Element

Una vez que Synapse esté en funcionamiento, puedes configurar Element. No se necesita ninguna configuración del lado del servidor para Element. Simplemente navega a `http://element.tudominio.com` en tu navegador.

En la pantalla de inicio de sesión de Element, haz clic en "Editar" junto a "Homeserver" e introduce `http://chat.tudominio.com`. Luego puedes crear una cuenta y empezar a chatear.
