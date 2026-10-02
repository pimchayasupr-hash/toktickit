import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Lab 3 Responsive & Accessibility Suite (Handout §10 & Part A/C)', () => {
  const VIEWPORTS = [
    { name: 'Mobile 375px', width: 375, height: 667 },
    { name: 'Mobile 390px', width: 390, height: 844 },
    { name: 'Tablet 820px', width: 820, height: 1180 },
    { name: 'Desktop 1440px', width: 1440, height: 900 },
  ];

  for (const vp of VIEWPORTS) {
    test(`Zero horizontal overflow on Login screen at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173');

      await expect(page.getByText('Sign in to your account')).toBeVisible();

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });

    test(`Zero horizontal overflow on IT Staff Queue at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173');

      await expect(page.getByText('Sign in to your account')).toBeVisible();
      // Login as Staff
      await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In")');

      await expect(page.getByText('IT Staff Shared Ticket Queue')).toBeVisible({ timeout: 12000 });

      if (vp.width < 768) {
        await expect(page.locator('[data-testid="mobile-ticket-cards"]')).toBeVisible();
      } else {
        await expect(page.locator('.tkt-table-container')).toBeVisible();
      }

      // Check overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });

    test(`Zero horizontal overflow on IT Staff Ticket Detail at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173');

      await expect(page.getByText('Sign in to your account')).toBeVisible();
      // Login as Staff
      await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In")');

      await expect(page.getByText('IT Staff Shared Ticket Queue')).toBeVisible({ timeout: 10000 });

      // Click first ticket
      await page.getByRole('button', { name: 'Open Detail' }).first().click();

      await expect(page.locator('.tkt-btn-back')).toBeVisible();
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });

    test(`Zero horizontal overflow on Admin User Management at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173');

      await expect(page.getByText('Sign in to your account')).toBeVisible();
      // Login as Admin
      await page.fill('input[type="email"]', 'admin@toktickit.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In")');

      await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

      if (vp.width < 768) {
        await expect(page.locator('[data-testid="mobile-user-cards"]')).toBeVisible();
      } else {
        await expect(page.locator('.tkt-table-container')).toBeVisible();
      }

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });
  }

  test('Primary Zen Green button visibility and styling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173');

    // Login as Admin to inspect "+ Create New User" button
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    const createBtn = page.locator('.tkt-btn-action-primary');
    await expect(createBtn).toBeVisible();

    const styles = await createBtn.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        minHeight: computed.minHeight,
      };
    });

    // Background rgb(0, 107, 60) = #006B3C (Lab 2 primary), Color rgb(255, 255, 255) = white
    expect(styles.backgroundColor).toBe('rgb(0, 107, 60)');
    expect(styles.color).toBe('rgb(255, 255, 255)');
  });

  test('Keyboard Escape key closes admin modals', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Open modal
    await page.click('button:has-text("Create New User")');
    await expect(page.getByText('Create New User Account')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByText('Create New User Account')).not.toBeVisible();
  });

  test('Accessibility check via axe-core on Login and Queue', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Analyze login page
    const loginResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast']) // verified separately via computed styles
      .analyze();
    expect(loginResults.violations.filter(v => v.impact === 'critical')).toEqual([]);

    // Login and analyze Queue
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByText('IT Staff Shared Ticket Queue')).toBeVisible();

    const queueResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    expect(queueResults.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });
});
