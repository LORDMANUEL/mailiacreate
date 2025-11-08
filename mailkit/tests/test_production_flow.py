from playwright.sync_api import sync_playwright, expect
import os

# --- Configuración ---
DOMAIN = os.environ.get("DOMAIN", "localhost")
KEYCLOAK_URL = f"https://sso.{DOMAIN}/realms/mailkit/protocol/openid-connect/auth"
USER_EMAIL = os.environ.get("TEST_USER_EMAIL", f"testuser@{DOMAIN}")
USER_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "changeme")

def test_production_end_to_end_flow(page):
    """
    Prueba el flujo de producción de extremo a extremo:
    1. Inicia sesión en el Webmail a través de Keycloak.
    2. Envía un correo a sí mismo.
    3. Verifica que el correo se recibe en la bandeja de entrada.
    """
    print("--- Iniciando Prueba de Flujo de Producción E2E ---")

    # 1. Iniciar Sesión
    print(f"Navegando a http://webmail.{DOMAIN}...")
    page.goto(f"http://webmail.{DOMAIN}")
    page.get_by_role("button", name="Iniciar Sesión con SSO").click()

    print("Redirigido a Keycloak. Iniciando sesión...")
    expect(page).to_have_title("Log in to mailkit", timeout=20000)
    page.get_by_label("Username or email").fill(USER_EMAIL)
    page.get_by_label("Password").fill(USER_PASSWORD)
    page.get_by_role("button", name="Sign In").click()

    # 2. Enviar un Correo
    print("Inicio de sesión exitoso. Navegando a la bandeja de entrada y componiendo correo...")
    expect(page.get_by_role("button", name="New")).to_be_visible(timeout=10000)
    page.get_by_role("button", name="New").click()

    email_subject = f"Test E2E - {int(time.time())}"
    email_body = "Este es un correo de prueba enviado y recibido en el flujo de producción."

    compose_modal = page.locator("div.fixed.inset-0")
    compose_modal.get_by_placeholder("To").fill(USER_EMAIL)
    compose_modal.get_by_placeholder("Subject").fill(email_subject)
    compose_modal.get_by_placeholder("Your message...").fill(email_body)

    page.once("dialog", lambda dialog: dialog.accept()) # Aceptar la alerta de "enviado"
    compose_modal.get_by_role("button", name="Send").click()
    print(f"Correo de prueba enviado con asunto: {email_subject}")

    # 3. Verificar Recepción
    print("Refrescando y esperando recibir el correo...")
    # Esperar un poco para que el correo llegue
    page.wait_for_timeout(5000)
    page.reload()

    # Buscar el correo en la lista
    expect(page.get_by_text(email_subject)).to_be_visible(timeout=15000)
    print("¡Éxito! El correo de prueba fue encontrado en la bandeja de entrada.")

    page.screenshot(path="mailkit/tests/production_flow_success.png")
    print("--- Prueba de Flujo de Producción E2E completada con éxito. ---")


if __name__ == "__main__":
    import time
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_production_end_to_end_flow(page)
        finally:
            browser.close()
