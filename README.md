# MailKit Rust Suite

Bienvenido a la MailKit Rust Suite, una plataforma de correo y colaboración autoalojada, moderna y de código abierto, diseñada para ser segura, eficiente y extensible. Este proyecto está basado en el "Blueprint de Producción - MailKit Rust Suite" y está orquestado completamente con Docker.

El núcleo de la suite es **Stalwart Mail Server**, un servidor de correo escrito en Rust que proporciona servicios JMAP, IMAP, SMTP y más.

## Estado del Proyecto

Este repositorio contiene la **base funcional** de la MailKit Rust Suite. Las fases de desarrollo completadas incluyen:

*   **Fase 0 - Fundación:**
    *   Infraestructura completa definida en Docker Compose.
    *   Proxy inverso (Caddy) configurado para todos los servicios.
    *   Interfaz de usuario básica del webmail (inicio de sesión y vista de bandeja de entrada) con integración a nivel de código con JMAP.
    *   Configuración de Stalwart para producción con placeholders para DKIM/TLS.
*   **Fase 1 - Colaboración (Documentación):**
    *   Se ha proporcionado documentación detallada para configurar Nextcloud (Archivos/Calendarios/Contactos), Matrix Synapse (Chat) y Jitsi Meet (Videollamadas).

Las fases pendientes de desarrollo completo de la interfaz de usuario son: **Fase 2 (Panel de Administración)**, **Fase 3 (Panel de TI)** y **Fase 4 (Send-Router)**. Las aplicaciones para estas fases existen como placeholders.

## Servicios Incluidos

| Servicio | Subdominio Sugerido | Descripción |
| :--- | :--- | :--- |
| **Stalwart** | `mail.tudominio.com` | Servidor principal de correo (JMAP/IMAP/SMTP). |
| **Webmail** | `webmail.tudominio.com` | Cliente de correo web inspirado en Gmail. |
| **Nextcloud** | `cloud.tudominio.com` | Sincronización de archivos, calendarios y contactos (CalDAV/CardDAV). |
| **Matrix Synapse**| `chat.tudominio.com` | Servidor de chat descentralizado. |
| **Element** | `element.tudominio.com`| Cliente web para Matrix. |
| **Jitsi Meet** | `meet.tudominio.com` | Solución de videollamadas. |
| **Caddy** | (Punto de entrada) | Proxy inverso automático con HTTPS (Let's Encrypt). |
| **Loki/Grafana**| (Interno) | Pila de monitorización y registro. |
| **Restic** | (CLI) | Sistema de copias de seguridad. |

## Prerrequisitos

*   **Docker** y **Docker Compose** instalados en tu servidor.
*   Un **nombre de dominio** (`tudominio.com`) y la capacidad de configurar sus registros DNS.
*   Puertos **80** y **443** abiertos en el cortafuegos de tu servidor.

## Instalación y Despliegue

### 1. Clonar el Repositorio

```bash
git clone <url_del_repositorio>
cd mailkit-rust-suite
```

### 2. Configurar los Dominios

Antes de empezar, necesitas reemplazar todas las instancias de `tudominio.com` con tu dominio real. Esto incluye los archivos de configuración de Caddy y Stalwart.

*   `mailkit/caddy/Caddyfile`
*   `mailkit/stalwart/config.toml`

### 3. Crear los Archivos de Entorno

El proyecto utiliza archivos `.env` para gestionar las contraseñas y la configuración. Se proporcionan archivos de ejemplo.

```bash
# Copiar el archivo de entorno principal
cp mailkit/.env.example mailkit/.env

# Copiar el archivo de entorno de Jitsi
cp mailkit/.env.jitsi.example mailkit/.env.jitsi
```

**Importante:** Edita `mailkit/.env` y `mailkit/.env.jitsi` y reemplaza las contraseñas `changeme` por valores seguros.

### 4. Configurar DNS

Configura los siguientes registros DNS para tu dominio:

*   **Registros A:** Apunta los subdominios (`mail`, `webmail`, `cloud`, `chat`, `element`, `meet`) a la dirección IP de tu servidor.
*   **Registro MX:** Apunta tu dominio raíz (`tudominio.com`) a `mail.tudominio.com`.
    *   `tudominio.com. IN MX 10 mail.tudominio.com.`
*   **SPF, DKIM, DMARC:** Sigue las instrucciones en `mailkit/stalwart/config.toml` para generar una clave DKIM y configurar los registros de autenticación de correo necesarios para evitar que tus correos sean marcados como spam.

### 5. Desplegar la Suite

Ejecuta el script de despliegue. Este script creará una red compartida de Docker e iniciará todos los servicios.

```bash
chmod +x deploy.sh
./deploy.sh
```

Los servicios se iniciarán en segundo plano. Puedes ver los registros con `sudo docker compose -f mailkit/docker-compose.prod.yml logs -f`.

### 6. Configuración Post-Instalación

Algunos servicios requieren una configuración única después del primer inicio:

*   **Nextcloud:** Navega a `https://cloud.tudominio.com` y sigue las instrucciones en `mailkit/docs/nextcloud_setup.md`.
*   **Matrix Synapse:** Sigue las instrucciones en `mailkit/docs/synapse_setup.md` para generar la configuración inicial.
*   **Jitsi Meet:** La configuración se gestiona a través del archivo `.env.jitsi`.
*   **Keycloak (SSO):** Se requiere una configuración inicial manual después del primer despliegue.

### Configuración Inicial de Keycloak

Después de desplegar la suite por primera vez, necesitas configurar Keycloak para la gestión de usuarios y la seguridad de las aplicaciones.

1.  **Accede a la Consola de Administración:**
    *   Navega a `https://sso.tudominio.com`.
    *   Inicia sesión con el usuario administrador que definiste en tu archivo `.env` (`KEYCLOAK_ADMIN_USER` y `KEYCLOAK_ADMIN_PASSWORD`).

2.  **Crea un Nuevo Realm:**
    *   En la esquina superior izquierda, haz clic en "master" y luego en "Create Realm".
    *   Nombra el realm `mailkit` y haz clic en "Create".

3.  **Configura Clientes OIDC para las Aplicaciones:**
    *   Asegúrate de estar en el realm `mailkit`.
    *   Ve a "Clients" y haz clic en "Create client".
    *   Crea un cliente para el **Panel de Administración**:
        *   **Client ID:** `admin-panel`
        *   **Valid Redirect URIs:** `https://admin.tudominio.com/*`
        *   **Web Origins:** `https://admin.tudominio.com`
    *   Guarda el cliente. Repite el proceso para el **Panel de TI** (`it-panel`).

4.  **Crea Roles de Aplicación:**
    *   Ve a "Clients", selecciona `admin-panel`.
    *   Ve a la pestaña "Roles" y crea roles como `admin` y `helpdesk`.

5.  **Crea Usuarios:**
    *   Ve a "Users" y crea nuevos usuarios.
    *   En la pestaña "Credentials", establece una contraseña para cada usuario.
    *   En la pestaña "Role mapping", asigna los roles que creaste.

## Gestión de Copias de Seguridad

El proyecto incluye scripts para realizar copias de seguridad y restauraciones de los datos de Stalwart usando Restic.

*   **Para crear una copia de seguridad:**
    ```bash
    chmod +x backup.sh
    ./backup.sh
    ```
*   **Para restaurar la última copia de seguridad:**
    ```bash
    chmod +x restore.sh
    ./restore.sh
    ```

Las copias de seguridad se almacenan en la carpeta `mailkit/backups`.

## Mantenimiento y Solución de Problemas

### Ver Registros (Logs)

Para ver los registros de todos los servicios en tiempo real, puedes usar el siguiente comando:

```bash
sudo docker compose -f mailkit/docker-compose.prod.yml logs -f
```

Para ver los registros de un servicio específico (por ejemplo, `stalwart`):

```bash
sudo docker compose -f mailkit/docker-compose.prod.yml logs -f stalwart
```

### Rotación de Claves DKIM

Se recomienda rotar tus claves DKIM periódicamente. Para ello:
1.  Genera un nuevo par de claves con un selector diferente (por ejemplo, `selector2`).
2.  Añade una nueva entrada `[[dkim]]` en `mailkit/stalwart/config.toml` con el nuevo selector.
3.  Publica el nuevo registro TXT de DKIM en tu DNS.
4.  Reinicia el servicio de Stalwart: `sudo docker compose -f mailkit/docker-compose.prod.yml restart stalwart`.
5.  Después de un tiempo, puedes eliminar la clave antigua.

### Actualización de los Servicios

Para actualizar las imágenes de Docker a sus últimas versiones:

1.  Detén los servicios: `sudo docker compose -f mailkit/docker-compose.prod.yml down`.
2.  Obtén las últimas imágenes: `sudo docker compose -f mailkit/docker-compose.prod.yml pull`.
3.  Vuelve a iniciar los servicios: `./deploy.sh`.
