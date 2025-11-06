# QA Fase 2 — Paneles Admin & IT

## Entorno
- Ubuntu 22.04, Docker 26.1, Compose v2.27.
- Navegadores: Firefox 126, Chromium 124.

## Casos ejecutados
1. **Login OIDC Keycloak**
   - Usuario `admin-panel` asignado al cliente `mail-suite-admin`.
   - Acceso a `https://mail.example.com/admin` redirige a Keycloak y vuelve autenticado.
   - IT Panel (`/it`) reutiliza misma sesión.

2. **CRUD dominios y usuarios**
   - Alta dominio `empresa.test` desde panel → registro local persistido en `data/admin-data.json`.
   - Creación usuario `soporte` con cuota 2048 MB, estado inicial `active`.
   - Cambio de estado a `blocked` y reactivación → auditoría refleja eventos.

3. **Exportación de buzón**
   - Selección usuario y disparo de exportación → job en listado `completed` con URL mock.
   - Registro audit trail asociado.

4. **Dashboard IT**
   - Panel muestra valor de `stalwart_smtp_queue_length` (prometheus mock) y latencia JMAP generada.
   - Logs recientes consumidos desde Loki con filtro `level=error|warning`.
   - Estado de backups consumido desde `restic-scheduler /status`.

5. **Protección de rutas**
   - Acceso anónimo a `/admin` y `/it` redirige a login.
   - Sign-out desde cada panel invalida sesión.

## Resultados
- ✅ Paneles responden en < 350 ms promedio (modo dev container).
- ✅ Operaciones CRUD almacenadas con auditoría y exportaciones simuladas.
- ✅ Visualizaciones IT reflejan métricas y logs disponibles.
- ⚠️ Pendiente conectar acciones al API real de Stalwart cuando se disponga.
