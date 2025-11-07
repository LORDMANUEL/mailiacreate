# QA Fase 3 — Observabilidad & Backups

## Entorno
- Debian 12, Docker 26.1, Compose v2.27.
- Restic 0.16.4 instalado en host para pruebas externas.

## Casos ejecutados
1. **Prometheus**
   - Verificación de objetivos: `docker compose exec prometheus promtool tsdb analyze` confirma series activas.
   - Scrape exitoso de `stalwart:9091`, `cadvisor:8080`, `restic-scheduler:8000`.

2. **Grafana**
   - Provisionamiento automático del datasource y dashboard “MailiaCreate Overview”.
   - Visualización de paneles con datos simulados (cola SMTP, latencia JMAP, logs Loki).

3. **Alertmanager → send-router**
   - Generación manual de alerta `HighSMTPQueue` (`curl -XPOST http://localhost:9093/-/reload`).
   - Registro en logs del send-router con payload recibido en `/api/hooks/alerts`.

4. **Restic scheduler**
   - Ejecución `curl -X POST http://localhost:8000/run` → estado `success`, métrica `restic_scheduler_runs_total{result="success"}` incrementa.
   - Archivo `services/restic-scheduler/state/status.json` actualizado con `lastSuccess`.

5. **Backups/Restore scripts**
   - `./scripts/backup.sh` genera tarballs incluyendo nuevos volúmenes (`nextcloud-data`, `prometheus-data`, `restic-data`).
   - `./scripts/restore.sh <backup>` repuebla volúmenes en ambiente limpio.

## Resultados
- ✅ Observabilidad lista out-of-the-box con dashboards y alertas integradas.
- ✅ API de backups disponible vía scheduler + scripts tradicionales.
- ⚠️ Recomendada integración con repositorio externo (S3/MinIO) antes de producción.
