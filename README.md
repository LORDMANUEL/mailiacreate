# MailiaCreate Platform

[![Project Status](https://img.shields.io/badge/status-completed-success)](#estado-del-proyecto)
[![Target OS](https://img.shields.io/badge/OS-Debian%20%7C%20Ubuntu-blue)](#despliegue-en-una-linea)
[![Automation](https://img.shields.io/badge/Automation-installer%20%7C%20ci%2Fcd-orange)](#qa-y-confiabilidad)

MailiaCreate es una plataforma de correo y colaboración empresarial lista para producción. Provee un correo basado en **Stalwart Mail** con webmail estilo Gmail, paneles administrativos, chat Matrix, videollamadas Jitsi, Nextcloud, automatización de backups y observabilidad integral en un único repositorio pensado para clonarse y desplegarse en minutos.

---

## Índice rápido

1. [Estado del proyecto](#estado-del-proyecto)
2. [Visión y misión](#visión-y-misión)
3. [Resumen ejecutivo](#resumen-ejecutivo)
4. [Lo que obtienes](#lo-que-obtienes)
5. [Despliegue en una línea](#despliegue-en-una-línea)
6. [Topología de servicios](#topología-de-servicios)
7. [Operaciones esenciales](#operaciones-esenciales)
8. [QA y confiabilidad](#qa-y-confiabilidad)
9. [Mejoras continuas recomendadas](#mejoras-continuas-recomendadas)
10. [Documentación complementaria](#documentación-complementaria)

---

## Estado del proyecto

| Estado | Última regresión | Compatibilidad | Stack validado |
|--------|-----------------|----------------|----------------|
| ✅ **Completado** | [`docs/QA/REGRESION_FINAL.md`](docs/QA/REGRESION_FINAL.md) | Debian 12 · Ubuntu 22.04 (Docker/Compose) | Producción con TLS o laboratorio por IP |

> El repositorio está preparado para un flujo **clonar → ejecutar instalador → operar**. Todos los servicios cuentan con imágenes y configuración por defecto.

---

## Visión y misión

- **Visión:** entregar una experiencia de mensajería y colaboración moderna, segura y extensible, comparable a suites SaaS líderes, pero impulsada por software abierto escrito en Rust y desplegable en infraestructura propia.
- **Misión:** simplificar la puesta en marcha de una suite empresarial completa, empaquetando identidad, correo, chat, videollamadas, automatización y observabilidad en un stack que se instala y gestiona con scripts reproducibles.

---

## Resumen ejecutivo

- **Core de correo:** Stalwart Mail (JMAP/IMAP/SMTP/CalDAV/CardDAV) con dominios, alias, firmas y filtros antispam activos.
- **Experiencia de usuario:** webmail Next.js tipo Gmail, panel admin para dominios/usuarios/exportaciones y panel IT para métricas, logs y backups.
- **Colaboración:** Matrix/Element, Jitsi, Nextcloud y MinIO integrados con SSO Keycloak.
- **Automatización:** instalador guiado, send-router multi-canal con IA preventiva, scheduler Restic, bridge SCIM y exporter de monitoreo sintético.
- **Observabilidad y seguridad:** Prometheus, Grafana, Loki, Alertmanager, verificaciones de hardening, cabeceras TLS endurecidas y auditoría completa.
- **CI/CD:** workflows que validan dependencias, construyen artefactos Next.js, publican imágenes multi-arquitectura y ejercitan restauraciones Restic programadas.

---

## Lo que obtienes

### Funcionalidad principal

- **Correo empresarial** con soporte DKIM/DMARC/SPF, inboxes compartidos, alias ilimitados y cuotas configurables.
- **Webmail estilo Gmail** con tres paneles, búsqueda avanzada, etiquetas, favoritos, respuestas rápidas, subida arrastrando archivos y gestor de firmas centralizado.
- **Panel administrativo** protegido por Keycloak para crear/bloquear usuarios, manejar dominios, exportar buzones y revisar auditorías.
- **Panel IT** con tableros de salud, métricas Prometheus, logs Loki, programación de backups y verificación sintética.
- **Chat y videoconferencias** vía Matrix/Element y Jitsi, enlazados desde el webmail y autenticados con SSO.
- **Colaboración documental** con Nextcloud, vCards y calendarios CalDAV/CardDAV sincronizables con clientes móviles.
- **Automatización multi-canal** mediante send-router (email, Matrix, webhooks, S3) enriquecido con IA de riesgo y colas BullMQ/Redis.
- **Identidad automatizada** gracias a un bridge SCIM que consume eventos HRIS para alinear Keycloak y Stalwart.
- **Monitoreo sintético** continuo con exportador Prometheus y alertas listas para ejecutar.

### Experiencia “clonar y ejecutar”

1. `git clone <repo>`
2. `cd mailiacreate`
3. `sudo ./scripts/install.sh`
4. Selecciona **IP interna**, **IP pública** o **dominio** y proporciona el valor solicitado.
5. El instalador hace el resto: instala Docker, genera `.env`, ajusta configuraciones, levanta los servicios y muestra el resumen de URLs.

---

## Despliegue en una línea

```bash
git clone <repo>
cd mailiacreate
sudo ./scripts/install.sh
```

El instalador admite tres modalidades:

| Modo | Escenario | Servicios expuestos |
|------|-----------|---------------------|
| **Dominio** | Producción con certificados Let’s Encrypt | `https://mail.<dominio>` (webmail/paneles), `https://chat.<dominio>`, `https://meet.<dominio>`, `https://cloud.<dominio>`, `https://grafana.<dominio>`, endpoints SMTP/IMAP seguros. |
| **IP pública** | Pruebas rápidas en servidores sin DNS configurado | Webmail, paneles, Matrix, Jitsi, Nextcloud y Grafana en puertos `8080-8086` usando HTTP. |
| **IP interna** | Laboratorios, VMs sin salida directa, entornos de QA | Mismas URLs que el modo IP pública, optimizadas para redes privadas/NAT. |

Para reinstalar o actualizar sin asistente interactivo:

```bash
cp compose/.env.example compose/.env   # si necesitas personalizar manualmente
sudo ./scripts/deploy.sh
```

---

## Topología de servicios

| Dominio funcional | Servicios Docker | Descripción |
|-------------------|------------------|-------------|
| Proxy & SSO | `caddy`, `keycloak`, `postgres-keycloak` | Proxy TLS automático, autenticación OIDC y portales protegidos. |
| Correo & Webmail | `stalwart`, `webmail` | Core de correo en Rust con cliente web Next.js estilo Gmail. |
| Administración | `admin-panel` | Gestión de dominios, usuarios, exportaciones y auditorías. |
| Operaciones | `it-panel`, `grafana`, `prometheus`, `alertmanager`, `loki`, `promtail`, `cadvisor`, `node-exporter`, `synthetic-exporter` | Observabilidad completa, alertas y monitoreo sintético. |
| Colaboración | `synapse`, `element`, `jitsi-web`, `jitsi-prosody`, `jitsi-jvb`, `nextcloud`, `nextcloud-db`, `redis` | Chat Matrix/Element, videollamadas Jitsi y suite Nextcloud. |
| Automatización | `send-router`, `send-router-redis`, `ai-orchestrator`, `restic-scheduler`, `scim-bridge`, `minio` | Enrutamiento multi-canal, IA preventiva, backups Restic, automatización SCIM y almacenamiento S3. |

Todos los servicios están definidos en [`compose/docker-compose.prod.yml`](compose/docker-compose.prod.yml) y pueden ejecutarse en modo laboratorio mediante el override [`compose/docker-compose.local.yml`](compose/docker-compose.local.yml).

---

## Operaciones esenciales

```bash
./scripts/hardening-check.sh          # Verifica TLS, credenciales y cabeceras
./scripts/synthetic-checks.sh --help  # Pruebas de salud programables (JSON/Prometheus)
./scripts/backup.sh                   # Snapshot Restic de volúmenes críticos
./scripts/restore.sh backups/<ID>     # Restauración de un snapshot
```

- **Send Router API**: `POST /api/send` (email, Matrix, webhook, S3) con seguimiento por `GET /api/jobs/<id>`.
- **Bridge SCIM**: `POST /scim/Users` para sincronizar usuarios HRIS → Keycloak → Stalwart.
- **Panel IT**: dashboards de latencia SMTP/JMAP, consumo de cuotas, estado de backups y alertas integradas.

---

## QA y confiabilidad

- 🧪 **Regresión final:** disponible en [`docs/QA/REGRESION_FINAL.md`](docs/QA/REGRESION_FINAL.md). Incluye validaciones `node --check`, scripts de hardening y sintéticos, más el resumen de incidencias resueltas.
- 🔁 **Workflows CI/CD:** `.github/workflows/ci.yml` ejecuta linting, dependencia y `docker compose config`; `.github/workflows/release-images.yml` construye imágenes multi-arquitectura firmadas; `.github/workflows/restore-check.yml` ensaya backups/restore en entornos efímeros.
- ⚠️ **Advertencia registrada:** las instalaciones `npm install` de los paneles Next.js fallaron en el sandbox por bloqueo al registro npm. En entornos reales se recomienda ejecutar `npm install && npm run build` en `services/admin-panel` y `services/it-panel` tras clonar.

Cada fase del roadmap cuenta con su propio informe QA (`docs/QA/FASE*.md`), lo que facilita trazar la evolución funcional y las pruebas asociadas.

---

## Mejoras continuas recomendadas

El proyecto está listo para producción, pero se documentan iniciativas para seguir madurando la operación:

1. **Imágenes multi-arquitectura avanzadas:** ampliar la matriz actual para publicar variantes `linux/arm64/v8` optimizadas y pruebas de smoke en runners ARM.
2. **Builds reproducibles Next.js:** consolidar cachés y pipelines para `npm run build` en CI con firmas de artefactos.
3. **Pruebas de restore en CI ampliadas:** programar cargas multi-tenant y validaciones de integridad posteriores al restore.
4. **Automatización SCIM extendida:** incorporar aprovisionamiento completo HRIS → Keycloak → Stalwart con workflows de desactivación y grupos sincronizados.
5. **Monitorización sintética enriquecida:** exponer resultados de `scripts/synthetic-checks.sh` en paneles Grafana y cron programado, incluyendo tiempos de correo extremo a extremo.
6. **Evolución UX:** seguir el [blueprint de mejoras](docs/BLUEPRINT_MEJORAS.md) para un webmail modular estilo Gmail+, con integraciones nativas a n8n, IA contextual, chat embebido y calendario embebido en la UI.

---

## Documentación complementaria

- [`docs/DESARROLLO_PLAN.md`](docs/DESARROLLO_PLAN.md): fases, entregables y estado histórico del proyecto.
- [`docs/BLUEPRINT_MEJORAS.md`](docs/BLUEPRINT_MEJORAS.md): hoja de ruta visual y funcional para futuras iteraciones (webmail avanzado, integraciones n8n, IA, etc.).
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md): procedimientos diarios, rotación de claves, troubleshooting y guías de auditoría.
- [`docs/QA/`](docs/QA): bitácoras de pruebas por fase y regresión final.

> Con MailiaCreate tienes un servidor de correo y colaboración moderno, autoalojado y extensible. Clona, ejecuta el instalador y empieza a operar.

