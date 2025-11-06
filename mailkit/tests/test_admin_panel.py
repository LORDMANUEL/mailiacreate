from playwright.sync_api import sync_playwright, expect

def test_admin_panel(page):
    """
    Tests the core functionality of the Admin Panel:
    1. Navigates to the admin panel.
    2. Clicks 'Create User'.
    3. Fills out and submits the new user form.
    4. Verifies the new user appears in the user list.
    5. Takes a screenshot.
    """
    # Navigate to the Admin Panel
    page.goto("http://admin.tudominio.com")

    # Wait for the initial user list to load
    expect(page.get_by_text("alice@tudominio.com")).to_be_visible(timeout=10000)

    # Click the 'Create User' button
    page.get_by_role("button", name="Create User").click()

    # Fill in the new user form
    new_user_email = "test.user@tudominio.com"
    page.get_by_label("Email Address").fill(new_user_email)
    page.get_by_label("Quota (MB)").fill("2048")

    # Submit the form
    page.get_by_role("button", name="Save User").click()

    # Wait for the user list to refresh and check for the new user
    expect(page.get_by_text(new_user_email)).to_be_visible()

    # Take a screenshot for verification
    page.screenshot(path="mailkit/tests/admin_panel_test.png")
    print("Admin Panel test passed. Screenshot saved to mailkit/tests/admin_panel_test.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_admin_panel(page)
        finally:
            browser.close()
