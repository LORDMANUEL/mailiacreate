# Guía de clúster MailiaCreate (4 nodos)

Esta guía describe una topología activa/activa basada en cuatro nodos para elevar la resiliencia de MailiaCreate, combinando balanceo de carga, replicación del core de correo y failover automático mediante Keepalived.

## Objetivos

- Mantener la experiencia “clonar y ejecutar” como base, añadiendo componentes opcionales para escenarios de alta disponibilidad.
- Garantizar continuidad del servicio ante la caída de un nodo de correo o proxy.
- Replicar datos críticos (Stalwart, Redis, Nextcloud, bases de datos) entre nodos mediante volúmenes compartidos o réplicas externas.
- Supervisar la salud del clúster con métricas Prometheus y eventos Sentry en tiempo real.

## Componentes adicionales

| Componente | Rol | Notas |
|------------|-----|-------|
| `haproxy` | Balanceo HTTP/HTTPS y JMAP | Expone puertos 80/443/8443/8444 y publica estadísticas en `:8404`. |
| `keepalived` | VIP flotante | Anuncia una IP virtual compartida entre nodos, monitorea `haproxy`. |
| `caddy-primary` / `caddy-secondary` | Reverse proxies dedicados | Reutilizan el `Caddyfile` oficial y montan volúmenes independientes. |
| `stalwart-primary` / `stalwart-secondary` | Nodos de correo replicados | Utilizan `STALWART_NODE_ID` y `STALWART_JOIN_NODE` para descubrimiento inicial. |

La definición de referencia se encuentra en [`compose/docker-compose.ha.yml`](../compose/docker-compose.ha.yml) y el balanceador en [`config/haproxy/haproxy.cfg`](../config/haproxy/haproxy.cfg).

## Arquitectura física sugerida

| Nodo | Función | IP sugerida | Servicios |
|------|---------|-------------|----------|
| `node-mail-1` | Primario | `10.0.0.11` | `haproxy`, `keepalived`, `caddy-primary`, `stalwart-primary`, servicios colaborativos. |
| `node-mail-2` | Secundario | `10.0.0.12` | `haproxy`, `keepalived`, `caddy-secondary`, `stalwart-secondary`, réplicas Redis/Postgres. |
| `node-ops-1` | Observabilidad | `10.0.0.21` | `prometheus`, `grafana`, `loki`, `synthetic-exporter`, `ai-orchestrator`, `send-router`. |
| `node-ops-2` | Colaboración | `10.0.0.22` | `synapse`, `element`, `jitsi`, `nextcloud`, `minio`, `restic-scheduler`. |

## Sincronización de datos

1. **Stalwart**: habilitar `STALWART_JOIN_NODE` y replicación nativa (PostgreSQL/RocksDB externo) o sincronización de volúmenes ZFS/Gluster.
2. **Redis/BullMQ**: desplegar Redis en modo réplica (primary/replica) y ajustar `SEND_ROUTER_REDIS_HOST` a un VIP interno.
3. **Keycloak/PostgreSQL**: mover la base de datos a un clúster externo (Patroni, RDS) y compartir `KEYCLOAK_DB_*` entre nodos.
4. **Nextcloud/MariaDB**: usar Galera o MariaDB replica, compartir almacenamiento de archivos vía Ceph, NFS o MinIO multi-site.
5. **Backups**: Restic puede enviarse a un bucket S3 externo replicado con retención cruzada.

## Failover y heartbeats

- `keepalived` monitoriza el proceso `haproxy`. Si el nodo primario falla, el secundario anuncia el VIP y continúa aceptando tráfico.
- `haproxy` supervisa endpoints `/healthz` de Caddy y Stalwart para retirar nodos degradados.
- Los paneles Grafana incluyen ahora paneles de eventos Sentry para detectar errores antes de afectar a los usuarios.

## Pasos de despliegue

1. Provisiona dos nodos con acceso a la misma red y certificados compartidos (o Let’s Encrypt wildcard) y configura `CLUSTER_*` en `compose/.env`.
2. Ejecuta `docker compose -f compose/docker-compose.ha.yml up -d` en cada nodo (ajustando prioridades de Keepalived si es necesario).
3. Redirige el DNS público (A/AAAA) de `mail.example.com` y subdominios hacia la IP virtual definida en `CLUSTER_VIP`.
4. En los nodos de operaciones, levanta el stack estándar (`docker-compose.prod.yml`) apuntando los servicios al VIP para consumir APIs y métricas.
5. Verifica failover forzando la detención de `haproxy` en `node-mail-1`; `keepalived` debe mover el VIP y Grafana debe reflejar el evento a través de Sentry.

## Monitorización

- **Sentry**: Las aplicaciones web y microservicios envían errores y fallos de sintéticos con etiquetas `source` que facilitan identificar el nodo afectado.
- **Grafana**: Paneles nuevos “Send-Router Sentry Events” y “AI Orchestrator Sentry Events” muestran la tasa de incidencias por componente.
- **Synthetic exporter**: Mantiene métricas de salud de extremo a extremo (`synthetic_overall_status`), útiles para validar el VIP desde fuera del clúster.

## Próximos pasos recomendados

- Automatizar la promoción de nodos de correo (ansible/terraform) e integrar pruebas de failover en CI.
- Añadir replicación geográfica (multi-región) empleando múltiples VIPs o Anycast.
- Exponer métricas de Keepalived (`keepalived_exporter`) y de HAProxy (`haproxy_exporter`) para completar el observability stack.

Con esta base, MailiaCreate puede operar en entornos de misión crítica manteniendo el enfoque de despliegue reproducible del proyecto principal.
