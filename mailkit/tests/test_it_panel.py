from playwright.sync_api import sync_playwright, expect

def test_it_panel(page):
    """
    Tests the core functionality of the IT Panel:
    1. Navigates to the IT panel.
    2. Waits for the health metrics to load.
    3. Verifies that the 'System Status' card shows 'OK'.
    4. Takes a screenshot.
    """
    # Navigate to the IT Panel
    page.goto("http://it.tudominio.com")

    # Wait for the health metrics to load by checking for a specific card's title
    expect(page.get_by_text("System Status")).to_be_visible(timeout=10000)

    # Verify the status is 'OK'
    status_card = page.locator("div:has-text('System Status')").first
    expect(status_card.get_by_text("OK")).to_be_visible()

    # Take a screenshot for verification
    page.screenshot(path="mailkit/tests/it_panel_test.png")
    print("IT Panel test passed. Screenshot saved to mailkit/tests/it_panel_test.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_it_panel(page)
        finally:
            browser.close()
