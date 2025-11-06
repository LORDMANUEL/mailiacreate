# Testing the Send-Router Service

Este documento describe cómo ejecutar el conjunto de pruebas para el servicio Send-Router.

## Prerrequisitos

Asegúrate de haber instalado todas las dependencias de desarrollo ejecutando el siguiente comando desde el directorio `mailkit/src/send-router`:

```bash
npm install
```

## Ejecutar las Pruebas

Una vez instaladas las dependencias, puedes ejecutar el conjunto de pruebas usando el script `test` definido en `package.json`:

```bash
npm test
```

Esto iniciará el corredor de pruebas de Jest, que descubrirá y ejecutará automáticamente los archivos de prueba (es decir, `index.test.js`).

## Salida Esperada

Si todas las pruebas pasan, deberías ver una salida similar a la siguiente en tu terminal:

```
PASS  ./index.test.js
  Send-Router API
    POST /api/send
      ✓ should return 400 if channel is missing (23 ms)
      ✓ should return 400 if to is missing or empty (5 ms)
      ✓ should return 400 for an invalid channel (3 ms)
      ✓ should return 202 and route to the email handler (4 ms)
      ✓ should return 202 and route to the matrix handler (3 ms)
      ✓ should return 202 and route to the webhook handler (3 ms)
    GET /health
      ✓ should return 200 OK (3 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        1.25 s
Ran all test suites.
```

Además, verás los registros de la consola de los manejadores de canales simulados, demostrando que la lógica de enrutamiento funciona correctamente.
