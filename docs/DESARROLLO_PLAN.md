# Plan de Desarrollo Faseado

Este documento describe el plan de ejecución por fases para la suite **MailiaCreate / MailKit Rust Suite**, indicando objetivos, entregables, dependencias y el estado actual.

## Resumen de estado

> **Todo el backlog faseado se encuentra completado.** Se ejecutó una regresión final (ver `docs/QA/REGRESION_FINAL.md`) para validar servicios, scripts y dependencias.

| Fase | Nombre | Objetivo principal | Estado | Comentarios |
| --- | --- | --- | --- | --- |
| 0 | Fundamentos | Provisionar infraestructura base, credenciales y automatización de despliegue. | ✅ Completada | Validación en entorno limpio con scripts e instalador ejecutados; resultados documentados en informe de QA. |
| 1 | Colaboración | Integrar servicios colaborativos (calendario, contactos, chat, videollamadas). | ✅ Completada | Nextcloud + Redis/MariaDB operativos, Matrix/Element/Jitsi integrados con Keycloak. |
| 2 | Paneles Admin/IT | Construir paneles Next.js para administración y operaciones. | ✅ Completada | Paneles Next.js con OIDC, CRUD dominios/usuarios, dashboards y exportaciones documentadas. |
| 3 | Observabilidad & Backups | Refinar monitoreo, alertas, auditoría y procesos de backup/restore. | ✅ Completada | Prometheus/Alertmanager/Grafana provisionados, restic scheduler con métricas y políticas. |
| 4 | Send-Router & Extensiones | Ampliar entrega multi-canal y capacidades opcionales (AI, automatizaciones). | ✅ Completada | Cola BullMQ con Redis dedicado, drivers SMTP/Matrix/Webhook/S3 y métricas Prometheus en producción. |
| 5 | IA & Automatización | Clasificación de riesgo, resúmenes y recomendaciones antes del envío. | ✅ Completada | Servicio `ai-orchestrator` provee API `/api/analyze`/`/api/summarize` con heurísticas y métricas. |
| 6 | Hardening & Go-Live | Endurecer superficie, validar secretos y políticas antes de lanzamiento. | ✅ Completada | Cabeceras CSP/HSTS en proxy y script `hardening-check.sh` para auditoría previa. |

---

## Fase 0 — Fundamentos

**Objetivo:** Tener una instalación reproducible en Debian/Ubuntu con los servicios core operativos y certificados TLS listos.

**Entregables:**
- Instalador (`scripts/install.sh`) y guías de despliegue/backup (`deploy.sh`, `backup.sh`, `restore.sh`).
- `docker-compose.prod.yml` con Stalwart, Caddy, bases de datos y dependencias mínimas.
- Configuraciones iniciales (Caddyfile, Stalwart, Loki/Promtail).
- Plantilla `.env` con variables críticas.

**Estado actual:**
- ✅ Instalador y scripts ejecutados satisfactoriamente en Debian 12 y Ubuntu 22.04.
- ✅ Servicios core (Caddy, Stalwart, webmail base, send-router) levantados con certificados auto-generados.
- ✅ Validación funcional documentada en `docs/QA/FASE0.md` (SMTP/JMAP, login, métricas básicas).
- ✅ Pipeline CI/CD agregado (`.github/workflows/ci.yml`, `release-images.yml`) con linting, validación de compose y publicación firmada en GHCR.

## Fase 1 — Colaboración

**Objetivo:** Agregar capacidades colaborativas (calendario, contactos, chat, videollamadas) integradas con autenticación centralizada.

**Entregables:**
- Decisión y configuración de CalDAV/CardDAV (Stalwart nativo vs Nextcloud).
- Integración de Matrix Synapse + Element Web, Jitsi Meet y Single Sign-On con Keycloak.
- Documentación de flujos de configuración y pruebas (room chat, reunión, sincronización de agenda/contactos).

**Estado actual:**
- ✅ Nextcloud desplegado con base MariaDB y Redis, expuesto por Caddy (`cloud.<dominio>`), integrado con Keycloak mediante OIDC Social Login.
- ✅ Matrix Synapse configurado con proveedor OIDC Keycloak y Element sirviendo `chat.<dominio>`.
- ✅ Jitsi Web disponible en `meet.<dominio>` con plantillas de TURN.
- ✅ Documentada integración SCIM mediante Keycloak y API de Stalwart (`docs/OPERATIONS.md`).
- ✅ Webmail extendido con módulos anclables (chat Matrix, calendario/tareas CalDAV) y barra de presencia sincronizada.

## Fase 2 — Paneles Admin & IT

**Objetivo:** Implementar interfaces Next.js para gestión administrativa y monitoreo operativo.

**Entregables:**
- Panel Admin: CRUD de dominios/usuarios, políticas, exportación de buzones.
- Panel IT: dashboards de salud, métricas, auditoría, backups.
- APIs backend (JMAP/Admin) conectadas y protegidas por OIDC.

**Estado actual:**
- ✅ Aplicaciones Next.js (`services/admin-panel`, `services/it-panel`) generadas con Dockerfile y dependencias listas para `docker compose`.
- ✅ Panel Admin consume Keycloak (NextAuth) y expone CRUD para dominios/usuarios, exportaciones y auditoría con almacenamiento local cuando Stalwart no está disponible.
- ✅ Panel IT consulta Prometheus/Loki/Restic mediante rutas API internas y ofrece visualizaciones con Recharts.
- ✅ Endpoints de exportación enlazados con Stalwart (`lib/stalwart.ts`) y se añadieron validaciones front-end adicionales en formularios.

## Fase 3 — Observabilidad y Backups

**Objetivo:** Consolidar monitoreo, logging, alertas y estrategias de respaldo/restauración verificadas.

**Entregables:**
- Dashboards Grafana (latencia JMAP, tasas SMTP, recursos).
- Pipelines Loki/Promtail para logs estructurados.
- Playbooks de backup/restore con almacenamiento remoto (S3/Restic) y pruebas automatizadas.
- Auditoría encadenada para eventos críticos.

**Estado actual:**
- ✅ Prometheus incorporado con scrapes de Stalwart, cadvisor, node-exporter, send-router y restic-scheduler.
- ✅ Alertmanager enviando incidencias a send-router; Grafana auto-provisiona datasources y tablero "MailiaCreate Overview".
- ✅ Servicio `restic-scheduler` registra estado en disco, expone métricas y API `/status`/`/run`.
- ✅ Backups apuntan a MinIO/S3 por defecto y el pipeline CI valida la configuración de Docker Compose junto al hardening automatizado.

## Fase 4 — Send-Router & Extensiones

**Objetivo:** Ofrecer entrega multi-canal robusta (email, Matrix, webhooks, almacenamiento) con trazabilidad y extensiones futuras.

**Entregables:**
- Servicio Send-Router con control de colas, reintentos, DLQ, métricas y autenticación.
- Integraciones hacia SMTP, Matrix, Webhooks y S3/MinIO.
- Opcional: módulos de IA para clasificación/anomalías.

**Estado actual:**
- ✅ Send-router usa BullMQ sobre un Redis dedicado (`send-router-redis`) con reintentos exponenciales, API `/api/jobs/:id` y métricas Prometheus.
- ✅ Drivers implementados: SMTP (Nodemailer hacia Stalwart), Matrix (client API), Webhooks con firma y almacenamiento MinIO mediante firma SigV4.
- ✅ Integración opcional con IA mediante `SEND_ROUTER_AI_URL`; bloqueo automático configurable por riesgo.
- ✅ Dashboard Send-Router documentado en Grafana y soporte para workers adicionales descrito en `docs/OPERATIONS.md`.

## Fase 5 — IA & Automatización

**Objetivo:** Clasificar el riesgo de los mensajes, generar resúmenes rápidos y recomendar acciones preventivas.

**Entregables:**
- Servicio heurístico expuesto vía HTTP con endpoints de análisis y resumen.
- Métricas de riesgo/clasificación para Prometheus y consumo por paneles IT.
- Integración con send-router para pre-chequeo antes de encolar mensajes.

**Estado actual:**
- ✅ Servicio `ai-orchestrator` (Node.js) con heurísticas de spam/phishing, histograma de riesgos y extracción de keywords.
- ✅ Integración con send-router para bloquear entregas de riesgo alto y registrar el resultado del pre-chequeo.
- ✅ AI-orchestrator publica endpoint `/api/feedback` para ingestión de datasets etiquetados y aprendizaje incremental documentado.

## Fase 6 — Hardening & Go-Live

**Objetivo:** Garantizar una superficie endurecida y comprobable antes de la puesta en producción.

**Entregables:**
- Cabeceras de seguridad (HSTS, CSP, Permissions-Policy, X-Frame-Options) aplicadas desde el proxy TLS.
- Checklist automatizado para evitar credenciales por defecto y validar configuración base.
- Documentación de pasos finales para el cutover a producción.

**Estado actual:**
- ✅ `config/caddy/Caddyfile` incorpora un bloque reutilizable `header-security` aplicado a todos los vhosts.
- ✅ Script `scripts/hardening-check.sh` detecta valores inseguros en `compose/.env` y verifica la presencia del hardening en proxy.
- ✅ `scripts/hardening-check.sh --ci` integrado en CI y se añadieron verificaciones TLS/headers extendidas.

---

## Gestión y seguimiento

- **Ritmo sugerido:** iteraciones de 1-2 semanas por fase, con demos funcionales al cierre.
- **Herramientas recomendadas:** tablero Kanban (GitHub Projects), automatización CI/CD para builds de imágenes, documentación viva en `docs/`.
- **Revisión de avances:** checkpoint semanal, checklist de criterios de “Done” según blueprint original.

## Métricas de avance

- Porcentaje de tareas completadas por fase.
- Tiempo de despliegue end-to-end en entorno limpio.
- MTTR en restauraciones de backup.
- Satisfacción de usuarios beta (webmail, paneles, colaboración).

Este plan se actualizará conforme se completen hitos o se redefinan prioridades.
