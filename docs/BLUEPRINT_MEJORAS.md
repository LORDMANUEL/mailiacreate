# Blueprint de mejoras MailiaCreate

Este blueprint recoge iniciativas para evolucionar la experiencia de MailiaCreate más allá del release actual. Se agrupan por pilares estratégicos y cada bloque incluye el objetivo, entregables sugeridos y dependencias clave.

## 1. Experiencia de usuario webmail estilo Gmail++
- **Objetivo:** convertir el webmail Next.js en un cliente de productividad de clase mundial sin abandonar el despliegue "clonar y ejecutar".
- **Líneas de trabajo:**
  - Rediseño visual responsive basado en design tokens y dark mode.
  - Panel lateral modular con add-ons (CRM, notas, IA) acoplables vía `apps/` y feature flags.
  - Editor enriquecido con plantillas corporativas, firmas sincronizadas y atajos personalizables.
  - Extensiones contextuales: calendario incrustado, chat Matrix embebido y tablero de tareas.
  - Integración nativa con n8n mediante webhooks y OAuth para automatizar flujos sin código.
- **Dependencias:** biblioteca de componentes compartida, endpoints JMAP extendidos, contrato de add-ons.

## 2. Productividad integrada (correo + chat + calendario)
- **Objetivo:** ofrecer una vista unificada para que el usuario no abandone la plataforma.
- **Líneas de trabajo:**
  - Pestañas de conversación que agrupan hilo de correo, chat Matrix y evento de calendario.
  - Notificaciones push unificadas (FCM/Web Push) con centro de actividades en el webmail.
  - Agenda inteligente con booking de salas Jitsi y disponibilidad cruzada (CalDAV + Matrix presence).
  - Widgets "one-click" para convertir correos en tareas o automatizaciones n8n.
- **Dependencias:** APIs de Matrix y Nextcloud, permisos Keycloak (scopes delegados), worker en el webmail para notificaciones.

## 3. Automatización y flujos inteligentes
- **Objetivo:** preparar la suite para escenarios IA/hyperautomation.
- **Líneas de trabajo:**
  - Motor de reglas visual con integración n8n para disparar flujos desde eventos JMAP o Matrix.
  - Panel de insights con resúmenes automáticos (LLM) y clasificación de prioridad en bandeja.
  - Enriquecimiento de contactos con datos externos (CRM, Clearbit) y detección de anomalías en envíos.
  - Catálogo de plantillas y playbooks compartidos con versionado.
- **Dependencias:** servicio `ai-orchestrator`, colas send-router, almacenamiento MinIO para embeddings, credenciales de IA externas.

## 4. Operaciones y escalabilidad
- **Objetivo:** reforzar la plataforma para entornos multi-inquilino y despliegues HA.
- **Líneas de trabajo:**
  - Topología activa-activa con replicación de Stalwart, Synapse y Nextcloud.
  - Multi-región y disaster recovery automático (restic + replicación S3 cruzada).
  - Auto-scaling horizontal del webmail/paneles vía Kubernetes o Nomad.
  - Portal de observabilidad con SLOs, synthetic exporter avanzado y RCA asistido por IA.
- **Dependencias:** publicación de imágenes multi-arquitectura, pipelines reproducibles, exporter sintético, SCIM bridge en HA.

## 5. Identidad y ecosistema
- **Objetivo:** centralizar el ciclo de vida de identidades y accesos.
- **Líneas de trabajo:**
  - Finalizar la automatización SCIM (HRIS → Keycloak → Stalwart) con workflows reversibles.
  - Sincronización de grupos/roles con paneles y Matrix (SCIM + Keycloak admin events).
  - Portal de autoservicio de usuarios (reseteo de credenciales, provisión de dispositivos).
  - Integraciones marketplace (Atlassian, GitLab, Slack) a través de OIDC/SAML.
- **Dependencias:** servicio `scim-bridge`, hooks de Keycloak, APIs Stalwart, documentación HRIS.

## 6. Roadmap sugerido
1. **Sprint 1:** UX refresh, dark mode, métricas de usabilidad, base de add-ons.
2. **Sprint 2:** Integración calendario/chat embebido, notificaciones push, widgets n8n.
3. **Sprint 3:** Automatización avanzada (reglas + IA), catálogo de plantillas, exporter sintético 2.0.
4. **Sprint 4:** SCIM end-to-end y multi-inquilino inicial, pruebas HA.
5. **Sprint 5:** Marketplace de integraciones y gobierno de datos (auditoría avanzada, retención).

Cada sprint debería cerrarse con QA funcional, pruebas de regresión y validaciones de seguridad específicas (penetration test, hardening TLS) para garantizar que la visión "tan bueno como Gmail" se cumple con base en software libre y controlable por el cliente.
