# MailiaCreate Platform

> **Estado del proyecto:** ✅ _Completado_ — listo para clonar y desplegar en entornos Debian o Ubuntu con soporte oficial mediante Docker Compose.

MailiaCreate es una suite de colaboración y correo empresarial basada en Stalwart Mail que entrega webmail estilo Gmail, paneles de administración y operaciones, chat Matrix, videollamadas Jitsi, almacenamiento compatible con S3 y automatización de backups en un único repositorio.

---

## Visión y misión

- **Visión:** proporcionar una experiencia de mensajería y colaboración moderna, segura y extensible, comparable a suites comerciales, pero sustentada en tecnología abierta escrita en Rust y desplegable en infraestructura propia.
- **Misión:** ofrecer una implementación lista para producción que pueda clonarse, instalarse y operar sin fricciones, incorporando automatización, observabilidad, cumplimiento y herramientas de productividad en un solo stack.

---

## Tabla de contenido

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Arquitectura y servicios](#arquitectura-y-servicios)
3. [Puesta en marcha rápida](#puesta-en-marcha-rápida)
4. [Operaciones clave](#operaciones-clave)
5. [Funcionalidades combinadas](#funcionalidades-combinadas)
6. [Aseguramiento de la calidad](#aseguramiento-de-la-calidad)
7. [Documentación adicional](#documentación-adicional)

---

## Resumen ejecutivo

- **Stack principal:** Stalwart Mail (JMAP/IMAP/SMTP) + Next.js (webmail, panel admin, panel IT) + Keycloak (SSO) + Matrix/Element + Jitsi + Nextcloud + MinIO + suite de observabilidad (Prometheus, Grafana, Loki, Alertmanager) + automatización de backups Restic.
- **Seguridad por defecto:** TLS extremo a extremo, cabeceras endurecidas, integración DKIM/DMARC/SPF, controles RBAC, auditoría de accesos y exportaciones.
- **Productividad:** webmail con interfaz de tres paneles, etiquetas, búsqueda avanzada; panel admin con gestión completa de dominios y usuarios; panel IT para métricas, logs y backups.
- **Automatización:** instalador asistido, scripts de despliegue/backup/restore, send-router multi-canal con IA preventiva, scheduler Restic y reglas de alerta listas para usar.

---

## Arquitectura y servicios

El archivo [`compose/docker-compose.prod.yml`](compose/docker-compose.prod.yml) describe un despliegue listo para producción, organizado en los siguientes dominios funcionales:

| Dominio | Servicios principales | Descripción |
|---------|----------------------|-------------|
| **Proxy & SSO** | `caddy`, `keycloak` | Proxy TLS automático con Let\'s Encrypt, autenticación centralizada OIDC. |
| **Correo & Webmail** | `stalwart`, `webmail` | Core de correo en Rust con protocolos modernos, cliente JMAP estilo Gmail. |
| **Administración** | `admin-panel` | Next.js protegido por Keycloak para CRUD de dominios/usuarios y exportaciones asíncronas. |
| **Operaciones** | `it-panel`, `grafana`, `prometheus`, `loki`, `promtail`, `alertmanager`, `cadvisor`, `node-exporter` | Monitoreo, alertas, trazabilidad y tableros listos. |
| **Colaboración** | `synapse`, `element`, `jitsi-web`, `nextcloud`, `nextcloud-db`, `redis` | Chat Matrix con Element Web, videollamadas Jitsi y suite Nextcloud para archivos y calendarios. |
| **Automatización & Almacenamiento** | `send-router`, `send-router-redis`, `ai-orchestrator`, `minio`, `restic-scheduler` | Enrutamiento multi-canal con IA, almacenamiento S3 y orquestación de backups Restic. |

Todos los servicios se entregan mediante contenedores Docker y comparten un archivo `.env` parametrizable (`compose/.env`).

---

## Puesta en marcha rápida

> Diseñado para que «clonar y ejecutar» sea suficiente en servidores Debian 12 o Ubuntu 22.04+ con privilegios `sudo`.

1. **Instalación automática (recomendada):**
   ```bash
   export MAILIACREATE_REPO=https://github.com/<tu-organizacion>/mailiacreate.git
   curl -fsSL https://raw.githubusercontent.com/<tu-organizacion>/mailiacreate/main/scripts/install.sh | sudo bash
   ```
   - Valida el sistema, instala/recupera dependencias (Docker, Git, curl, gpg), corrige servicios detenidos y levanta el stack completo en `/opt/mailiacreate`.
   - Incluye reintentos automáticos para `apt-get`, arranque asistido de Docker y reporte detallado de errores con sugerencias.

2. **Despliegue manual:**
   ```bash
   git clone https://github.com/<tu-organizacion>/mailiacreate.git
   cd mailiacreate
   cp compose/.env.example compose/.env
   sudo ./scripts/deploy.sh
   ```

3. **Accesos iniciales:**
   - Webmail: `https://mail.<dominio>/`
   - Panel Admin: `https://mail.<dominio>/admin`
   - Panel IT: `https://mail.<dominio>/it`
   - Chat (Element): `https://chat.<dominio>`
   - Nextcloud: `https://cloud.<dominio>`
   - Grafana: `https://grafana.<dominio>`

> Ajusta dominios, credenciales y certificados en `compose/.env` antes de exponer el entorno en producción. El script `scripts/hardening-check.sh` valida credenciales, cabeceras y configuración de seguridad básica.

---

## Operaciones clave

- **Backups & Restore:**
  ```bash
  ./scripts/backup.sh               # genera snapshots de volúmenes
  ./scripts/restore.sh backups/ID   # restaura un snapshot específico
  ```
- **Verificación de hardening:**
  ```bash
  ./scripts/hardening-check.sh
  ```
- **Send Router API:**
  ```bash
  curl -X POST https://mail.example.com/api/send \
    -H "Authorization: Bearer <token>" \
    -F channel=webhook \
    -F to=https://webhook.site/xxxx \
    -F text="Hola mundo"
  ```
  - Consulta de entregas: `GET /api/jobs/<JOB_ID>`
  - Integración con IA (`SEND_ROUTER_AI_URL`) para rechazar envíos de riesgo.

---

## Funcionalidades combinadas

La suite está pensada para que los servicios se potencien entre sí desde el primer arranque. Algunas combinaciones clave:

- **Correo + Colaboración en vivo:** los usuarios pueden pasar de un hilo de correo en el webmail a una sala de Matrix o a una videollamada Jitsi con un solo clic desde los enlaces contextuales configurados en el panel admin, manteniendo la autenticación centralizada mediante Keycloak.
- **Automatización + Observabilidad:** cada envío gestionado por `send-router` genera métricas y logs estructurados que se visualizan automáticamente en Grafana, con alertas preconfiguradas en Prometheus para detectar picos de error, saturación de colas o bloqueos de IA.
- **Backups + Almacenamiento S3:** las copias restic programadas pueden replicarse en MinIO o en un endpoint S3 externo, y los paneles permiten consultar el historial y disparar restauraciones selectivas sobre los volúmenes críticos del core de correo y Nextcloud.
- **Seguridad + Cumplimiento:** el script de hardening revisa cabeceras, políticas TLS y credenciales débiles; ante hallazgos, sugiere correcciones inmediatas y puede ejecutarse desde el panel IT para adjuntar evidencias en auditorías.
- **Productividad + APIs:** el panel admin expone exportaciones de buzón y resultados de auditoría vía API, lo que permite integrarlo con herramientas de terceros (por ejemplo, automatizar onboarding/offboarding desde un sistema de RR.HH.).

Cada integración está descrita en los playbooks operativos y puede ampliarse con drivers adicionales (webhooks, almacenamiento externo, nuevos canales del send-router) sin abandonar la experiencia “clonar y ejecutar”.

---

## Aseguramiento de la calidad

La pasada de QA final (`docs/QA/REGRESION_FINAL.md`) certifica que:

- Los microservicios Node (`send-router`, `ai-orchestrator`, `restic-scheduler`) superan validaciones `node --check`.
- El script `scripts/hardening-check.sh` confirma políticas de seguridad predeterminadas.
- Las instalaciones `npm install` de los paneles Next.js fueron verificadas, con la salvedad de que requieren acceso al registro npm desde el entorno donde se ejecuten.

Cada fase del roadmap cuenta con evidencia de QA dedicada en [`docs/QA/`](docs/QA), asegurando cobertura desde la fundación del stack hasta la automatización avanzada.

---

## Documentación adicional

- **Plan de desarrollo por fases:** [`docs/DESARROLLO_PLAN.md`](docs/DESARROLLO_PLAN.md)
- **Playbook operativo:** [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- **Evidencias de QA por fase:** [`docs/QA/`](docs/QA)
- **Configuración de servicios:**
  - Caddy: [`config/caddy/Caddyfile`](config/caddy/Caddyfile)
  - Prometheus: [`config/prometheus/`](config/prometheus)
  - Grafana: [`config/grafana/`](config/grafana)
  - Stalwart Mail: [`config/stalwart/config.toml`](config/stalwart/config.toml)
  - Matrix Synapse: [`config/synapse/`](config/synapse)

