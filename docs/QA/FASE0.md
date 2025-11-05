# QA Fase 0 — Fundamentos

Este informe resume las validaciones realizadas para cerrar la Fase 0 del proyecto MailiaCreate.

## Alcance

- Instalación automatizada en hosts Debian 12 y Ubuntu 22.04.
- Puesta en marcha de los servicios core definidos en `compose/docker-compose.prod.yml`.
- Verificación funcional básica (autenticación, envío/recepción, métricas).

## Entorno de pruebas

| Item | Detalle |
| --- | --- |
| Sistemas operativos | Debian 12.5, Ubuntu Server 22.04.4 |
| Hardware | 2 vCPU, 4 GB RAM, 40 GB SSD |
| Redes | IP pública con puertos 25/80/443/465/587/993 abiertos |
| Usuario | `mailia` con privilegios sudo |

## Procedimiento

1. Clonar repositorio y copiar `.env` basado en `compose/.env.example`.
2. Ejecutar `scripts/install.sh` (modo no interactivo con `--defaults`).
3. Revisar salida de instalador y registros en `logs/install_*.log`.
4. Lanzar `scripts/deploy.sh --env prod`.
5. Confirmar estado con `docker compose ps` y `docker compose logs --tail=50`.
6. Ejecutar pruebas funcionales descritas abajo.
7. Correr `scripts/backup.sh --check` para validar snapshots restic.

## Resultados

| Prueba | Resultado | Evidencia |
| --- | --- | --- |
| Instalación automatizada | ✅ | `install_debian12_2024-06-12.log`, `install_ubuntu2204_2024-06-12.log` |
| Servicio Caddy accesible en HTTPS | ✅ | Certificado autosignado emitido, acceso a https://mail.local.test |
| Autenticación webmail (usuario demo) | ✅ | Login exitoso con `demo@mail.test` |
| Envío/recepción SMTP (loopback) | ✅ | Mensajes recibidos en inbox demo en <5s |
| API JMAP (Email/query, Email/get) | ✅ | Respuestas 200 ms promedio |
| Send-router salud (`/healthz`) | ✅ | Respuesta HTTP 200 |
| Métricas básicas (Prometheus scrape) | ✅ | Endpoint `http://localhost:9090/metrics` accesible |
| Backup restic `--check` | ✅ | Snapshots verificados sin errores |

## Incidencias

- No se detectaron incidencias bloqueantes.
- Aviso: se utilizan certificados auto-firmados por defecto; se habilitará Let’s Encrypt en despliegues públicos.

## Recomendaciones

- Publicar imágenes de contenedor en registro propio y fijar etiquetas inmutables.
- Integrar pruebas de humo en pipeline CI utilizando contenedores efímeros.
- Automatizar pruebas SMTP/JMAP con suites como `swaks` y scripts Node.js para garantizar regresiones cero.

---

_Firma QA: Equipo MailiaCreate · 12/06/2024_
