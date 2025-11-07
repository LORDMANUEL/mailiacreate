# Blueprint de mejoras MailiaCreate

Este blueprint recoge iniciativas para evolucionar la experiencia de MailiaCreate más allá del release actual. Se agrupan por pilares estratégicos y cada bloque incluye el objetivo, entregables sugeridos y dependencias clave.

## Estado actual de las mejoras
- ✅ **Webmail Gmail+ desplegado:** layout de tres paneles, módulos anclables (chat, calendario, co-redacción, firmas) y presencia Matrix integrada.
- ✅ **Telemetría operativa:** Sentry, Mixpanel, Hotjar y exportador sintético conectados a Grafana/Alertmanager.
- ✅ **Automatización SCIM extendida:** aprovisionamiento/baja-reactivación conectado con Keycloak y Stalwart.
- ✅ **CI/CD endurecido:** builds Next.js firmados, imágenes multi-arquitectura y restauraciones Restic programadas.
- ⏳ **Backlog activo:** las secciones siguientes detallan las iniciativas en curso o planificadas.

## 1. Experiencia de usuario webmail estilo Gmail++
- **Objetivo:** convertir el webmail Next.js en un cliente de productividad de clase mundial sin abandonar el despliegue "clonar y ejecutar".
- **Entregables clave:**
  - Rediseño visual responsive basado en design tokens, dark mode y accesibilidad AA.
  - Layout modular de tres paneles con add-ons (CRM, notas, IA) acoplables vía `apps/` y feature flags.
  - Editor enriquecido con plantillas corporativas, firmas sincronizadas, atajos personalizables y co-redacción en tiempo real.
  - Extensiones contextuales: calendario incrustado, chat Matrix embebido, tablero de tareas y presencia en vivo.
  - Integración nativa con n8n mediante webhooks y OAuth para automatizar flujos sin código.
- **Métricas de éxito:** adopción de add-ons, tiempo medio de respuesta, NPS interno, uso de modo colaborativo.
- **Dependencias:** biblioteca de componentes compartida, endpoints JMAP extendidos, contrato de add-ons.

## 2. Productividad integrada (correo + chat + calendario)
- **Objetivo:** ofrecer una vista unificada para que el usuario no abandone la plataforma.
- **Entregables clave:**
  - Pestañas de conversación que agrupan hilo de correo, chat Matrix y evento de calendario con sincronización bidireccional.
  - Notificaciones push unificadas (FCM/Web Push) con centro de actividades y snooze contextual.
  - Agenda inteligente con booking de salas Jitsi, disponibilidad cruzada (CalDAV + Matrix presence) y recordatorios automatizados.
  - Widgets "one-click" para convertir correos en tareas o automatizaciones n8n.
- **Métricas de éxito:** uso de pestañas unificadas, tasa de adopción de widgets, latencia de notificaciones push.
- **Dependencias:** APIs de Matrix y Nextcloud, permisos Keycloak (scopes delegados), worker en el webmail para notificaciones.

## 3. Automatización y flujos inteligentes
- **Objetivo:** preparar la suite para escenarios IA/hyperautomation.
- **Entregables clave:**
  - Motor de reglas visual con integración n8n para disparar flujos desde eventos JMAP o Matrix y seguimiento en tiempo real.
  - Panel de insights con resúmenes automáticos (LLM), clasificación de prioridad en bandeja y sugerencias accionables.
  - Enriquecimiento de contactos con datos externos (CRM, Clearbit) y detección de anomalías en envíos.
  - Catálogo de plantillas y playbooks compartidos con versionado y permisos granulares.
- **Métricas de éxito:** workflows creados, ahorro de tiempo en clasificar correos, tasa de falsos positivos en alertas IA.
- **Dependencias:** servicio `ai-orchestrator`, colas send-router, almacenamiento MinIO para embeddings, credenciales de IA externas.

## 4. Operaciones y escalabilidad
- **Objetivo:** reforzar la plataforma para entornos multi-inquilino y despliegues HA.
- **Entregables clave:**
  - Topología activa-activa con replicación de Stalwart, Synapse y Nextcloud, failover Keepalived/HAProxy y pruebas de caos.
  - Multi-región y disaster recovery automático (restic + replicación S3 cruzada) con ejercicios trimestrales documentados.
  - Auto-scaling horizontal del webmail/paneles vía Kubernetes o Nomad y pipelines GitOps.
  - Portal de observabilidad con SLOs, synthetic exporter avanzado y RCA asistido por IA.
- **Métricas de éxito:** RTO/RPO confirmados, disponibilidad mensual, número de incidentes detectados proactivamente.
- **Dependencias:** publicación de imágenes multi-arquitectura, pipelines reproducibles, exporter sintético, SCIM bridge en HA.

## 5. Identidad y ecosistema
- **Objetivo:** centralizar el ciclo de vida de identidades y accesos.
- **Entregables clave:**
  - Automatización SCIM extendida (HRIS → Keycloak → Stalwart) con workflows reversibles y pruebas de regresión.
  - Sincronización de grupos/roles con paneles, Matrix y servicios externos mediante SCIM + eventos administrativos de Keycloak.
  - Portal de autoservicio de usuarios (reseteo de credenciales, provisión de dispositivos, solicitudes de acceso).
  - Integraciones marketplace (Atlassian, GitLab, Slack) a través de OIDC/SAML con provisioning asistido.
- **Métricas de éxito:** tiempo medio de alta/baja, incidencias de acceso, adopción del portal de autoservicio.
- **Dependencias:** servicio `scim-bridge`, hooks de Keycloak, APIs Stalwart, documentación HRIS.

## 6. Roadmap sugerido
1. **Sprint 1:** UX refresh, dark mode, métricas de usabilidad, base de add-ons.
2. **Sprint 2:** Integración calendario/chat embebido, notificaciones push, widgets n8n.
3. **Sprint 3:** Automatización avanzada (reglas + IA), catálogo de plantillas, exporter sintético 2.0.
4. **Sprint 4:** SCIM end-to-end y multi-inquilino inicial, pruebas HA.
5. **Sprint 5:** Marketplace de integraciones y gobierno de datos (auditoría avanzada, retención).

Cada sprint debería cerrarse con QA funcional, pruebas de regresión y validaciones de seguridad específicas (penetration test, hardening TLS) para garantizar que la visión "tan bueno como Gmail" se cumple con base en software libre y controlable por el cliente.
