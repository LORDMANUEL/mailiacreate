# Plan de Desarrollo Faseado

Este documento describe el plan de ejecución por fases para la suite **MailiaCreate / MailKit Rust Suite**, indicando objetivos, entregables, dependencias y el estado actual.

## Resumen de estado

| Fase | Nombre | Objetivo principal | Estado | Comentarios |
| --- | --- | --- | --- | --- |
| 0 | Fundamentos | Provisionar infraestructura base, credenciales y automatización de despliegue. | ✅ Completada | Validación en entorno limpio con scripts e instalador ejecutados; resultados documentados en informe de QA. |
| 1 | Colaboración | Integrar servicios colaborativos (calendario, contactos, chat, videollamadas). | Pendiente | Requiere completar fase 0 y decidir opción Stalwart vs Nextcloud para CalDAV/CardDAV. |
| 2 | Paneles Admin/IT | Construir paneles Next.js para administración y operaciones. | Pendiente | UI aún no implementada; se definieron endpoints y alcance en blueprint. |
| 3 | Observabilidad & Backups | Refinar monitoreo, alertas, auditoría y procesos de backup/restore. | Pendiente | Scripts base listos; resta definir almacenamiento remoto y políticas. |
| 4 | Send-Router & Extensiones | Ampliar entrega multi-canal y capacidades opcionales (AI, automatizaciones). | Pendiente | Servicio esqueleto creado; falta robustecer colas, métricas y pruebas multi-canal. |

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
- 🔜 Próximos pasos: automatizar pipeline CI para publicar imágenes firmadas y preparar inventario Ansible para despliegues masivos.

## Fase 1 — Colaboración

**Objetivo:** Agregar capacidades colaborativas (calendario, contactos, chat, videollamadas) integradas con autenticación centralizada.

**Entregables:**
- Decisión y configuración de CalDAV/CardDAV (Stalwart nativo vs Nextcloud).
- Integración de Matrix Synapse + Element Web, Jitsi Meet y Single Sign-On con Keycloak.
- Documentación de flujos de configuración y pruebas (room chat, reunión, sincronización de agenda/contactos).

**Estado actual:**
- ⚠️ Servicios referenciados en Compose como placeholders sin configuración específica.
- 🔜 Próximos pasos: seleccionar proveedor CalDAV/CardDAV, definir variables de entorno para Matrix/Jitsi, automatizar aprovisionamiento de usuarios via Keycloak.

## Fase 2 — Paneles Admin & IT

**Objetivo:** Implementar interfaces Next.js para gestión administrativa y monitoreo operativo.

**Entregables:**
- Panel Admin: CRUD de dominios/usuarios, políticas, exportación de buzones.
- Panel IT: dashboards de salud, métricas, auditoría, backups.
- APIs backend (JMAP/Admin) conectadas y protegidas por OIDC.

**Estado actual:**
- ⚠️ Solo se dispone del blueprint funcional; no hay código de frontend o backend para paneles.
- 🔜 Próximos pasos: scaffolding de aplicaciones Next.js, definición de contratos API concretos, integración con Keycloak y Stalwart Admin API.

## Fase 3 — Observabilidad y Backups

**Objetivo:** Consolidar monitoreo, logging, alertas y estrategias de respaldo/restauración verificadas.

**Entregables:**
- Dashboards Grafana (latencia JMAP, tasas SMTP, recursos).
- Pipelines Loki/Promtail para logs estructurados.
- Playbooks de backup/restore con almacenamiento remoto (S3/Restic) y pruebas automatizadas.
- Auditoría encadenada para eventos críticos.

**Estado actual:**
- ⚠️ Configuraciones base de Loki/Promtail presentes, sin dashboards ni alertas predefinidas.
- 🔜 Próximos pasos: definir fuentes de métricas, crear dashboards, automatizar pruebas de restore y documentar políticas de retención.

## Fase 4 — Send-Router & Extensiones

**Objetivo:** Ofrecer entrega multi-canal robusta (email, Matrix, webhooks, almacenamiento) con trazabilidad y extensiones futuras.

**Entregables:**
- Servicio Send-Router con control de colas, reintentos, DLQ, métricas y autenticación.
- Integraciones hacia SMTP, Matrix, Webhooks y S3/MinIO.
- Opcional: módulos de IA para clasificación/anomalías.

**Estado actual:**
- ⚠️ Microservicio base Node.js creado sin drivers concretos ni observabilidad.
- 🔜 Próximos pasos: diseñar contrato de drivers, implementar canal email (SMTP) y Matrix, añadir tracing y dashboards, definir proceso de despliegue continuo.

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
