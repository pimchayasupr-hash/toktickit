import { test, expect } from '@playwright/test';

test.describe('Lab 2: Requester Ticket Flow E2E Tests', () => {
  test('Complete End-to-End Flow: Select Requester, Create Ticket, and View in My Tickets', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('http://localhost:5173');

    // 2. Select Development Requester identity
    const requesterSelect = page.locator('select#dev-requester-select');
    if (await requesterSelect.isVisible()) {
      await requesterSelect.selectOption({ index: 1 });
      await page.click('button:has-text("Continue to Application")');
    }

    // 3. Confirm active context loaded
    await expect(page.locator('text=My Support Tickets')).toBeVisible();

    // 4. Click Create Ticket
    await page.click('button:has-text("+ Create Ticket")');
    await expect(page.locator('text=Create New IT Support Ticket')).toBeVisible();

    // 5. Fill and Submit Ticket Form
    await page.selectOption('select#ticket-category', { index: 1 });
    await page.selectOption('select#ticket-system', { index: 1 });
    await page.fill('input#ticket-summary', 'E2E Automated Ticket Submission Test');
    await page.fill('textarea#ticket-description', 'Detailed description for automated E2E test verification flow.');
    await page.click('button:has-text("Submit Support Ticket")');

    // 6. Verify Ticket Creation in My Tickets
    await expect(page.locator('text=My Support Tickets')).toBeVisible();
    await expect(page.locator('text=E2E Automated Ticket Submission Test')).toBeVisible();
  });
});
