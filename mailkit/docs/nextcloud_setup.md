# Configuración de Nextcloud

Una vez que los servicios de Docker estén en funcionamiento, sigue estos pasos para configurar Nextcloud:

1.  **Accede a la interfaz web de Nextcloud:** Abre tu navegador y ve a `http://cloud.tudominio.com`. Deberías ver la página de configuración inicial de Nextcloud.

2.  **Crea una cuenta de administrador:** Introduce un nombre de usuario y una contraseña para la cuenta de administrador.

3.  **Configura la base de datos:**
    *   Haz clic en "Almacenamiento y base de datos".
    *   Selecciona "MySQL/MariaDB".
    *   Introduce los siguientes detalles:
        *   **Usuario de la base de datos:** `nextcloud`
        *   **Contraseña de la base de datos:** La contraseña que estableciste en tu archivo `.env` para `MYSQL_PASSWORD`.
        *   **Nombre de la base de datos:** `nextcloud`
        *   **Host de la base de datos:** `db`
    *   Haz clic en "Finalizar instalación".

4.  **Inicia sesión:** Una vez que la instalación esté completa, serás redirigido a la página de inicio de sesión. Inicia sesión con la cuenta de administrador que acabas de crear.

5.  **Prueba la subida de archivos:** Para asegurarte de que todo funciona correctamente, intenta subir y descargar un archivo.
