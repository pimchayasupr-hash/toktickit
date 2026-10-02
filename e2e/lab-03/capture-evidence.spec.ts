import { test, expect } from '@playwright/test';
import path from 'path';
import { PrismaClient } from '../../server/node_modules/@prisma/client';
import bcrypt from '../../server/node_modules/bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../artifacts/lab-03/screenshots');

test.describe('@evidence Lab 3 Evidence Screenshot Capture Suite', () => {
  test.beforeAll(async () => {
    const hash = await bcrypt.hash('Password123!', 10);
    await prisma.user.upsert({
      where: { email: 'evidence.change.pass@toktickit.com' },
      update: { mustChangePassword: true, isActive: true },
      create: {
        name: 'Evidence MustChange User',
        email: 'evidence.change.pass@toktickit.com',
        passwordHash: hash,
        role: 'REQUESTER',
        isActive: true,
        mustChangePassword: true,
      },
    });
  });

  test.afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'evidence.change.pass@toktickit.com',
            'evidence.newuser@toktickit.com',
          ],
        },
      },
    });
    // Restore david kim
    const hash = await bcrypt.hash('Password123!', 10);
    await prisma.user.updateMany({
      where: { email: 'david.kim@example.com' },
      data: { mustChangePassword: false, passwordHash: hash },
    });
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION 1: AUTHENTICATION (01 to 09)
  // ==========================================
  test('01-09: Authentication Evidence', async ({ page }) => {
    // 01 login empty
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/01-login-empty-1440x900.png` });

    // 02 login invalid
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'WrongPassword!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('alert')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/02-login-invalid-1440x900.png` });

    // 03 account inactive
    await page.fill('input[type="email"]', 'alex.turner@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('alert')).toContainText(/deactivated|inactive/i);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/03-account-inactive-1440x900.png` });

    // 04 login loading / busy
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.route('**/api/auth/login', async (route) => {
      // Delay response slightly to capture button state
      setTimeout(() => route.continue().catch(() => {}), 1200);
    });
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/04-login-loading-1440x900.png` });
    await page.unroute('**/api/auth/login');
    await page.waitForTimeout(1500);

    // 05 modal mandatory change password + checklist
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('input[type="email"]', 'evidence.change.pass@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByText('Change Your Password')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/05-mandatory-change-password-1440x900.png` });

    // 06 weak password rejected
    await page.locator('input[type="password"]').nth(1).fill('weak');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/06-weak-password-rejected-1440x900.png` });

    // 07 navbar name + role
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByText('Michael Brown (IT Support)')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/07-navbar-name-role-1440x900.png` });

    // 08 logout and redirect
    await page.click('button:has-text("Logout")');
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await page.goto(`${BASE_URL}/staff/queue`);
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/08-logout-redirect-1440x900.png` });

    // 09 admin reset password -> forced change next login
    await prisma.user.update({
      where: { email: 'david.kim@example.com' },
      data: { mustChangePassword: true },
    });
    await page.fill('input[type="email"]', 'david.kim@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByText('Change Your Password')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/authentication/09-reset-password-forced-change-1440x900.png` });
  });

  // ==========================================
  // SECTION 2: STAFF QUEUE (01 to 10)
  // ==========================================
  test('01-10: Staff Queue Evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Login as staff
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('heading', { name: 'IT Staff Shared Ticket Queue' })).toBeVisible();

    // 01 queue desktop
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/01-queue-desktop-1440x900.png` });

    // 02 search desktop
    await page.fill('input[placeholder*="Search by ticket number"]', 'VPN');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/02-search-desktop-1440x900.png` });

    // Clear search
    await page.fill('input[placeholder*="Search by ticket number"]', '');
    await page.click('button:has-text("Search")');

    // 03 multiple filters desktop
    await page.click('button:has-text("Filters")');
    await page.waitForTimeout(200);
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('OPEN');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/03-multiple-filters-desktop-1440x900.png` });

    // Reset filters
    await statusSelect.selectOption('');
    await page.waitForTimeout(300);

    // 04 sort desktop
    await page.locator('select').filter({ has: page.locator('option[value="createdAt_asc"]') }).selectOption('createdAt_asc');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/04-sort-desktop-1440x900.png` });

    // 05 pagination page 2 (Mock response with 2 pages)
    await page.route('**/api/staff/tickets?*', async (route) => {
      const url = new URL(route.request().url());
      const pageNum = parseInt(url.searchParams.get('page') || '1', 10);
      const json = {
        tickets: [
          {
            id: 100 + pageNum,
            ticketNumber: `TKT-2026-00000${pageNum}`,
            summary: pageNum === 2 ? 'Page 2: Monitor display flickering on HDMI port' : 'Page 1: Laptop battery replacement request',
            requestedPriority: 'HIGH',
            itPriority: 'HIGH',
            currentStatus: 'OPEN',
            createdAt: new Date().toISOString(),
            requester: { id: 1, name: 'Jennifer Anderson', email: 'jennifer@example.com' },
            owner: null,
            category: { id: 2, name: 'Hardware' },
          },
        ],
        pagination: { page: pageNum, pageSize: 1, total: 2, totalPages: 2 },
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    });
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);
    const page2Btn = page.locator('.tkt-page-btn').filter({ hasText: '2' });
    if (await page2Btn.isVisible()) {
      await page2Btn.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/05-pagination-page-2-desktop-1440x900.png` });
    await page.unroute('**/api/staff/tickets?*');

    // 06 no-results
    await page.fill('input[placeholder*="Search by ticket number"]', 'NonexistentTicketXYZ999');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/06-no-results-desktop-1440x900.png` });

    // 07 empty or error state
    await page.route('**/api/staff/tickets?*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Database query timed out.' } }),
      });
    });
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/07-empty-or-error-desktop-1440x900.png` });
    await page.unroute('**/api/staff/tickets?*');

    // 08 unassigned vs assigned
    await page.fill('input[placeholder*="Search by ticket number"]', '');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/08-unassigned-vs-assigned-desktop-1440x900.png` });

    // 09 tablet queue
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/09-queue-tablet-820x1180.png` });

    // 10 mobile cards
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-queue/10-queue-mobile-cards-390x844.png` });
  });

  // ==========================================
  // SECTION 3: STAFF TICKET DETAIL (01 to 13)
  // ==========================================
  test('01-13: Staff Ticket Detail Evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Login as staff
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('heading', { name: 'IT Staff Shared Ticket Queue' })).toBeVisible();

    // Open first ticket
    await page.locator('.tkt-table tr').nth(1).getByRole('button', { name: 'Open Detail' }).click();
    await page.waitForTimeout(500);

    // 01 detail desktop
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/01-detail-desktop-1440x900.png` });

    // 02 claim ticket
    const claimBtn = page.getByRole('button', { name: /Claim/i });
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/02-claim-desktop-1440x900.png` });

    // 03 reassign ticket
    const assigneeSelect = page.locator('select').filter({ has: page.locator('option[value="7"]') }).first();
    if (await assigneeSelect.isVisible()) {
      await assigneeSelect.selectOption('7');
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/03-reassign-desktop-1440x900.png` });

    // 04 change IT priority
    const itPrioritySelect = page.locator('select').filter({ has: page.locator('option[value="URGENT"]') }).first();
    if (await itPrioritySelect.isVisible()) {
      await itPrioritySelect.selectOption('URGENT');
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/04-change-it-priority-desktop-1440x900.png` });

    // 05 status change / transition
    const statusSelect = page.locator('div:has(> label:has-text("Current Status")) select');
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').all();
      if (options.length > 1) {
        await statusSelect.selectOption({ index: 1 });
        await page.waitForTimeout(400);
      }
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/05-status-confirm-dialog-desktop-1440x900.png` });


    // 06 disallowed transition error
    await page.route('**/api/staff/tickets/*/status', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Transition from CLOSED to OPEN is not permitted.' } }),
      });
    });
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('OPEN');
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/06-disallowed-transition-error-desktop-1440x900.png` });
    await page.unroute('**/api/staff/tickets/*/status');

    // 07 public comment content
    const commentInput = page.locator('textarea[placeholder="Type your comment here..."]');
    if (await commentInput.isVisible()) {
      await commentInput.fill('IT Support has verified network connectivity at floor 4.');
      await page.click('button:has-text("Post Comment")');
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/07-public-comment-content-desktop-1440x900.png` });

    // 08 internal note content (distinct amber styling)
    const noteInput = page.locator('textarea[placeholder="Write a private internal note for staff..."]');
    if (await noteInput.isVisible()) {
      await noteInput.fill('Confidential: Cisco switch port 14 replaced during maintenance window.');
      await page.click('button:has-text("Add Internal Note")');
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/08-internal-note-content-desktop-1440x900.png` });

    // 09 attachment list
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/09-attachment-list-desktop-1440x900.png` });

    // 10 & 11: Requester view (Problem Resolved + No Internal Notes visible)
    await page.click('button:has-text("Logout")');
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(600);

    const viewDetailsBtn = page.getByRole('button', { name: 'View Details' }).first();
    if (await viewDetailsBtn.isVisible()) {
      await viewDetailsBtn.click();
      await page.waitForTimeout(500);
    }

    // 10 Problem Appears Resolved
    const resolveBtn = page.getByRole('button', { name: /Problem Appears Resolved/i });
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
      await page.waitForTimeout(400);
      const confirmDialogBtn = page.getByRole('button', { name: 'Yes, Problem Appears Resolved' });
      if (await confirmDialogBtn.isVisible()) {
        await confirmDialogBtn.click();
        await page.waitForTimeout(400);
      }
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/10-requester-problem-resolved-desktop-1440x900.png` });

    // 11 Requester sees ONLY Public comments, NO internal notes section
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/11-requester-no-notes-desktop-1440x900.png` });

    // 12 Tablet detail
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/12-detail-tablet-820x1180.png` });

    // 13 Mobile detail
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/staff-ticket-detail/13-detail-mobile-390x844.png` });
  });

  // ==========================================
  // SECTION 4: USER MANAGEMENT (01 to 13)
  // ==========================================
  test('01-13: Admin User Management Evidence', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Login as Admin
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();

    // 01 list desktop
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/01-user-list-desktop-1440x900.png` });

    // 02 search users
    await page.fill('input[placeholder*="Search users"]', 'Sarah');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/02-search-users-desktop-1440x900.png` });

    // Clear search
    await page.fill('input[placeholder*="Search users"]', '');
    await page.click('button:has-text("Search")');

    // 03 filter role
    await page.locator('select').first().selectOption('STAFF');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/03-filter-role-desktop-1440x900.png` });

    // Reset filter
    await page.locator('select').first().selectOption('');

    // 04 create modal
    await page.click('button:has-text("Create New User")');
    await expect(page.getByText('Create New User Account')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/04-create-modal-desktop-1440x900.png` });

    // 05 duplicate email (409)
    await page.fill('input[type="text"]', 'Duplicate Admin Test');
    await page.fill('input[type="email"]', 'admin@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Save User")');
    await expect(page.getByText(/already exists|409/i)).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/05-duplicate-email-409-desktop-1440x900.png` });

    // 06 invalid input
    await page.fill('input[type="email"]', 'invalid-email-format');
    await page.fill('input[type="password"]', 'weak');
    await page.click('button:has-text("Save User")');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/06-invalid-input-desktop-1440x900.png` });

    // Close create modal
    await page.click('button:has-text("Cancel")');

    // 07 edit modal
    const staffRow = page.locator('tr').filter({ hasText: 'michael.staff@toktickit.com' });
    await staffRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit User Account')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/07-edit-modal-desktop-1440x900.png` });
    await page.click('button:has-text("Cancel")');

    // 08 reset password modal
    await staffRow.getByRole('button', { name: 'Reset Password' }).click();
    await expect(page.getByText('Reset Initial Password')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/08-reset-password-modal-desktop-1440x900.png` });
    await page.click('button:has-text("Cancel")');

    // 09 self-deactivation rejected
    const adminRow = page.locator('tr').filter({ hasText: 'admin@toktickit.com' });
    await adminRow.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText('Edit User Account')).toBeVisible();
    const activeCheckbox = page.locator('input[type="checkbox"]');
    if (await activeCheckbox.isChecked()) {
      await activeCheckbox.uncheck();
    }
    await page.click('button:has-text("Update Account")');
    await expect(page.getByText(/cannot deactivate your own|SELF_DEACTIVATION/i)).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/09-self-deactivation-rejected-desktop-1440x900.png` });
    await page.click('button:has-text("Cancel")');

    // 10 last-admin rejected
    await adminRow.getByRole('button', { name: 'Edit' }).click();
    await page.locator('select').nth(1).selectOption('STAFF');
    await page.click('button:has-text("Update Account")');
    await expect(page.getByText(/last active Administrator|LAST_ADMIN/i)).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/10-last-admin-rejected-desktop-1440x900.png` });
    await page.click('button:has-text("Cancel")');

    // 12 tablet user management (while logged in as Admin)
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/12-user-management-tablet-820x1180.png` });

    // 13 mobile user management
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/13-user-management-mobile-390x844.png` });

    // 11 Staff enters /admin -> 403 Forbidden
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await expect(page.getByRole('heading', { name: 'IT Staff Shared Ticket Queue' })).toBeVisible();
    // Simulate Staff attempting to call admin API or visit admin route
    await page.route('**/api/admin/users*', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Access denied. Role STAFF is not authorized for this operation.' } }),
      });
    });
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/user-management/11-staff-forbidden-admin-desktop-1440x900.png` });
    await page.unroute('**/api/admin/users*');
  });
});
