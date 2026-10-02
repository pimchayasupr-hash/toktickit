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
    const { PrismaClient } = require('../../server/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { startsWith: 'e2e.staff.' } },
            { email: { startsWith: 'first.login.' } },
            { email: { startsWith: 'test.staff.' } },
          ],
        },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        // 1. For tickets OWNED by a test user: set ownerId = null (do not delete)
        await prisma.ticket.updateMany({
          where: { ownerId: { in: userIds } },
          data: { ownerId: null },
        });

        // 2. Delete only tickets whose requesterId is a test user (never seeded tickets)
        const ticketsToDelete = await prisma.ticket.findMany({
          where: {
            requesterId: { in: userIds },
            ticketNumber: {
              notIn: [
                'TKT-2026-001234', 'TKT-2026-001233', 'TKT-2026-001232', 'TKT-2026-001231',
                'TKT-2026-001230', 'TKT-2026-001229', 'TKT-2026-001228', 'TKT-2026-001227',
                'TKT-2026-001226', 'TKT-2026-001225', 'TKT-2026-001224', 'TKT-2026-001223',
                'TKT-2026-001222', 'TKT-2026-001221', 'TKT-2026-001220', 'TKT-2026-001219',
                'TKT-2026-001218', 'TKT-2026-001217',
              ],
            },
          },
          select: { id: true },
        });
        const ticketIdsToDelete = ticketsToDelete.map((t) => t.id);
        if (ticketIdsToDelete.length > 0) {
          await prisma.attachment.deleteMany({
            where: { ticketId: { in: ticketIdsToDelete } },
          });
          await prisma.publicComment.deleteMany({
            where: { ticketId: { in: ticketIdsToDelete } },
          });
          await prisma.internalNote.deleteMany({
            where: { ticketId: { in: ticketIdsToDelete } },
          });
          await prisma.ticket.deleteMany({
            where: { id: { in: ticketIdsToDelete } },
          });
        }

        // 3. Delete comments/notes authored by test users on other tickets
        await prisma.internalNote.deleteMany({
          where: { authorId: { in: userIds } },
        });
        await prisma.publicComment.deleteMany({
          where: { authorId: { in: userIds } },
        });

        // 4. Finally delete the test users
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });
});
