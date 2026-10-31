import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Lab 4 E2E - Dashboards & Responsive Viewports', () => {
  const VIEWPORTS = [
    { name: 'Mobile 360px', width: 360, height: 740 },
    { name: 'Tablet 768px', width: 768, height: 1024 },
    { name: 'Desktop 1280px', width: 1280, height: 800 },
  ];

  for (const vp of VIEWPORTS) {
    test(`Zero horizontal overflow on Staff Dashboard at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173');

      // Login as Staff
      await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In")');

      await expect(page.locator('.tkt-navbar')).toBeVisible({ timeout: 15000 });

      // Click Dashboard tab
      await page.locator('.tkt-nav-tab:has-text("Dashboard")').click();

      await expect(page.getByRole('heading', { name: /Staff Dashboard/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Unassigned')).toBeVisible();

      // Check overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });

    test(`Zero horizontal overflow on Requester Dashboard at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173');

      // Login as Requester
      await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In")');

      await expect(page.locator('.tkt-navbar')).toBeVisible({ timeout: 15000 });

      // Click Dashboard tab
      await page.locator('.tkt-nav-tab:has-text("Dashboard")').click();

      await expect(page.getByRole('heading', { name: /My Support Dashboard/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Open Tickets')).toBeVisible();

      // Check overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    });
  }

  test('Accessibility check via axe-core on Staff and Requester Dashboards', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');

    // 1. Check Requester Dashboard
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('.tkt-navbar')).toBeVisible({ timeout: 15000 });
    await page.locator('.tkt-nav-tab:has-text("Dashboard")').click();
    await expect(page.getByRole('heading', { name: /My Support Dashboard/i })).toBeVisible({ timeout: 10000 });

    const requesterResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    expect(requesterResults.violations.filter(v => v.impact === 'critical')).toEqual([]);

    // 2. Check Staff Dashboard
    await page.click('button:has-text("Logout")');
    await expect(page.getByText('Sign in to your account')).toBeVisible({ timeout: 10000 });

    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('.tkt-navbar')).toBeVisible({ timeout: 15000 });
    await page.locator('.tkt-nav-tab:has-text("Dashboard")').click();
    await expect(page.getByRole('heading', { name: /Staff Dashboard/i })).toBeVisible({ timeout: 10000 });

    const staffResults = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();
    expect(staffResults.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('SVG icon dimension boundary: no inline SVG exceeds 64px width or height across views', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');

    // Check Login View
    const loginSvgs = await page.$$eval('svg', svgs => svgs.map(s => {
      const rect = s.getBoundingClientRect();
      return { w: rect.width, h: rect.height };
    }));
    for (const s of loginSvgs) {
      expect(s.w).toBeLessThanOrEqual(64);
      expect(s.h).toBeLessThanOrEqual(64);
    }

    // Login as Staff
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('.tkt-navbar')).toBeVisible({ timeout: 15000 });

    // Staff Dashboard SVGs
    await page.locator('.tkt-nav-tab:has-text("Dashboard")').click();
    await expect(page.getByRole('heading', { name: /Staff Dashboard/i })).toBeVisible({ timeout: 10000 });
    const dashSvgs = await page.$$eval('svg', svgs => svgs.map(s => {
      const rect = s.getBoundingClientRect();
      return { w: rect.width, h: rect.height };
    }));
    for (const s of dashSvgs) {
      expect(s.w).toBeLessThanOrEqual(64);
      expect(s.h).toBeLessThanOrEqual(64);
    }

    // Staff Ticket Detail SVGs & Actions Taken
    await page.locator('.tkt-nav-tab:has-text("Ticket Queue")').click();
    await page.waitForTimeout(500);
    const viewBtn = page.locator('button:has-text("View")').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(500);
      const detailSvgs = await page.$$eval('svg', svgs => svgs.map(s => {
        const rect = s.getBoundingClientRect();
        return { w: rect.width, h: rect.height };
      }));
      for (const s of detailSvgs) {
        expect(s.w).toBeLessThanOrEqual(64);
        expect(s.h).toBeLessThanOrEqual(64);
      }
    }
  });
});
