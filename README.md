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
5. [Aseguramiento de la calidad](#aseguramiento-de-la-calidad)
6. [Documentación adicional](#documentación-adicional)
7. [Blueprint completo](#blueprint-completo)

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
   - Instala Docker, prepara `/opt/mailiacreate`, clona el repositorio y levanta el stack completo.

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
- **Blueprint detallado por fase:** [`docs/QA/`](docs/QA)
- **Configuración de servicios:**
  - Caddy: [`config/caddy/Caddyfile`](config/caddy/Caddyfile)
  - Prometheus: [`config/prometheus/`](config/prometheus)
  - Grafana: [`config/grafana/`](config/grafana)
  - Stalwart Mail: [`config/stalwart/config.toml`](config/stalwart/config.toml)
  - Matrix Synapse: [`config/synapse/`](config/synapse)

---

## Blueprint completo

A continuación se conserva el blueprint de producción original que detalla visión, stack, topologías y roadmap. Sirve como referencia estratégica y técnica para despliegues extendidos o personalizaciones.

### 1) Visión & Principios

- **UX Gmail-like**: tres paneles (bandejas → lista → visor), búsqueda rápida, atajos, etiquetas.
- **Protocolos modernos**: JMAP para el cliente web (más eficiente que IMAP en web), IMAP/SMTP para clientes clásicos.
- **Todo Docker**: un `compose.prod.yml` para single-node y plantillas para HA.
- **Seguridad por defecto**: TLS, DKIM/DMARC/SPF, rate-limits, auditoría, backups.
- **Extensible**: chat (Matrix/Element), videollamadas (Jitsi), vCards/CalDAV (nativo Stalwart o Nextcloud), “send-router” multi-canal.

### 2) Stack (elecciones)

#### Core de correo (Rust)

- **Stalwart Mail & Collaboration**: JMAP/IMAP/POP3/SMTP, CalDAV/CardDAV/WebDAV, admin web y filtros integrados (spam/phishing). Escrita en Rust, diseñada para rendimiento y seguridad.

#### Frontends

- **Webmail Gmail-like (Next.js + Tailwind)**: usa JMAP del core (endpoint …/jmap).
- **Admin Panel (Next.js)**: UI para dominios/usuarios, cuotas, bloqueos, exportaciones, políticas.
- **IT Panel (Next.js)**: salud, métricas, auditoría, trazas de mensajes, backups/restore.

#### Colaboración

- **vCards/Calendario**:
  - Stalwart vía CalDAV/CardDAV/WebDAV (nativo en el core).
  - Nextcloud (servidor maduro de contactos/calendarios CardDAV/CalDAV y archivos).
- **Chat**: Matrix (Synapse) + Element Web (imágenes oficiales y guías con Docker).
- **Videollamadas**: Jitsi Meet Docker (handbook + repo oficial).

#### Infra & utilidades

- **Proxy TLS**: Caddy o Traefik (Let’s Encrypt).
- **SSO/RBAC**: Keycloak (OIDC) para UI/Admin/IT.
- **Storage**: volúmenes locales; opción MinIO/S3 para adjuntos/exportaciones.
- **Logs & métricas**: Loki/Promtail + Grafana (básico), alertas (Alertmanager).
- **Backups**: restic (plan de retención y verificación).

### 3) Topología (prod, single-node → HA)

- **Dominios recomendados**:
  - `mail.tudominio` (JMAP/Admin/SMTP/IMAP)
  - `chat.tudominio` (Matrix/Element)
  - `meet.tudominio` (Jitsi)
  - `cloud.tudominio` (Nextcloud, si se usa)
  - `sso.tudominio` (Keycloak)
- **Puertos expuestos**: 80/443 (proxy), 25/465/587 (SMTP), 993 (IMAPS). Internos: JMAP 8080, Synapse 8008, etc.
- **Para HA**: dos nodos + VIP con Keepalived, almacenamiento replicado y DB HA (si aplicas bases externas).

### 4) Seguridad esencial (baseline)

- TLS completo (HSTS, TLS1.2+), SPF/DKIM/DMARC configurados en DNS.
- Antispam/antiphishing del core, con thresholds y autolearn (spam/ham).
- Rate-limits SMTP/JMAP, tamaño adjuntos, greylisting opcional.
- RBAC (Admin, Helpdesk, Auditor, Usuario).
- Auditoría: accesos, cambios de políticas, descargas de buzones, trazas SMTP/JMAP.
- Backups cifrados + restore probado (playbook).
- Hardening del proxy (CSP, X-Frame-Options, Referrer-Policy).

### 5) Módulos y responsabilidades

#### 5.1 Core Mail (Stalwart)

- Dominios, usuarios, alias, políticas de envío/recepción, DKIM.
- JMAP (/jmap), WebDAV (/dav), Admin Web (listener HTTP).

#### 5.2 Webmail (Next.js + Tailwind)

- Login (OIDC o Basic/Bearer dev).
- Bandejas (`Mailbox/get`), lista (`Email/query`), visor (`Email/get`), búsqueda.
- Envío: `Email/set` + `Blob/upload`.
- Etiquetas, favoritos, archivado, arrastrar/soltar adjuntos.
- Preferencias (firma, alias, respuestas rápidas).

#### 5.3 vCards / Calendario

- **Opción A**: Stalwart (CalDAV/CardDAV/WebDAV) — menos piezas externas.
- **Opción B**: Nextcloud — contactos, calendarios y archivos con apps maduras.

#### 5.4 Chat (Matrix/Element)

- Sincronizado con SSO; rooms por equipos, DMs, adjuntos. Imágenes Docker oficiales y guías para compose.

#### 5.5 Videollamadas (Jitsi)

- `meet.tudominio` con Docker Compose oficial. TURN si harás NAT traversal amplio.

#### 5.6 “Send-Router” (enviar lo que sea a donde sea)

- Microservicio con cola (NATS/RabbitMQ) y drivers:
  - Email (SMTP), Chat (Matrix), Webhooks HTTP, Storage (S3/MinIO).
- API: `POST /api/send`

```json
{
  "channel": "email|matrix|webhook|storage",
  "to": ["user@dom.com" | "@user:dom.com" | "https://..."],
  "subject": "...",
  "text": "...",
  "html": "...",
  "attachments": [
    {
      "name": "...",
      "url": "s3://..."
    }
  ]
}
```

- Retrys, DLQ, firma de webhooks y trazabilidad (ID correlación).

#### 5.7 Admin Panel

- Dominios/Usuarios: crear, bloquear, reset, alias, cuotas.
- Buzón: exportar (mbox/EML/ZIP), transferir a otro usuario/dominio.
- Políticas: tamaño, adjuntos, listas blancas/negras, DMARC/SPF.
- Entregabilidad: DNS checker (SPF/DKIM/DMARC), reputación básica.
- Tareas: reindexaciones, rotación DKIM, rotación de claves.
- Exportar buzón: servicio exporter que, autenticado por JMAP/IMAP, descarga y empaqueta (mbox/EML) con índice JSON (hash, tamaño, fecha).

#### 5.8 IT Panel

- Salud (uptime, colas, tasas SMTP/JMAP, errores), métricas y logs (Grafana/Loki).
- Auditoría/Forense: búsqueda por mensaje (Message-ID), IP de envío, DKIM/DMARC, historial de reglas.
- Backups: estado, última verificación, tamaño, prueba de restore.
- Capacidad: uso por usuario/dominio, crecimiento, alertas de cuota.
- HA: estado del VIP, latencias, drift entre nodos.

### 6) Esquema de datos y APIs (resumen)

#### Usuarios

- `id`, `username`, `email`, `domain`, `status`, `roles[]`, `quota`, `createdAt`

#### Admin API (OpenAPI) — ejemplos

- `POST /admin/domains` (crear dominio)
- `POST /admin/users` (crear usuario + credenciales iniciales)
- `POST /admin/users/{id}/block|unblock`
- `POST /admin/users/{id}/export` → tarea asíncrona, callback/webhook al terminar
- `GET /admin/audit?page=…` (eventos)
- `GET /admin/dns-check?domain=…` (SPF/DKIM/DMARC)

#### IT API

- `GET /it/health` (aggregado)
- `GET /it/metrics` (proxy Prometheus o snapshot)
- `POST /it/backup/run` / `GET /it/backup/status`
- `GET /it/trace?messageId=…` (ruta SMTP/JMAP, resultados DKIM/DMARC)

### 7) Deploy (docker-compose.prod.yml — servicios mínimos)

- `caddy` (reverse-proxy TLS)
- `stalwart` (core)
- `webmail` (Next.js build → node .next/standalone o Nginx para estáticos)
- `admin-panel` / `it-panel` (Next.js)
- `send-router` (Node/Go) + `nats`
- `nextcloud` (opcional)
- `synapse` + `element` (chat)
- `jitsi` (video)
- `loki` + `promtail` + `grafana` (observabilidad)
- `restic-cron` (backups programados)

### 8) Observabilidad & Backups

- Métricas del core y frontends; paneles prehechos (latencia JMAP, tasa SMTP, colas).
- Logs estructurados (JSON) y correlación por `X-Request-ID`.
- Backups: restic diario + semanal, check y restore-dry-run automáticos.

### 9) Seguridad & Cumplimiento

- TLS (LE) + HSTS + CSP + cookies Secure/HttpOnly.
- DKIM/DMARC/SPF verificados por dominio.
- 2FA (OIDC) para Admin/IT.
- Auditoría firmada (hash encadenado) en exportaciones y cambios de políticas.

### 10) Roadmap (entregables y criterios de “Done”)

- **Fase 0 — Foundation (Día 1-3)**
  - Compose prod base + Proxy TLS + Stalwart + UI webmail mínima (login + inbox).
  - DNS + DKIM/DMARC/SPF ok para 1 dominio.
  - _DoD_: Envío/recepción real + webmail consulta y lee con JMAP.
- **Fase 1 — Colaboración (Día 4-7)**
  - vCards/CalDAV (Stalwart o Nextcloud) + Chat (Synapse/Element) + Jitsi.
  - _DoD_: contactos y calendario sincronizan (CardDAV/CalDAV), chat operativo y salas de prueba, videollamada 1:1 y multiusuario.
- **Fase 2 — Admin Panel (Día 8-12)**
  - CRUD dominios/usuarios, bloqueos, cuotas; exportación de buzón (job asíncrono).
  - DNS checker y rotación DKIM.
  - _DoD_: crear usuario desde UI, bloquearlo y exportar su buzón (ZIP).
- **Fase 3 — IT Panel (Día 13-16)**
  - Salud, métricas, logs, trazas por Message-ID, tablero de capacidad, backups.
  - _DoD_: alerta por cuota >90%, traza de un correo, backup/restore verificado.
- **Fase 4 — Send-Router + AI (Día 17-20)**
  - “Enviar a cualquier canal” (email/chat/webhook/storage).
  - (Opcional) IA: clasificación, detección de anomalías (envíos masivos), resúmenes.
  - _DoD_: `POST /api/send` entrega a email y Matrix con trazabilidad.

### 11) Checklist de salida a Producción

- Certs LE válidos y HSTS activo.
- SPF/DKIM/DMARC: PASS en pruebas externas.
- SMTP AUTH/Submission 587 y 465 probados.
- JMAP UI con 500+ hilos listados < 500 ms promedio.
- Backups: snapshot + restore-dry-run OK.
- Monitoreo y alertas con contactos definidos.
- Exportar buzón: < 5% fallas en stress de 100 usuarios.

