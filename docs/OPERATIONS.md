# Operaciones MailiaCreate

## Variables relevantes (`compose/.env`)

- `DOMAIN_BASE`: dominio raíz (ej. `example.com`).
- `ADMIN_EMAIL`: email para notificaciones/certificados.
- `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`: credenciales iniciales SSO.
- `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`: realm y cliente usados por paneles/Matrix.
- `KEYCLOAK_ADMIN_CLIENT_ID/SECRET`, `KEYCLOAK_IT_CLIENT_ID/SECRET`: clientes dedicados para paneles.
- `JMAP_ENDPOINT`: URL pública del endpoint JMAP.
- `NEXTCLOUD_ADMIN_USER`, `NEXTCLOUD_ADMIN_PASSWORD`: credenciales iniciales de Nextcloud.
- `PROMETHEUS_BASIC_AUTH`: credenciales básicas si expones Prometheus.
- `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`: valores consumidos por el scheduler de backups.
- `RESTIC_STATUS_URL`: endpoint HTTP que consulta el panel IT (por defecto el scheduler interno).
- `MATRIX_REGISTRATION_SHARED_SECRET`: secreto compartido para registros Matrix.

## Instalador

- Variables disponibles:
  - `MAILIACREATE_REPO`: URL git a clonar.
  - `MAILIACREATE_HOME`: directorio destino (default `/opt/mailiacreate`).
- Ejemplo: `MAILIACREATE_HOME=/srv/mailiacreate MAILIACREATE_REPO=https://github.com/<tu-organizacion>/mailiacreate.git sudo bash scripts/install.sh`.

## Flujo posterior al despliegue

1. Accede a Keycloak (`https://sso.<dominio>`) y crea el *realm* definido en `.env`. Registra clientes `mail-suite-admin`, `mail-suite-it`, `webmail`, `matrix-synapse`, `nextcloud` con redirect URIs según dominios.
2. Ingresa a Stalwart Admin (`https://mail.<dominio>/admin`) y crea dominios/usuarios base. El panel admin puede gestionar entidades adicionales.
3. Configura Nextcloud (`https://cloud.<dominio>`) habilitando CardDAV/CalDAV y conectores OIDC (app `sociallogin`).
4. Ajusta Matrix Synapse (`matrix.example.com/_matrix/client`) para validar redirecciones Keycloak y registra Element en `chat.<dominio>`.
5. Configura DNS (A/AAAA, MX, SRV, `_dmarc`, `_domainkey`, `matrix`, `autodiscover`, `autoconfig`).
6. Grafana ya provisiona dashboards y datasources desde `config/grafana`. Revisa panel “MailiaCreate Overview” en `https://grafana.<dominio>`.
7. Ejecuta `./scripts/backup.sh` y valida `./scripts/restore.sh <ruta>`. Puedes lanzar backups en caliente con `curl -X POST http://localhost:8000/run` dentro del contenedor `restic-scheduler`.

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
- **Panel Admin**: disponible en `https://mail.<dominio>/admin`. Desde ahí puedes crear dominios/usuarios, bloquear cuentas y lanzar exportaciones con auditoría.
- **Panel IT**: disponible en `https://mail.<dominio>/it`. Consume Prometheus/Loki/Restic para mostrar colas SMTP, latencias JMAP y estado de backups.
- **Nextcloud**: después del primer inicio, ejecuta `occ maintenance:install` si es necesario o usa el asistente web. Sincroniza usuarios mediante la app OIDC Social Login apuntando a Keycloak.
- **Alertas**: Alertmanager reenvía eventos a `send-router` (`/api/hooks/alerts`). Ajusta integraciones adicionales según tus flujos.
- **Agregar certificados personalizados**: monta directorio en servicio `caddy` con TLS manual.
- **Escalado**: utiliza `docker compose up -d --scale webmail=2` y configura balanceo en Caddy.
