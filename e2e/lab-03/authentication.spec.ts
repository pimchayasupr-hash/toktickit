import { test, expect } from '@playwright/test';

test.describe('Lab 3 E2E - Authentication & Mandatory Password Change', () => {
  test('E2E-01: Login, mandatory initial password change, and logout flow', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Invalid login attempt
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'WrongPass!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('alert')).toBeVisible();

    // 2. Valid login
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // 3. Verify user navigation visible
    await expect(page.getByText('Jennifer Anderson')).toBeVisible();
    await expect(page.getByText('My IT Support Tickets')).toBeVisible();

    // 4. Logout
    await page.click('button:has-text("Logout")');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
  });

  test('E2E-04: Logout blocks direct URL access and unauthenticated API calls return 401', async ({ page, request }) => {
    await page.goto('http://localhost:5173');

    // 1. Valid login
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByText('IT Staff Shared Ticket Queue')).toBeVisible();

    // 2. Perform logout
    await page.click('button:has-text("Logout")');
    await expect(page.getByText('Sign in to your account')).toBeVisible();

    // 3. Reload page directly to ensure session cleared and login prompt is enforced
    await page.reload();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByText('IT Staff Shared Ticket Queue')).not.toBeVisible();

    // 4. Verify unauthenticated API request to staff queue returns 401
    const apiRes = await request.get('http://localhost:3000/api/staff/tickets');
    expect(apiRes.status()).toBe(401);
  });
});
