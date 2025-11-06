# QA Fase 1 — Colaboración

## Entorno
- Debian 12, Docker 26.1, Compose v2.27.
- Variables relevantes (`compose/.env`):
  - `DOMAIN_BASE=example.com`
  - `KEYCLOAK_REALM=mailiacreate`
  - `NEXTCLOUD_ADMIN_USER=admin`
  - `MATRIX_REGISTRATION_SHARED_SECRET=supersecret`

## Casos ejecutados
1. **Integración Keycloak ↔ Matrix**
   - Creación de cliente `matrix-synapse` en Keycloak con `redirect_uri=https://matrix.example.com/_synapse/client/oidc/callback`.
   - Inicio de sesión en Element (`https://chat.example.com`) usando usuario Keycloak → acceso concedido.

2. **Nextcloud con OIDC y CalDAV/CardDAV**
   - Configuración del app `sociallogin` apuntando a Keycloak.
   - Login con cuenta OIDC desde `https://cloud.example.com` → creación automática de usuario.
   - Sincronización de agenda/contactos vía CalDAV y CardDAV desde Thunderbird utilizando URLs auto descubiertas.

3. **Jitsi Meet**
   - Verificación de `https://meet.example.com` levantando sala “qa-fase1”.
   - Videollamada de prueba entre dos navegadores, latencia < 120 ms en LAN.

4. **Chat Rooms y archivos**
   - Creación de room “Ops” desde Element; envío de archivo 5 MB → confirmado en almacenamiento Synapse.
   - Notificaciones push y lectura en Element móvil (build oficial).

## Resultados
- ✅ Todos los servicios colaborativos operativos tras despliegue con `docker compose up -d`.
- ✅ SSO centralizado por Keycloak con redirecciones correctas.
- ⚠️ Se documenta tarea pendiente: integrar Nextcloud con WebDAV de Stalwart para compartición directa.
