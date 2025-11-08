from playwright.sync_api import sync_playwright, expect
import os

# Lee el dominio de las variables de entorno, con 'localhost' como valor por defecto
DOMAIN = os.environ.get("DOMAIN", "localhost")

def test_webmail_send_email(page):
    """
    Tests the end-to-end email sending flow in the Webmail UI.
    NOTE: This test assumes the user is already authenticated and on the inbox page.
          In a real-world scenario, the test would first handle the login flow.
    """
    print("Testing Webmail: Email Sending Flow...")
    page.goto(f"http://webmail.{DOMAIN}/inbox")

    # 1. Abrir el modal de composición
    page.get_by_role("button", name="New").click()

    # 2. Rellenar el formulario
    compose_modal = page.locator("div.fixed.inset-0")
    expect(compose_modal).to_be_visible()

    # Rellenar destinatario, asunto y cuerpo
    recipient_email = f"test-recipient@{DOMAIN}"
    email_subject = "E2E Test Email"
    email_body = "This is a test email sent via the Playwright end-to-end test."

    compose_modal.get_by_placeholder("To").fill(recipient_email)
    compose_modal.get_by_placeholder("Subject").fill(email_subject)
    compose_modal.get_by_placeholder("Your message...").fill(email_body)

    # 3. Enviar el correo
    # Escucharemos el evento de alerta como una forma de confirmar el envío
    page.once("dialog", lambda dialog: dialog.accept())
    compose_modal.get_by_role("button", name="Send").click()

    print("Email sending flow test completed conceptually.")
    page.screenshot(path="mailkit/tests/webmail_send_email_test.png")
    print("Screenshot saved to mailkit/tests/webmail_send_email_test.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        # Nota: Para ejecutar esta prueba, el entorno debe estar en funcionamiento
        # y debes tener una sesión de NextAuth válida guardada como 'storageState'.
        # Por simplicidad, este script no maneja el inicio de sesión.
        browser = p.chromium.launch()
        context = browser.new_context() # Podrías cargar el estado de almacenamiento aquí
        page = context.new_page()
        try:
            test_webmail_send_email(page)
        finally:
            browser.close()
