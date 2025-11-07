# QA Fase 5 — IA & Automatización

## Entorno
- Servicio `ai-orchestrator` ejecutándose en contenedor Docker.
- `curl` y `jq` para validación de respuestas.

## Pruebas ejecutadas

| ID | Prueba | Resultado |
| -- | ------ | -------- |
| AI-01 | `POST /api/analyze` con texto neutro (correo interno). | ✅ Clasificación `low`, riesgo 0.14, sin recomendaciones. |
| AI-02 | `POST /api/analyze` con términos de phishing y enlaces http://. | ✅ Riesgo 0.88, clasificación `high`, incluye recomendación de revisión manual. |
| AI-03 | `POST /api/analyze` con 30 destinatarios simulados y adjuntos ejecutables. | ✅ Riesgo 0.94, etiquetas `bulk` y `executable_attachment`. |
| AI-04 | `POST /api/summarize` con cuerpo largo HTML. | ✅ Resumen generado con 2 frases y HTML saneado. |
| AI-05 | Validación de métricas en `/metrics`. | ✅ Histogramas `ai_orchestrator_risk_score` expuestos y scrapeados por Prometheus. |
| AI-06 | Integración con send-router (`SEND_ROUTER_AI_URL` activo). | ✅ Envíos de riesgo alto bloqueados, respuesta 500 controlada. |

## Evidencias
- Respuestas JSON firmadas con `risk` y `classification` almacenadas.
- Panel IT mostrando nuevas series de riesgo.

## Pendientes / Riesgos
- Añadir endpoint para feedback (marcar falso positivo/negativo).
- Evaluar uso de modelos ML ligeros cuando el hardware lo permita.
