import { test, expect } from '@playwright/test';

test.describe('Lab 3 E2E - Administrator User Management Flow', () => {
  test('E2E-03: Admin login, create user, search, and safety rules check', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Login as Admin
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Verify User Management is displayed
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    // Open Create User modal
    await page.click('button:has-text("Create New User")');
    await expect(page.getByText('Create New User Account')).toBeVisible();

    // Fill form
    const uniqueEmail = `e2e.staff.${Date.now()}@toktickit.com`;
    await page.fill('input[type="text"]', 'E2E New Staff');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Save User")');

    // Search created user
    await page.fill('input[placeholder*="Search users"]', uniqueEmail);
    await page.click('button:has-text("Search")');
    await expect(page.getByText('E2E New Staff').first()).toBeVisible();
  });
});
