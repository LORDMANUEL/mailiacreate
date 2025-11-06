# QA Final — Validación integral MailiaCreate

## Resumen
Última pasada de aseguramiento de calidad antes de marcar el proyecto como "listo". Se verificaron servicios Node, scripts operativos y consistencia de configuración para los paneles Next.js.

## Entorno
- Debian 12 (container CI)
- Node.js 20.12
- Dependencias instaladas localmente cuando fue posible; para librerías externas se documentan las restricciones de red.

## Pruebas ejecutadas

| ID | Prueba | Resultado |
| -- | ------ | -------- |
| QA-01 | `node --check services/send-router/src/index.js` | ✅ Sin errores de sintaxis.
| QA-02 | `node --check services/ai-orchestrator/src/index.js` | ✅ Sin errores de sintaxis.
| QA-03 | `node --check services/restic-scheduler/src/index.js` | ✅ Sin errores de sintaxis.
| QA-04 | `bash scripts/hardening-check.sh` con `compose/.env` personalizado | ✅ Configuración segura aceptada.
| QA-05 | `npm --prefix services/admin-panel install` | ⚠️ Falló por restricción 403 hacia registry.npmjs.org (entorno sin acceso externo).
| QA-06 | `npm --prefix services/it-panel install` | ⚠️ Falló por restricción 403 hacia registry.npmjs.org (entorno sin acceso externo).

## Incidencias y soluciones

1. **Falta de dependencia `dotenv` en los paneles Next.js.**
   - *Impacto:* `next build` fallaba porque `next.config.mjs` importa `dotenv/config` para cargar variables de entorno.
   - *Resolución:* Se añadió `dotenv` como dependencia directa en `services/admin-panel` y `services/it-panel` y se limpió el `next.config.mjs` del panel admin de imports sin uso.

2. **Ejecución de npm bloqueada por políticas de red.**
   - *Impacto:* Imposible instalar dependencias desde el registry durante QA automatizada.
   - *Mitigación:* Se documentó la limitación. En entornos con acceso a Internet se debe repetir `npm install` para ambos paneles tras actualizar las dependencias.

## Próximos pasos recomendados
- Reejecutar `npm install && npm run build` para `services/admin-panel` y `services/it-panel` en un entorno con acceso a npm para confirmar builds productivos.
- Integrar las validaciones (`node --check`, `hardening-check.sh`) dentro del pipeline CI.
