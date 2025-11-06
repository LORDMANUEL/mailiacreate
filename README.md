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
*   **Jitsi Meet:** La configuración se gestiona a través del archivo `.env.jitsi`, pero consulta `mailkit/docs/jitsi_setup.md` para más detalles.

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
