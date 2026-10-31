import { test, expect } from '@playwright/test';

test.describe('Lab 4 E2E - Actions Taken Lifecycle & Role Visibility', () => {
  test('E2E-ACT-01: IT Staff records action taken, edits it, and Requester views in read-only mode', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // 1. Login as IT Staff
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Wait for queue or navbar
    await expect(page.locator('.tkt-navbar')).toBeVisible();

    // Navigate to Queue if on dashboard
    const queueBtn = page.locator('button:has-text("Ticket Queue")');
    if (await queueBtn.isVisible()) {
      await queueBtn.click();
    }

    await expect(page.getByRole('heading', { name: 'IT Staff Shared Ticket Queue' })).toBeVisible();

    // Open deterministic ticket TKT-2026-001234
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001234"):visible').first().click();

    // Verify Actions Taken section exists
    await expect(page.getByText(/Actions Taken \(/i)).toBeVisible();

    // Click "+ Add Action"
    await page.click('button:has-text("+ Add Action")');

    // Fill form
    const timestamp = Date.now();
    const uniqueActionDesc = `Diagnostic fiber loopback test at ${timestamp}`;
    const uniqueResult = `Loopback returned 0% packet loss ${timestamp}`;
    const updatedResult = `Updated outcome: optical power -12dBm ${timestamp}`;

    await page.fill('#actionDescription', uniqueActionDesc);
    await page.fill('#actionResult', uniqueResult);

    // Toggle Follow-up Required
    await page.check('#followUpRequired');
    await expect(page.locator('#followUpNote')).toBeVisible();
    await page.fill('#followUpNote', 'Monitor error counters during peak hours.');

    // Save
    await page.click('button:has-text("Save Action")');

    // Verify action appears in list
    const actionCard = page.locator('.tkt-action-card', { hasText: uniqueActionDesc }).first();
    await expect(actionCard).toBeVisible();
    await expect(page.getByText(`Result: ${uniqueResult}`)).toBeVisible();
    await expect(actionCard.getByText('Follow-up Required')).toBeVisible();

    // Edit action specifically on this card
    await actionCard.locator('button:has-text("Edit")').click();
    await page.fill('#actionResult', updatedResult);
    await page.click('button:has-text("Update Action")');
    await expect(page.locator('button:has-text("Update Action")')).not.toBeVisible();

    // Verify edited text appears
    await expect(page.getByText(`Result: ${updatedResult}`)).toBeVisible();

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page.getByText('Sign in to your account')).toBeVisible();

    // 2. Login as Requester (Jennifer Anderson)
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('.tkt-navbar')).toBeVisible({ timeout: 15000 });

    // Navigate to My Tickets if not already on it
    const myTicketsBtn = page.locator('.tkt-nav-tab:has-text("My Tickets")');
    if (await myTicketsBtn.isVisible()) {
      await myTicketsBtn.click();
    }

    await expect(page.getByText('My IT Support Tickets')).toBeVisible({ timeout: 10000 });

    // Open deterministic ticket TKT-2026-001234
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001234"):visible').first().click();

    // Switch to Actions Taken tab
    const actionsTab = page.locator('.tkt-tab-nav-btn:has-text("Actions Taken")');
    await expect(actionsTab).toBeVisible();
    await actionsTab.click();

    // Verify Read-Only Mode: write buttons do not exist
    await expect(page.locator('button:has-text("+ Add Action")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
  });

  test('E2E-ACT-02: Action lifecycle transitions, operational assignee, and terminal immutability', async ({ page }) => {
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

    // Open deterministic ticket TKT-2026-001234
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001234"):visible').first().click();

    // Click "+ Add Action"
    await page.click('button:has-text("+ Add Action")');

    const timestamp = Date.now();
    const actionDesc = `E2E Lifecycle task at ${timestamp}`;

    await page.fill('#actionDescription', actionDesc);
    // Select Status PENDING
    await page.selectOption('#actionStatus', 'PENDING');
    // Select Assignee Sarah if available
    const assigneeSelect = page.locator('#actionAssignee');
    const sarahOption = assigneeSelect.locator('option', { hasText: 'Sarah' });
    if (await sarahOption.count() > 0) {
      await assigneeSelect.selectOption({ label: await sarahOption.first().innerText() });
    }

    await page.click('button:has-text("Save Action")');

    // Verify created card shows Pending badge
    const card = page.locator('.tkt-action-card', { hasText: actionDesc }).first();
    await expect(card).toBeVisible();
    await expect(card.locator('.tkt-action-status-badge', { hasText: 'Pending' })).toBeVisible();

    // Quick transition to IN_PROGRESS
    const startWorkBtn = card.locator('button:has-text("Start Work")');
    await expect(startWorkBtn).toBeVisible();
    await startWorkBtn.click();

    // Card now shows In Progress badge
    await expect(card.locator('.tkt-action-status-badge', { hasText: 'In Progress' })).toBeVisible();

    // Transition to COMPLETED (prompts for result in form)
    const completeBtn = card.locator('button:has-text("Complete")');
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    await expect(page.locator('#actionResult')).toBeVisible();
    await page.fill('#actionResult', `Remediation completed successfully at ${timestamp}`);
    await page.click('button:has-text("Update Action")');

    // Verify card shows Completed badge and terminal indicator
    await expect(card.locator('.tkt-action-status-badge', { hasText: 'Completed' })).toBeVisible();
    await expect(card.getByText(/Terminal.*Immutable/i)).toBeVisible();

    // Assert Edit and transition buttons are now hidden for terminal action
    await expect(card.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(card.locator('button:has-text("Start Work")')).not.toBeVisible();
    await expect(card.locator('button:has-text("Complete")')).not.toBeVisible();
  });
});
