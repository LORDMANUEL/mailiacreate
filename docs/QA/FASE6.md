# QA Fase 6 — Hardening & Go-Live

## Entorno
- Revisión manual de `config/caddy/Caddyfile`.
- Ejecución de `scripts/hardening-check.sh` sobre `compose/.env` personalizado.

## Pruebas ejecutadas

| ID | Prueba | Resultado |
| -- | ------ | -------- |
| H-01 | Ejecutar `./scripts/hardening-check.sh` con contraseñas por defecto. | ✅ Script detecta valores inseguros y finaliza con código 2. |
| H-02 | Actualizar credenciales y volver a ejecutar. | ✅ Mensaje de validación y código 0. |
| H-03 | `curl -I https://mail.example.com` tras despliegue. | ✅ Cabeceras HSTS, CSP, X-Frame-Options y Permissions-Policy presentes. |
| H-04 | Escaneo `docker scout cves` sobre imágenes críticas. | ✅ Sin vulnerabilidades críticas pendientes (información archivada). |

## Evidencias
- Salida del script `hardening-check.sh` almacenada en `docs/QA/assets/hardening.log` (no versionado).
- Captura de cabeceras HTTP.

## Pendientes / Riesgos
- Automatizar la ejecución del script en pipeline CI.
- Añadir verificación específica para dominios y certificados reales.
