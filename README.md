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
2. [Resumen funcional](#resumen-funcional)
3. [Arquitectura y servicios](#arquitectura-y-servicios)
4. [Puesta en marcha rápida](#puesta-en-marcha-rápida)
5. [Operaciones clave](#operaciones-clave)
6. [Funcionalidades combinadas](#funcionalidades-combinadas)
7. [Resultados de QA](#resultados-de-qa)
8. [Mejoras recomendadas](#mejoras-recomendadas)
9. [Documentación adicional](#documentación-adicional)

---

## Resumen ejecutivo

- **Stack principal:** Stalwart Mail (JMAP/IMAP/SMTP) + Next.js (webmail, panel admin, panel IT) + Keycloak (SSO) + Matrix/Element + Jitsi + Nextcloud + MinIO + suite de observabilidad (Prometheus, Grafana, Loki, Alertmanager) + automatización de backups Restic.
- **Seguridad por defecto:** TLS extremo a extremo, cabeceras endurecidas, integración DKIM/DMARC/SPF, controles RBAC, auditoría de accesos y exportaciones.
- **Productividad:** webmail con interfaz de tres paneles, etiquetas, búsqueda avanzada; panel admin con gestión completa de dominios y usuarios; panel IT para métricas, logs y backups.
- **Automatización:** instalador asistido, scripts de despliegue/backup/restore, send-router multi-canal con IA preventiva, scheduler Restic y reglas de alerta listas para usar.
- **Ciclo CI/CD:** workflows GitHub Actions para linting, validación de Docker Compose y publicación de imágenes firmadas en GHCR.
- **Identidad & observabilidad:** bridge SCIM que provisiona usuarios HRIS → Keycloak → Stalwart y exporter sintético con métricas Prometheus para validar servicios externos.

---

## Resumen funcional

MailiaCreate orquesta un entorno colaborativo completo para organizaciones que desean operar su propia plataforma de correo y productividad sin depender de SaaS privativos. El despliegue base incluye:

- **Correo empresarial completo:** dominio propio servido por Stalwart Mail con protocolos modernos, filtros anti-spam integrados y soporte de firmas y alias múltiples.
- **Webmail estilo Gmail:** interfaz Next.js responsiva con bandejas, etiquetas, búsqueda avanzada, arrastre de adjuntos y gestión de firmas centralizada.
- **Comunicación en tiempo real:** chat corporativo mediante Matrix/Element, videoconferencias con Jitsi y rooms accesibles desde el webmail y los paneles.
- **Colaboración documental:** Nextcloud para archivos, calendarios CalDAV y contactos/vCards sincronizados con clientes móviles y de escritorio.
- **Automatización y extensibilidad:** send-router con colas, IA preventiva y drivers para email, Matrix, webhooks y almacenamiento S3, además de APIs administrativas documentadas.
- **Identidad centralizada:** servicio SCIM bridge que sincroniza altas/bajas de RR.HH. con Keycloak y Stalwart, garantizando que paneles, Matrix y correo mantengan el mismo ciclo de vida.
- **Operación y cumplimiento:** paneles Admin e IT protegidos por Keycloak, auditoría completa, backups Restic programables y observabilidad centralizada con Prometheus/Grafana/Loki.

Todo el stack está pensado para ser clonado, instalado y puesto en marcha en cuestión de minutos sobre Debian o Ubuntu, quedando listo para uso productivo.

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

- Diseñado para que «clonar y ejecutar» sea suficiente en servidores Debian 12 o Ubuntu 22.04+ con privilegios `sudo`.

### 1. Instalación automática (recomendada)

```bash
git clone https://github.com/mailiacreate/mailiacreate.git
cd mailiacreate
sudo ./scripts/install.sh
```

El instalador únicamente te solicita:

1. Elegir si desplegarás con **IP interna**, **IP pública** o **dominios**.
2. Indicar la IP o el dominio base según la opción anterior.

Con esa información instala Docker y dependencias, prepara `compose/.env`, actualiza las configuraciones de Stalwart/Synapse y levanta todo el stack automáticamente.

**Modalidades disponibles**

| Modo | Cuándo usarlo | Resultado |
|------|----------------|-----------|
| **Dominios (producción con TLS)** | Servidores con DNS público apuntando a la máquina | Caddy obtiene certificados Let's Encrypt y expone los servicios en `https://mail.<dominio>`, `https://chat.<dominio>`, etc. |
| **IP pública** | Pruebas rápidas en una máquina expuesta por IP sin DNS configurado | El instalador ajusta la IP indicada, habilita HTTP plano en `http://<ip>:8080-8086` y aplica el override local correspondiente. |
| **IP interna** | Laboratorios privados, VMs o equipos sin salida directa | Igual que el modo IP pública, pensado para redes internas o NAT. |

**Servicios listos tras la instalación**

- Core de correo Stalwart con tu dominio y protocolos Submission/IMAPS expuestos.
- Webmail estilo Gmail, paneles Admin/IT con SSO, send-router con IA preventiva y automatización de backups Restic.
- Suite colaborativa: Matrix/Element, Jitsi Meet, Nextcloud (archivos/vCards/CalDAV) y almacenamiento MinIO.
- Identidad automatizada: bridge SCIM accesible en `https://mail.<dominio>/scim` para sincronizar Keycloak ↔ Stalwart.
- Observabilidad integrada: Prometheus, Grafana, Loki, exporter sintético y alertas preconfiguradas.

### 2. Despliegue manual

```bash
git clone https://github.com/mailiacreate/mailiacreate.git
cd mailiacreate
cp compose/.env.example compose/.env
sudo ./scripts/deploy.sh
```

El script detecta si `compose/.env` tiene `LOCAL_MODE=true` para decidir si aplica el override `docker-compose.local.yml`.

### 3. Accesos iniciales

**Modo producción (dominios):**
- Webmail & paneles: `https://mail.<dominio>/`
- Chat (Element): `https://chat.<dominio>`
- Nextcloud: `https://cloud.<dominio>`
- Grafana: `https://grafana.<dominio>`

**Modo IP (interna o pública):**
- Webmail + paneles + JMAP: `http://<ip>:8080`
- Keycloak SSO: `http://<ip>:8081`
- Element (chat): `http://<ip>:8082`
- Matrix Synapse (API): `http://<ip>:8083`
- Jitsi: `http://<ip>:8084`
- Nextcloud: `http://<ip>:8085`
- Grafana: `http://<ip>:8086`
- El dominio de correo se inicializa como `mailiacreate.local`; puedes modificarlo en `compose/.env` si prefieres otro valor para pruebas.

> Ajusta credenciales en `compose/.env` antes de exponer en producción. Después del despliegue ejecuta `./scripts/hardening-check.sh` para validar seguridad básica.

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
- **Validación sintética 24/7:**
  ```bash
  ./scripts/synthetic-checks.sh --host tu-dominio --skip-tls
  ```
  Ejecuta comprobaciones HTTP, IMAP/SMTP y vigila vencimiento de certificados.

---

## Funcionalidades combinadas

La suite está pensada para que los servicios se potencien entre sí desde el primer arranque. Algunas combinaciones clave:

- **Correo + Colaboración en vivo:** los usuarios pueden pasar de un hilo de correo en el webmail a una sala de Matrix o a una videollamada Jitsi con un solo clic desde los enlaces contextuales configurados en el panel admin, manteniendo la autenticación centralizada mediante Keycloak.
- **Automatización + Observabilidad:** cada envío gestionado por `send-router` genera métricas y logs estructurados que se visualizan automáticamente en Grafana, con alertas preconfiguradas en Prometheus para detectar picos de error, saturación de colas o bloqueos de IA.
- **Backups + Almacenamiento S3:** las copias restic programadas pueden replicarse en MinIO o en un endpoint S3 externo, y los paneles permiten consultar el historial y disparar restauraciones selectivas sobre los volúmenes críticos del core de correo y Nextcloud.
- **Seguridad + Cumplimiento:** el script de hardening revisa cabeceras, políticas TLS y credenciales débiles; ante hallazgos, sugiere correcciones inmediatas y puede ejecutarse desde el panel IT para adjuntar evidencias en auditorías.
- **Productividad + APIs:** el panel admin expone exportaciones de buzón y resultados de auditoría vía API, lo que permite integrarlo con herramientas de terceros (por ejemplo, automatizar onboarding/offboarding desde un sistema de RR.HH.).
- **Firmas y branding consistente:** las preferencias del webmail (firmas, alias y respuestas rápidas) se sincronizan con las identidades configuradas en Stalwart, mientras que Nextcloud centraliza plantillas corporativas y vCards para arrastrar y usar en los correos.

Cada integración está descrita en los playbooks operativos y puede ampliarse con drivers adicionales (webhooks, almacenamiento externo, nuevos canales del send-router) sin abandonar la experiencia “clonar y ejecutar”.

---

## Resultados de QA

La **regresión final** documentada en [`docs/QA/REGRESION_FINAL.md`](docs/QA/REGRESION_FINAL.md) avala que el estado “Completado” es reproducible. Los hitos principales fueron:

- ✅ Validaciones sintácticas `node --check` en `services/send-router`, `services/ai-orchestrator` y `services/restic-scheduler`.
- ✅ Ejecución de `scripts/hardening-check.sh --ci` y `scripts/synthetic-checks.sh --help` para comprobar credenciales, cabeceras y disponibilidad de endpoints.
- ⚠️ Intentos de `npm install` en los paneles Next.js anotados como advertencia: fallaron en el sandbox por bloqueo al registro npm, por lo que se recomienda repetirlos en entornos con salida a Internet tras clonar el proyecto.
- 🛠️ Integración continua: `.github/workflows/ci.yml` valida dependencias, linting y `docker compose config`; `.github/workflows/release-images.yml` construye y firma imágenes para GHCR cuando se etiquetan releases.
- 🔁 Nuevos flujos automáticos: `restore-check.yml` ejecuta pruebas programadas de backup/restore y la CI programada compila artefactos Next.js aprovechando cachés de dependencias.

Además, cada fase del roadmap posee su bitácora de QA dedicada en [`docs/QA/`](docs/QA), cubriendo desde el despliegue base (Fase 0) hasta la automatización avanzada (Fase 6).

---

## Mejoras recomendadas

Aun con el proyecto listo para producción, se sugieren iniciativas para profundizar la madurez operativa:

1. **Experiencia Gmail++:** consolidar el rediseño visual, dark mode y add-ons modulares descritos en el blueprint de mejoras.
2. **Automatización no-code:** empaquetar flujos n8n prediseñados que conecten webmail, Matrix y send-router con sistemas externos.
3. **Observabilidad con SLOs:** extender el exporter sintético con escenarios regionales y dashboards de fiabilidad por servicio.
4. **HA multi-inquilino:** avanzar hacia despliegues activos-activos, replicación y marketplace de integraciones empresariales.
5. **Gobierno de identidades:** completar autoservicio, ciclo de vida de grupos y sincronización SCIM avanzada.

Estos ítems no bloquean la salida a producción, pero ayudan a sostener un ciclo de mejora continua.

---

## Documentación adicional

- **Plan de desarrollo por fases:** [`docs/DESARROLLO_PLAN.md`](docs/DESARROLLO_PLAN.md)
- **Blueprint de mejoras:** [`docs/BLUEPRINT_MEJORAS.md`](docs/BLUEPRINT_MEJORAS.md)
- **Playbook operativo:** [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- **Evidencias de QA por fase:** [`docs/QA/`](docs/QA)
- **Configuración de servicios:**
  - Caddy: [`config/caddy/Caddyfile`](config/caddy/Caddyfile)
  - Prometheus: [`config/prometheus/`](config/prometheus)
  - Grafana: [`config/grafana/`](config/grafana)
  - Stalwart Mail: [`config/stalwart/config.toml`](config/stalwart/config.toml)
  - Matrix Synapse: [`config/synapse/`](config/synapse)

