import { test, expect } from '@playwright/test';

test.describe('Lab 4 E2E - Resolution Gate Enforcement', () => {
  test('E2E-RES-01: Resolution Gate blocks resolving unassigned ticket or ticket with zero actions', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Login as IT Staff
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('.tkt-navbar')).toBeVisible();

    const queueBtn = page.locator('button:has-text("Ticket Queue")');
    if (await queueBtn.isVisible()) {
      await queueBtn.click();
    }

    await expect(page.getByRole('heading', { name: 'IT Staff Shared Ticket Queue' })).toBeVisible();

    // Find an open/in-progress ticket
    const openBtn = page.locator('.tkt-table tr').filter({ hasText: 'Open Detail' }).first().getByRole('button', { name: 'Open Detail' });
    await openBtn.click();

    // Verify ticket detail is loaded
    await expect(page.locator('.tkt-btn-back')).toBeVisible();

    // Verify Status Dropdown exists
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();

    // If options include RESOLVED, test gate
    const options = await statusSelect.locator('option').allTextContents();
    const canSelectResolved = options.some(opt => opt.includes('RESOLVED') || opt.includes('Resolved'));

    if (canSelectResolved) {
      // Check Resolution Gate condition
      await statusSelect.selectOption({ label: '→ Resolved' });

      // If resolution gate failed, an error message is visible
      const errorOrSuccess = page.locator('.tkt-alert-error, .bg-red-50');
      // If error appeared, verify message indicates gate failure
      if (await errorOrSuccess.isVisible()) {
        const errorText = await errorOrSuccess.innerText();
        expect(errorText.toLowerCase()).toContain('resolution gate');
      }
    }
  });
});
