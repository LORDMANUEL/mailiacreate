# Main

Este repositorio alberga la planificación y los artefactos del proyecto “MailKit Rust Suite”, un stack de colaboración y correo electrónico basado en Stalwart Mail y servicios complementarios.


## Getting Started

1. **Instalación automática**: en una máquina Debian/Ubuntu con `sudo`, ejecuta:

   ```bash
   export MAILIACREATE_REPO=https://github.com/<tu-organizacion>/mailiacreate.git
   curl -fsSL https://raw.githubusercontent.com/<tu-organizacion>/mailiacreate/main/scripts/install.sh | sudo bash
   ```

   El instalador instala Docker, prepara `/opt/mailiacreate`, clona el proyecto y levanta el stack con Compose.

2. **Instalación manual**:

   ```bash
   git clone https://github.com/<tu-organizacion>/mailiacreate.git
   cd mailiacreate
   cp compose/.env.example compose/.env
   sudo ./scripts/deploy.sh
   ```

3. **Servicios incluidos** (ver `compose/docker-compose.prod.yml`):

   - `caddy`: proxy TLS con certificados automáticos.
   - `stalwart`: core de correo con JMAP/IMAP/SMTP y métricas Prometheus.
   - `webmail`: cliente JMAP.
   - `admin-panel`: Next.js + Keycloak con gestión de dominios/usuarios/exportaciones (este repositorio builda la imagen).
   - `it-panel`: Next.js + Grafana/Prometheus/Loki para monitoreo en tiempo real (imagen construida localmente).
   - `keycloak`: SSO OIDC central para webmail, panel admin e IT, Matrix y Nextcloud.
   - `send-router`: microservicio Node.js multi-canal con cola BullMQ sobre Redis, drivers SMTP/Matrix/Webhook/S3 y análisis previo de IA.
   - `send-router-redis`: backend Redis dedicado para la cola del send-router.
   - `ai-orchestrator`: servicio heurístico que clasifica y resume los mensajes antes de enviarlos.
   - `minio`: almacenamiento S3-compatible para exportaciones/adjuntos gestionados por send-router.
   - `synapse` + `element`: chat Matrix integrado vía OIDC.
   - `jitsi-web`: videollamadas con soporte TURN.
   - `nextcloud`, `nextcloud-db`, `redis`: colaboración (archivos, CardDAV/CalDAV) sincronizada con el ecosistema.
   - `prometheus`, `alertmanager`, `grafana`, `loki`, `promtail`, `cadvisor`, `node-exporter`: observabilidad, dashboards y alertas listas.
   - `restic-scheduler`: orquestador de backups programados con métricas y API para lanzamientos manuales.

4. **Backups y restore**:

   ```bash
   ./scripts/backup.sh               # crea tarballs de volúmenes
   ./scripts/restore.sh backups/ID   # restaura desde un backup
   ```

5. **Send Router API** (contenedor `send-router`):

   ```bash
   curl -X POST https://mail.example.com/api/send \
     -H "Authorization: Bearer <token>" \
     -F channel=webhook \
     -F to=https://webhook.site/xxxx \
     -F text="Hola mundo"
   ```

   El endpoint `/api/hooks/alerts` recibe webhooks de Alertmanager para correlacionar incidencias con otros canales.

   Consulta el estado de una entrega con:

   ```bash
   curl https://mail.example.com/api/jobs/<JOB_ID>
   ```

   Si está habilitado `SEND_ROUTER_AI_URL`, cada solicitud pasa por el servicio `ai-orchestrator` y se rechaza automáticamente cuando el riesgo supera el umbral configurado.

6. **Accesos clave tras el despliegue**:

   - Webmail: `https://mail.<dominio>/`
   - Panel Admin: `https://mail.<dominio>/admin`
   - Panel IT: `https://mail.<dominio>/it`
   - Chat (Element): `https://chat.<dominio>` — Homeserver Matrix disponible en `https://matrix.<dominio>`
   - Nextcloud: `https://cloud.<dominio>`
   - Grafana: `https://grafana.<dominio>`

> ⚠️ Ajusta dominios, credenciales y certificados en `compose/.env` antes de producción.
> Puedes sobrescribir `MAILIACREATE_REPO` y `MAILIACREATE_HOME` antes de ejecutar el instalador para personalizar la ubicación del proyecto.

7. **Hardening rápido**:

   ```bash
   ./scripts/hardening-check.sh
   ```

   El script valida que las credenciales críticas no estén con valores por defecto y que el proxy incluya cabeceras seguras.

---

# Blueprint de Producción — “MailKit Rust Suite”

## 1) Visión & Principios

- **UX Gmail-like**: tres paneles (bandejas → lista → visor), búsqueda rápida, atajos, etiquetas.
- **Protocolos modernos**: JMAP para el cliente web (más eficiente que IMAP en web), IMAP/SMTP para clientes clásicos.
- **Todo Docker**: un `compose.prod.yml` para single-node y plantillas para HA.
- **Seguridad por defecto**: TLS, DKIM/DMARC/SPF, rate-limits, auditoría, backups.
- **Extensible**: chat (Matrix/Element), videollamadas (Jitsi), vCards/CalDAV (nativo Stalwart o Nextcloud), “send-router” multi-canal.

## 2) Stack (elecciones)

### Core de correo (Rust)

- **Stalwart Mail & Collaboration**: JMAP/IMAP/POP3/SMTP, CalDAV/CardDAV/WebDAV, admin web y filtros integrados (spam/phishing). Escrita en Rust, diseñada para rendimiento y seguridad.

### Frontends

- **Webmail Gmail-like (Next.js + Tailwind)**: usa JMAP del core (endpoint …/jmap).
- **Admin Panel (Next.js)**: UI para dominios/usuarios, cuotas, bloqueos, exportaciones, políticas.
- **IT Panel (Next.js)**: salud, métricas, auditoría, trazas de mensajes, backups/restore.

### Colaboración

- **vCards/Calendario**: 
  - Stalwart vía CalDAV/CardDAV/WebDAV (nativo en el core).
  - Nextcloud (servidor maduro de contactos/calendarios CardDAV/CalDAV y archivos).
- **Chat**: Matrix (Synapse) + Element Web (imágenes oficiales y guías con Docker).
- **Videollamadas**: Jitsi Meet Docker (handbook + repo oficial).

### Infra & utilidades

- **Proxy TLS**: Caddy o Traefik (Let’s Encrypt).
- **SSO/RBAC**: Keycloak (OIDC) para UI/Admin/IT.
- **Storage**: volúmenes locales; opción MinIO/S3 para adjuntos/exportaciones.
- **Logs & métricas**: Loki/Promtail + Grafana (básico), alertas (Alertmanager).
- **Backups**: restic (plan de retención y verificación).

## 3) Topología (prod, single-node → HA)

- **Dominios recomendados**:
  - `mail.tudominio` (JMAP/Admin/SMTP/IMAP)
  - `chat.tudominio` (Matrix/Element)
  - `meet.tudominio` (Jitsi)
  - `cloud.tudominio` (Nextcloud, si se usa)
  - `sso.tudominio` (Keycloak)
- **Puertos expuestos**: 80/443 (proxy), 25/465/587 (SMTP), 993 (IMAPS). Internos: JMAP 8080, Synapse 8008, etc.
- **Para HA**: dos nodos + VIP con Keepalived, almacenamiento replicado y DB HA (si aplicas bases externas).

## 4) Seguridad esencial (baseline)

- TLS completo (HSTS, TLS1.2+), SPF/DKIM/DMARC configurados en DNS.
- Antispam/antiphishing del core, con thresholds y autolearn (spam/ham).
- Rate-limits SMTP/JMAP, tamaño adjuntos, greylisting opcional.
- RBAC (Admin, Helpdesk, Auditor, Usuario).
- Auditoría: accesos, cambios de políticas, descargas de buzones, trazas SMTP/JMAP.
- Backups cifrados + restore probado (playbook).
- Hardening del proxy (CSP, X-Frame-Options, Referrer-Policy).

## 5) Módulos y responsabilidades

### 5.1 Core Mail (Stalwart)

- Dominios, usuarios, alias, políticas de envío/recepción, DKIM.
- JMAP (/jmap), WebDAV (/dav), Admin Web (listener HTTP).

### 5.2 Webmail (Next.js + Tailwind)

- Login (OIDC o Basic/Bearer dev).
- Bandejas (`Mailbox/get`), lista (`Email/query`), visor (`Email/get`), búsqueda.
- Envío: `Email/set` + `Blob/upload`.
- Etiquetas, favoritos, archivado, arrastrar/soltar adjuntos.
- Preferencias (firma, alias, respuestas rápidas).

### 5.3 vCards / Calendario

- **Opción A**: Stalwart (CalDAV/CardDAV/WebDAV) — menos piezas externas.
- **Opción B**: Nextcloud — contactos, calendarios y archivos con apps maduras.

### 5.4 Chat (Matrix/Element)

- Sincronizado con SSO; rooms por equipos, DMs, adjuntos. Imágenes Docker oficiales y guías para compose.

### 5.5 Videollamadas (Jitsi)

- `meet.tudominio` con Docker Compose oficial. TURN si harás NAT traversal amplio.

### 5.6 “Send-Router” (enviar lo que sea a donde sea)

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

### 5.7 Admin Panel

- Dominios/Usuarios: crear, bloquear, reset, alias, cuotas.
- Buzón: exportar (mbox/EML/ZIP), transferir a otro usuario/dominio.
- Políticas: tamaño, adjuntos, listas blancas/negras, DMARC/SPF.
- Entregabilidad: DNS checker (SPF/DKIM/DMARC), reputación básica.
- Tareas: reindexaciones, rotación DKIM, rotación de claves.
- Exportar buzón: servicio exporter que, autenticado por JMAP/IMAP, descarga y empaqueta (mbox/EML) con índice JSON (hash, tamaño, fecha).

### 5.8 IT Panel

- Salud (uptime, colas, tasas SMTP/JMAP, errores), métricas y logs (Grafana/Loki).
- Auditoría/Forense: búsqueda por mensaje (Message-ID), IP de envío, DKIM/DMARC, historial de reglas.
- Backups: estado, última verificación, tamaño, prueba de restore.
- Capacidad: uso por usuario/dominio, crecimiento, alertas de cuota.
- HA: estado del VIP, latencias, drift entre nodos.

## 6) Esquema de datos y APIs (resumen)

### Usuarios

- `id`, `username`, `email`, `domain`, `status`, `roles[]`, `quota`, `createdAt`

### Admin API (OpenAPI) — ejemplos

- `POST /admin/domains` (crear dominio)
- `POST /admin/users` (crear usuario + credenciales iniciales)
- `POST /admin/users/{id}/block|unblock`
- `POST /admin/users/{id}/export` → tarea asíncrona, callback/webhook al terminar
- `GET /admin/audit?page=…` (eventos)
- `GET /admin/dns-check?domain=…` (SPF/DKIM/DMARC)

### IT API

- `GET /it/health` (aggregado)
- `GET /it/metrics` (proxy Prometheus o snapshot)
- `POST /it/backup/run` / `GET /it/backup/status`
- `GET /it/trace?messageId=…` (ruta SMTP/JMAP, resultados DKIM/DMARC)

## 7) Deploy (`docker-compose.prod.yml` — servicios mínimos)

- `caddy` (reverse-proxy TLS)
- `stalwart` (core)
- `webmail` (Next.js build → node `.next/standalone` o Nginx para estáticos)
- `admin-panel` / `it-panel` (Next.js)
- `send-router` (Node/Go) + `nats`
- `nextcloud` (opcional)
- `synapse` + `element` (chat)
- `jitsi` (video)
- `loki` + `promtail` + `grafana` (observabilidad)
- `restic-cron` (backups programados)

## 8) Observabilidad & Backups

- Métricas del core y frontends; paneles prehechos (latencia JMAP, tasa SMTP, colas).
- Logs estructurados (JSON) y correlación por `X-Request-ID`.
- Backups: restic diario + semanal, check y restore-dry-run automáticos.

## 9) Seguridad & Cumplimiento

- TLS (LE) + HSTS + CSP + cookies `Secure`/`HttpOnly`.
- DKIM/DMARC/SPF verificados por dominio.
- 2FA (OIDC) para Admin/IT.
- Auditoría firmada (hash encadenado) en exportaciones y cambios de políticas.

## 10) Roadmap (entregables y criterios de “Done”)

### Fase 0 — Foundation (Día 1-3)

- Compose prod base + Proxy TLS + Stalwart + UI webmail mínima (login + inbox).
- DNS + DKIM/DMARC/SPF ok para 1 dominio.
- **DoD**: Envío/recepción real + webmail consulta y lee con JMAP.

### Fase 1 — Colaboración (Día 4-7)

- vCards/CalDAV (Stalwart o Nextcloud) + Chat (Synapse/Element) + Jitsi.
- **DoD**: contactos y calendario sincronizan (CardDAV/CalDAV), chat operativo y salas de prueba, videollamada 1:1 y multiusuario.

### Fase 2 — Admin Panel (Día 8-12)

- CRUD dominios/usuarios, bloqueos, cuotas; exportación de buzón (job asíncrono).
- DNS checker y rotación DKIM.
- **DoD**: crear usuario desde UI, bloquearlo y exportar su buzón (ZIP).

### Fase 3 — IT Panel (Día 13-16)

- Salud, métricas, logs, trazas por Message-ID, tablero de capacidad, backups.
- **DoD**: alerta por cuota >90%, traza de un correo, backup/restore verificado.

### Fase 4 — Send-Router + AI (Día 17-20)

- “Enviar a cualquier canal” (email/chat/webhook/storage).
- (Opcional) IA: clasificación, detección de anomalías (envíos masivos), resúmenes.
- **DoD**: `POST /api/send` entrega a email y Matrix con trazabilidad.

## 11) Checklist de salida a Producción

- Certs LE válidos y HSTS activo.
- SPF/DKIM/DMARC: PASS en pruebas externas.
- SMTP AUTH/Submission 587 y 465 probados.
- JMAP UI con 500+ hilos listados < 500 ms promedio.
- Backups: snapshot + restore-dry-run OK.
- Monitoreo y alertas con contactos definidos.
- Exportar buzón: < 5% fallas en stress de 100 usuarios.

---

**Siguiente paso sugerido**: empaquetar un `compose.prod.yml` integral (proxy + stalwart + webmail + admin/it + send-router) con Keycloak SSO y scripts `deploy.sh` / `backup.sh` / `restore.sh`.

**Pregunta abierta**: ¿Prefieres vCards/Calendario con Stalwart nativo o Nextcloud como primer enfoque? (Ambas rutas son válidas; Stalwart ya expone WebDAV/CalDAV/CardDAV, Nextcloud aporta ecosistema más amplio).
