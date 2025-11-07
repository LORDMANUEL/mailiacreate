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
- `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`: credenciales para el almacenamiento S3 interno.
- `SEND_ROUTER_WEBHOOK_TOKEN`: token compartido para asegurar webhooks salientes.
- `SEND_ROUTER_SMTP_FROM`, `SEND_ROUTER_SMTP_HOST/PORT`: remitente y relay usados por send-router.
- `SEND_ROUTER_AI_URL`, `SEND_ROUTER_AI_THRESHOLD`: controlan el análisis previo de IA.
- `DEPLOYMENT_PROFILE`: perfil seleccionado por el instalador (`domain`, `internal_ip`, `public_ip`).

## Instalador

- Ejecuta `sudo ./scripts/install.sh` tras clonar el repositorio. El asistente instala Docker, clona en `/opt/mailiacreate/project`, solicita si usar IP interna, IP pública o dominios y completa el resto automáticamente.
- Opcionalmente puedes definir `MAILIACREATE_HOME=/ruta/custom` antes de ejecutar el script para usar otra ubicación de instalación.

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

Internamente send-router usa BullMQ con un backend Redis dedicado (`send-router-redis`). Puedes supervisar los jobs con `GET /api/jobs/<id>` o consultando las métricas en `/metrics` (scrapeadas por Prometheus).

Para activar almacenamiento externo, define `SEND_ROUTER_STORAGE=minio` y proporciona credenciales vía variables de entorno (`SEND_ROUTER_S3_*`).

Si configuras `SEND_ROUTER_AI_URL`, cada mensaje pasa por `ai-orchestrator`; valores de riesgo superiores a `SEND_ROUTER_AI_THRESHOLD` pueden bloquear la entrega cuando `SEND_ROUTER_AI_ENFORCE=true`.

### Retroalimentación de IA

- Endpoint: `POST http://ai-orchestrator:4100/api/feedback`
- Cuerpo esperado:
  ```json
  {
    "messageId": "<uuid|Message-ID>",
    "label": "low|medium|high",
    "indicators": ["spam", "phishing"],
    "notes": "Comentario opcional"
  }
  ```
- Los registros se almacenan en `data/feedback.json` dentro del contenedor y alimentan la métrica `ai_orchestrator_feedback_total{label=...}` para ajustar umbrales.

## Mantenimiento

- **Actualizar imágenes**: `docker compose -f compose/docker-compose.prod.yml pull && docker compose -f compose/docker-compose.prod.yml up -d`.
- **Logs**: `docker compose -f compose/docker-compose.prod.yml logs -f <servicio>`.
- **Panel Admin**: disponible en `https://mail.<dominio>/admin`. Desde ahí puedes crear dominios/usuarios, bloquear cuentas y lanzar exportaciones con auditoría.
- **Panel IT**: disponible en `https://mail.<dominio>/it`. Consume Prometheus/Loki/Restic para mostrar colas SMTP, latencias JMAP y estado de backups.
- **Nextcloud**: después del primer inicio, ejecuta `occ maintenance:install` si es necesario o usa el asistente web. Sincroniza usuarios mediante la app OIDC Social Login apuntando a Keycloak.
- **Alertas**: Alertmanager reenvía eventos a `send-router` (`/api/hooks/alerts`). Ajusta integraciones adicionales según tus flujos.
- **Agregar certificados personalizados**: monta directorio en servicio `caddy` con TLS manual.
- **Escalado**: utiliza `docker compose up -d --scale webmail=2` y configura balanceo en Caddy.

## Automatización CI/CD

- `./scripts/hardening-check.sh --ci` y `./scripts/synthetic-checks.sh` se ejecutan en el workflow `.github/workflows/ci.yml` junto con `npm run build` para los paneles, reutilizando cachés de dependencias y firmando los artefactos `.next` con Cosign.
- Las imágenes de `admin-panel`, `it-panel`, `send-router`, `ai-orchestrator`, `restic-scheduler`, `scim-bridge` y `synthetic-exporter` se construyen (linux/amd64, linux/arm64, linux/arm64/v8) y se firman desde `.github/workflows/release-images.yml` al publicar tags `v*.*.*` en GitHub. Tras cada release se lanza un smoke test en runners ARM reales.
- El workflow `restore-check.yml` corre de manera programada para crear un backup multi-inquilino, eliminar datos de prueba y validar la restauración de volúmenes críticos comparando checksums antes/después.
- Para despliegues masivos, integra estos workflows con tu inventario Ansible o plataforma GitOps consumiendo las imágenes firmadas publicadas en GHCR.

## Sincronización de identidades

- Usa Keycloak como autoridad central y habilita el conector SCIM: `Realm Settings > User Registration > SCIM`.
- Despliega el servicio `scim-bridge`, configurando `SCIM_CLIENT_ID/SECRET` (cliente confidencial en Keycloak) y las credenciales de Stalwart (`STALWART_ADMIN_USER/PASSWORD`). El bridge gestiona `POST/PATCH/DELETE /scim/v2/Users` para altas, bajas y reactivaciones, sincroniza grupos Keycloak y asegura membresías en Stalwart.
- Configura Stalwart con `ADMIN_API_TOKEN` y apunta el panel admin a `STALWART_ADMIN_API` para reflejar altas/bajas y pertenencias de grupos.
- El flujo recomendado es: HRIS → Keycloak (SCIM) → `scim-bridge` → Stalwart (`POST /users`, `POST /groups`) y paneles Next.js. Las desactivaciones en HRIS bloquean el usuario, limpian membresías y eliminan el buzón en Stalwart.

## Monitorización sintética avanzada

- El servicio `synthetic-exporter` ejecuta `scripts/synthetic-checks.sh --json` contra `SYNTHETIC_TARGET_HOST` y expone métricas Prometheus en `:8090/metrics`, incluyendo `synthetic_check_duration_milliseconds`.
- Ajusta `SYNTHETIC_EXTRA_ARGS="--skip-tls"` para despliegues con certificados auto-firmados o laboratorios IP-only.
- Programa el script manualmente si quieres redundancia adicional:
  ```cron
  */5 * * * * root /opt/mailiacreate/scripts/synthetic-checks.sh --host mail.ejemplo.com --json > /var/log/mailiacreate/synthetic.json
  ```
- Prometheus recopila `synthetic_overall_status` y las duraciones; la regla `SyntheticChecksFailing` enciende alertas críticas tras 5 minutos de fallos continuos y Grafana muestra tiempos de roundtrip correo extremo a extremo.

## Hardening previo a producción

- Ejecuta `./scripts/hardening-check.sh` y corrige cualquier advertencia de credenciales.
- Verifica cabeceras con `curl -I https://mail.<dominio>` asegurando que HSTS/CSP estén presentes.
- Actualiza los valores por defecto (`change_me`, `replace_me`) antes de exponer los servicios.
