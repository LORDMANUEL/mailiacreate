# Operaciones MailiaCreate

## Variables relevantes (`compose/.env`)

- `DOMAIN_BASE`: dominio raíz (ej. `example.com`).
- `ADMIN_EMAIL`: email para notificaciones/certificados.
- `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`: credenciales iniciales SSO.
- `JMAP_ENDPOINT`: URL pública del endpoint JMAP.

## Instalador

- Variables disponibles:
  - `MAILIACREATE_REPO`: URL git a clonar.
  - `MAILIACREATE_HOME`: directorio destino (default `/opt/mailiacreate`).
- Ejemplo: `MAILIACREATE_HOME=/srv/mailiacreate MAILIACREATE_REPO=https://github.com/<tu-organizacion>/mailiacreate.git sudo bash scripts/install.sh`.

## Flujo posterior al despliegue

1. Accede a Keycloak (`https://sso.<dominio>`) y crea realm/clients para Webmail, Admin e IT.
2. Ingresa a Stalwart Admin (`https://mail.<dominio>/admin`) y crea dominios/usuarios.
3. Configura DNS (A/AAAA, MX, SRV, `_dmarc`, `_domainkey`).
4. Importa paneles en Grafana desde `docs/grafana` (pendiente) o crea dashboards básicos.
5. Ejecuta `./scripts/backup.sh` y valida `./scripts/restore.sh <ruta>`.

## Integración send-router

El servicio expone `POST /api/send` con los campos:

- `channel`: `email`, `matrix`, `webhook`, `storage`.
- `to`: lista de destinos.
- `subject`, `text`, `html`.
- `attachments`: archivos (multipart) o referencias S3.

Para activar almacenamiento externo, define `SEND_ROUTER_STORAGE=minio,s3` y proporciona credenciales via `docker secrets` o variables.

## Mantenimiento

- **Actualizar imágenes**: `docker compose -f compose/docker-compose.prod.yml pull && docker compose -f compose/docker-compose.prod.yml up -d`.
- **Logs**: `docker compose -f compose/docker-compose.prod.yml logs -f <servicio>`.
- **Agregar certificados personalizados**: monta directorio en servicio `caddy` con TLS manual.
- **Escalado**: utiliza `docker compose up -d --scale webmail=2` y configura balanceo en Caddy.
