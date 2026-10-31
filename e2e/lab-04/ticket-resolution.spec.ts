import { test, expect } from '@playwright/test';

test.describe('Lab 4 E2E - Resolution Gate & Ticket Workflow Enforcement', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('E2E-RES-01: Resolution Gate strictly blocks resolving ticket with zero actions (rejection path)', async ({ page }) => {
    // Deterministic ticket: TKT-2026-001233 is in OPEN status with owner assigned but ZERO actions taken
    const searchInput = page.locator('input[placeholder*="Search by ticket number"]');
    await searchInput.fill('TKT-2026-001233');
    await page.click('button:has-text("Search")');

    // Click on deterministic ticket
    const ticketRow = page.locator('.tkt-table tr', { hasText: 'TKT-2026-001233' });
    await expect(ticketRow).toBeVisible();
    await ticketRow.getByRole('button', { name: 'Open Detail' }).click();

    // Verify ticket detail screen loaded
    await expect(page.locator('.tkt-btn-back')).toBeVisible();
    await expect(page.locator('input[value="TKT-2026-001233"]')).toBeVisible();

    // Verify status select dropdown is present
    const statusSelect = page.locator('#ticketStatusSelect');
    await expect(statusSelect).toBeVisible();

    // Deterministic check: Assert that '→ Resolved' is permitted transition from OPEN
    const resolvedOption = statusSelect.locator('option[value="RESOLVED"]');
    await expect(resolvedOption).toHaveCount(1);

    // Attempt to transition to RESOLVED without any completed actions
    await statusSelect.selectOption('RESOLVED');

    // Resolution Gate must trigger and reject the transition
    const alertError = page.locator('.tkt-alert-error');
    await expect(alertError).toBeVisible();
    const errorText = await alertError.innerText();
    expect(errorText.toLowerCase()).toContain('resolution gate');
    expect(errorText.toLowerCase()).toContain('action taken must be recorded');

    // Verify status was NOT modified (synced back to OPEN)
    await expect(statusSelect).toHaveValue('OPEN');
  });

  test('E2E-RES-02: Resolution Gate permits transition when owner is assigned and action is completed (success path)', async ({ page }) => {
    // Deterministic ticket: TKT-2026-001234 is IN_PROGRESS, owned by staffMichael, and has completed actions
    const searchInput = page.locator('input[placeholder*="Search by ticket number"]');
    await searchInput.fill('TKT-2026-001234');
    await page.click('button:has-text("Search")');

    const ticketRow = page.locator('.tkt-table tr', { hasText: 'TKT-2026-001234' });
    await expect(ticketRow).toBeVisible();
    await ticketRow.getByRole('button', { name: 'Open Detail' }).click();

    // Verify ticket detail screen loaded
    await expect(page.locator('.tkt-btn-back')).toBeVisible();
    await expect(page.locator('input[value="TKT-2026-001234"]')).toBeVisible();

    // Assert that completed Action Taken is visible
    const actionsSection = page.locator('.tkt-action-card');
    await expect(actionsSection.first()).toBeVisible();
    await expect(actionsSection.filter({ hasText: 'Completed' }).first()).toBeVisible();

    // Locate status dropdown
    const statusSelect = page.locator('#ticketStatusSelect');
    await expect(statusSelect).toBeVisible();

    // Ensure ticket is in IN_PROGRESS state before testing resolution
    const currentVal = await statusSelect.inputValue();
    if (currentVal === 'RESOLVED') {
      await statusSelect.selectOption('REOPENED');
      await expect(page.locator('text=Ticket status updated to REOPENED')).toBeVisible();
      await statusSelect.selectOption('IN_PROGRESS');
      await expect(page.locator('text=Ticket status updated to IN_PROGRESS')).toBeVisible();
    }

    // Assert '→ Resolved' is present from IN_PROGRESS
    const resolvedOption = statusSelect.locator('option[value="RESOLVED"]');
    await expect(resolvedOption).toHaveCount(1);

    // Execute transition to RESOLVED
    await statusSelect.selectOption('RESOLVED');

    // Assert success feedback
    const successFeedback = page.locator('text=Ticket status updated to RESOLVED');
    await expect(successFeedback).toBeVisible();

    // Assert status updated to RESOLVED
    await expect(statusSelect).toHaveValue('RESOLVED');

    // Assert append-only Status History records this transition
    const historySection = page.locator('.tkt-detail-card', { hasText: 'Ticket Status History' });
    await expect(historySection).toBeVisible();
    await expect(historySection).toContainText('IN_PROGRESS');
    await expect(historySection).toContainText('RESOLVED');
    await expect(historySection).toContainText('Michael Henderson');
  });
});
