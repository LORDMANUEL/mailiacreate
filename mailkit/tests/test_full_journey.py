from playwright.sync_api import sync_playwright, expect

def test_full_user_journey(page):
    """
    Tests an end-to-end user journey:
    1.  Navigates to the Admin Panel.
    2.  Creates a new user via the (mocked) UI.
    3.  Navigates to the Webmail login page.
    4.  Clicks the SSO login button.
    5.  Verifies that the browser is redirected to the Keycloak login page.
    """
    # --- Parte 1: Crear un Usuario en el Panel de Administración ---
    print("Testing Admin Panel: User Creation...")
    page.goto("http://admin.{$DOMAIN}")

    # Esperar a que la lista de usuarios inicial se cargue
    expect(page.get_by_text("alice@{$DOMAIN}")).to_be_visible(timeout=10000)

    # Crear un nuevo usuario
    page.get_by_role("button", name="Create User").click()
    new_user_email = "new.user.e2e@{$DOMAIN}"
    page.get_by_label("Email Address").fill(new_user_email)
    page.get_by_role("button", name="Save User").click()

    # Verificar que el nuevo usuario aparece en la lista
    expect(page.get_by_text(new_user_email)).to_be_visible()
    print("Admin Panel test passed.")

    # --- Parte 2: Probar el Flujo de Autenticación del Webmail ---
    print("\nTesting Webmail: Authentication Redirect...")
    page.goto("http://webmail.{$DOMAIN}")

    # Hacer clic en el botón de inicio de sesión de SSO
    page.get_by_role("button", name="Iniciar Sesión con SSO").click()

    # Esperar la redirección a Keycloak
    expect(page).to_have_title("Log in to mailkit", timeout=15000)
    expect(page.get_by_label("Username or email")).to_be_visible()
    print("Webmail correctly redirected to Keycloak login page.")

    # Tomar una captura de pantalla del resultado final
    page.screenshot(path="mailkit/tests/full_user_journey_test.png")
    print("\nFull user journey test passed conceptually.")
    print("Screenshot saved to mailkit/tests/full_user_journey_test.png")

if __name__ == "__main__":
    import os
    domain = os.environ.get("DOMAIN", "localhost")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            # Reemplazar el marcador de posición del dominio en el script
            script_content = test_full_user_journey.__doc__.replace("{$DOMAIN}", domain)
            test_full_user_journey(page)
        finally:
            browser.close()
