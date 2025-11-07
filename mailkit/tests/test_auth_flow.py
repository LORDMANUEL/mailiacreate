from playwright.sync_api import sync_playwright, expect

def test_auth_redirect(page):
    """
    Tests the authentication flow:
    1. Navigates to the protected admin panel.
    2. Verifies that the browser is redirected to the Keycloak login page.
    3. Takes a screenshot of the Keycloak login page.
    """
    # Navigate to the protected Admin Panel
    page.goto("http://admin.tudominio.com")

    # Wait for the redirection to the Keycloak login page.
    # We can verify this by checking for an element unique to the Keycloak page.
    # The title of the page is a good indicator.
    expect(page).to_have_title("Log in to mailkit", timeout=15000)

    # We can also check for the presence of the username field.
    expect(page.get_by_label("Username or email")).to_be_visible()

    print("Successfully redirected to Keycloak login page.")

    # Take a screenshot for verification
    page.screenshot(path="mailkit/tests/auth_redirect_test.png")
    print("Authentication redirect test passed. Screenshot saved to mailkit/tests/auth_redirect_test.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_auth_redirect(page)
        finally:
            browser.close()
