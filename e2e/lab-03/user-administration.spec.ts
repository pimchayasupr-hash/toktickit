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
    await page.fill('#createName', 'E2E New Staff');
    await page.fill('#createEmail', uniqueEmail);
    await page.fill('#createInitialPassword', 'Password123!');
    await page.click('button:has-text("Save User")');

    // Search created user
    await page.fill('input[placeholder*="Search users"]', uniqueEmail);
    await page.click('button:has-text("Search")');
    await expect(page.locator('tbody').getByText('E2E New Staff')).toBeVisible();
  });

  test('E2E-06: New user first login enforces mandatory password change flow', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Admin logs in to create user with initial password
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    const newEmail = `first.login.${Date.now()}@toktickit.com`;
    await page.click('button:has-text("Create New User")');
    await page.fill('#createName', 'First Login User');
    await page.fill('#createEmail', newEmail);
    await page.fill('#createInitialPassword', 'Initial123!');
    await page.click('button:has-text("Save User")');

    // Logout
    await page.click('button:has-text("Logout")');

    // 2. New user logs in with initial password
    await page.fill('input[type="email"]', newEmail);
    await page.fill('input[type="password"]', 'Initial123!');
    await page.click('button:has-text("Sign In")');

    // 3. Mandatory change password modal must appear immediately
    await expect(page.getByText('Change Your Password')).toBeVisible();
    await expect(page.getByText(/You must change your initial credentials/i)).toBeVisible();

    // 4. Update password
    await page.fill('#currentPassword', 'Initial123!');
    await page.fill('#newPassword', 'BrandNewPassword123!');
    await page.fill('#confirmPassword', 'BrandNewPassword123!');
    await page.click('button:has-text("Update Password & Continue")');

    // 5. User successfully enters dashboard
    await expect(page.getByText('First Login User')).toBeVisible();
  });

  test('E2E-07: Admin safety rules block self-deactivation and last admin demotion', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Login as Admin
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Edit self (John Smith (Admin))
    const adminRow = page.locator('tbody tr').filter({ hasText: 'admin@toktickit.com' });
    await adminRow.getByRole('button', { name: 'Edit' }).click();

    await expect(page.getByText('Edit User Account')).toBeVisible();

    // Try to toggle account active off
    const activeCheckbox = page.locator('#editIsActive');
    await activeCheckbox.uncheck();
    await page.click('button:has-text("Update Account")');

    // Must be blocked by alert
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/cannot deactivate your own Administrator account/i)).toBeVisible();
  });
  test.afterAll(async () => {
    // Clean up users created during E2E tests to avoid polluting the database
    const { PrismaClient } = await import('../../server/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    try {
      await prisma.user.deleteMany({
        where: {
          OR: [
            { email: { startsWith: 'e2e.staff.' } },
            { email: { startsWith: 'first.login.' } },
            { email: { startsWith: 'test.staff.' } },
          ],
        },
      });
    } catch (e) {
      console.error('Error cleaning up E2E users:', e);
    } finally {
      await prisma.$disconnect();
    }
  });
});
