# Configuración de Jitsi Meet

Jitsi Meet se despliega utilizando su propio archivo `docker-compose.jitsi.yml` y se configura principalmente a través de un archivo de entorno.

## 1. Crear el archivo de entorno

Copia el archivo de ejemplo que he proporcionado a un nuevo archivo llamado `.env.jitsi`:

```bash
cp mailkit/.env.jitsi.example mailkit/.env.jitsi
```

Luego, edita `mailkit/.env.jitsi` y cambia las contraseñas (`changeme`) por valores seguros.

## 2. Iniciar la pila de Jitsi

Para iniciar Jitsi, ejecuta el siguiente comando desde la raíz de tu proyecto:

```bash
sudo docker compose -f mailkit/docker-compose.jitsi.yml --env-file mailkit/.env.jitsi up -d
```

**Nota:** Necesitarás `sudo` para ejecutar este comando, ya que interactúa con el demonio de Docker.

## 3. Acceder a Jitsi Meet

Una vez que los contenedores se estén ejecutando, podrás acceder a tu instancia de Jitsi Meet en `https://meet.tudominio.com`. Deberías poder crear una nueva reunión y unirte a ella.

## 4. Integración con el proxy Caddy

El archivo `Caddyfile` que he proporcionado ya incluye una entrada para `meet.tudominio.com` que dirigirá el tráfico al contenedor web de Jitsi. Sin embargo, Jitsi requiere una configuración de proxy inverso más compleja para funcionar correctamente, especialmente para el tráfico de WebRTC.

Necesitarás actualizar la entrada de Caddy para que se vea así:

```caddy
meet.tudominio.com {
    # Proxy a Jitsi Meet
    reverse_proxy web:80 {
        # Necesario para WebSockets
        header_up X-Forwarded-For {remote_host}
    }

    # Proxy a la API de Jitsi
    reverse_proxy /http-bind prosody:5280 {
        # Necesario para BOSH
        header_up X-Forwarded-For {remote_host}
    }
}
```

Esta es una configuración simplificada. Para un entorno de producción, especialmente uno detrás de NAT, es posible que necesites configurar un servidor TURN.
