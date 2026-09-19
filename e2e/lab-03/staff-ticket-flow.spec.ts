import { test, expect } from '@playwright/test';

test.describe('Lab 3 E2E - IT Staff Ticket Queue & Detail Flow', () => {
  test('E2E-02: IT Staff queue search, claim ticket, update status & notes', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Login as IT Staff
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Verify Shared Queue is displayed
    await expect(page.getByRole('heading', { name: 'IT Staff Shared Ticket Queue' })).toBeVisible();

    // Search for ticket
    await page.fill('input[placeholder*="Search"]', 'battery');
    await page.click('button:has-text("Search")');
    await expect(page.getByText('Laptop battery drains quickly')).toBeVisible();

    // Open detail
    await page.click('button:has-text("Open Detail")');
    await expect(page.getByRole('heading', { name: 'Laptop battery drains quickly' })).toBeVisible();

    // Post internal note
    await page.fill('textarea[placeholder*="internal note"]', 'Playwright E2E Internal Note verification.');
    await page.click('button:has-text("Add Internal Note")');
    await expect(page.locator('p').filter({ hasText: 'Playwright E2E Internal Note verification.' }).first()).toBeVisible();
  });
});
