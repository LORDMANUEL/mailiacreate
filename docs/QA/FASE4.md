# QA Fase 4 — Send-Router & Extensiones

## Entorno
- Debian 12 / Docker Engine 26
- Variables clave:
  - `SEND_ROUTER_AI_URL=http://ai-orchestrator:4100`
  - `SEND_ROUTER_WEBHOOK_TOKEN` personalizado
  - MinIO inicializado con bucket `mailiacreate`

## Pruebas ejecutadas

| ID | Prueba | Resultado |
| -- | ------ | -------- |
| SR-01 | `POST /api/send` canal `email` con adjunto pequeño; validación de colas (`/api/jobs/:id`). | ✅ Mensaje procesado, `messageId` recibido y job en estado `completed`. |
| SR-02 | `POST /api/send` canal `matrix` contra sala de pruebas `#qa:chat.example.com`. | ✅ Evento visible en Element y transacción confirmada. |
| SR-03 | `POST /api/send` canal `storage` con archivo de 1 MB. | ✅ Objeto creado en MinIO (`mailiacreate/send-router/<job-id>/file.txt`). |
| SR-04 | Envío con `channel=webhook` y token inválido. | ✅ Solicitud rechazada en destino, send-router reintenta según backoff exponencial hasta marcar `failed`. |
| SR-05 | Simulación de AI con payload que contiene palabras de spam. | ✅ Pre-chequeo devuelve `risk=0.86` y la API responde `500` (bloqueado por umbral). |
| SR-06 | Métricas en `http://localhost:4000/metrics`. | ✅ Métricas `send_router_jobs_*` visibles y scrapeadas por Prometheus. |

## Evidencias
- Capturas de logs de BullMQ con `retry`/`completed`.
- Listado del bucket MinIO mostrando claves por job.
- Dashboard Prometheus `send_router_jobs_enqueued_total` con incremento tras las pruebas.

## Pendientes / Riesgos
- Ajustar dashboard Grafana específico para canales.
- Añadir pruebas de integración Matrix con mensajes enriquecidos (HTML). 
