const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_BASE = path.join(__dirname, '../artifacts/lab-04/screenshots');
const DOCS_BASE = path.join(__dirname, '../docs/lab-04/screenshots');

fs.mkdirSync(ARTIFACTS_BASE, { recursive: true });
fs.mkdirSync(DOCS_BASE, { recursive: true });

async function saveScreenshot(page, filename) {
  const buf = await page.screenshot({ fullPage: false });
  fs.writeFileSync(path.join(ARTIFACTS_BASE, filename), buf);
  fs.writeFileSync(path.join(DOCS_BASE, filename), buf);
  console.log(`✅ Saved: ${filename}`);
}

async function loginAs(page, email, password) {
  const res = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { email, password }
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error(`Failed to login as ${email}: ${JSON.stringify(data)}`);
  }
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.evaluate((tok) => {
    localStorage.clear();
    localStorage.setItem('toktickit_token', tok);
  }, data.token);
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
}

async function run() {
  console.log('🚀 Starting Lab 4 real screenshot capture with Playwright...');
  const browser = await chromium.launch({ headless: true });

  // 1. REQUESTER DASHBOARD (Desktop, Tablet, Mobile)
  console.log('1. Capturing Requester Dashboard...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'jennifer.anderson@example.com', 'Password123!');
    const dashBtn = page.locator('button:has-text("Dashboard")');
    if (await dashBtn.isVisible()) {
      await dashBtn.click();
    }
    await page.waitForSelector('text=My Support Dashboard', { timeout: 10000 });
    await page.waitForTimeout(500);

    await saveScreenshot(page, '01-requester-dashboard-desktop.png');

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '02-requester-dashboard-tablet.png');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '03-requester-dashboard-mobile.png');

    await page.close();
  }

  // 2. STAFF DASHBOARD (Desktop, Tablet, Mobile)
  console.log('2. Capturing Staff Dashboard...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'michael.staff@toktickit.com', 'Password123!');
    const dashBtn = page.locator('button:has-text("Dashboard")');
    if (await dashBtn.isVisible()) {
      await dashBtn.click();
    }
    await page.waitForSelector('text=Staff Dashboard', { timeout: 10000 });
    await page.waitForTimeout(500);

    await saveScreenshot(page, '04-staff-dashboard-desktop.png');

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '05-staff-dashboard-tablet.png');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '06-staff-dashboard-mobile.png');

    await page.close();
  }

  // 3. STAFF TICKET DETAIL: Actions Taken Lifecycle, Assignee, Terminal Lock
  console.log('3. Capturing Staff Ticket Detail & Actions Taken Lifecycle...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'michael.staff@toktickit.com', 'Password123!');
    
    // Go to Ticket Queue
    const queueBtn = page.locator('button:has-text("Ticket Queue")');
    if (await queueBtn.isVisible()) {
      await queueBtn.click();
    }
    await page.waitForSelector('.tkt-table tr', { timeout: 10000 });
    
    // Open TKT-2026-001234
    const searchInput = page.locator('input[placeholder*="Search by ticket number"]');
    await searchInput.fill('TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);

    const ticketRow = page.locator('.tkt-table tr', { hasText: 'TKT-2026-001234' });
    await ticketRow.getByRole('button', { name: 'Open Detail' }).click();
    await page.waitForSelector('.tkt-btn-back', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Scroll to Actions Taken Section
    const actionsHeader = page.getByRole('heading', { name: /Actions Taken/i });
    await actionsHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    await saveScreenshot(page, '07-actions-taken-lifecycle-desktop.png');

    // Scroll to Status History Section
    const historyHeader = page.getByRole('heading', { name: /Ticket Status History/i });
    if (await historyHeader.isVisible()) {
      await historyHeader.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await saveScreenshot(page, '08-ticket-status-history.png');
    }

    await page.close();
  }

  // 4. RESOLUTION GATE REJECTION
  console.log('4. Capturing Resolution Gate Rejection Alert...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'michael.staff@toktickit.com', 'Password123!');

    const queueBtn = page.locator('button:has-text("Ticket Queue")');
    if (await queueBtn.isVisible()) {
      await queueBtn.click();
    }
    await page.waitForSelector('.tkt-table tr', { timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Search by ticket number"]');
    await searchInput.fill('TKT-2026-001233');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(300);

    const ticketRow = page.locator('.tkt-table tr', { hasText: 'TKT-2026-001233' });
    await ticketRow.getByRole('button', { name: 'Open Detail' }).click();
    await page.waitForSelector('.tkt-btn-back', { timeout: 10000 });
    await page.waitForTimeout(400);

    const statusSelect = page.locator('#ticketStatusSelect');
    await statusSelect.selectOption('RESOLVED');
    await page.waitForSelector('.tkt-alert-error', { timeout: 5000 });
    await page.waitForTimeout(300);

    await saveScreenshot(page, '09-resolution-gate-rejection.png');

    await page.close();
  }

  // 5. REQUESTER VIEW: Read-Only Actions Taken and Status History
  console.log('5. Capturing Requester Read-Only View of Actions Taken & Status History...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'jennifer.anderson@example.com', 'Password123!');

    const myTicketsBtn = page.locator('.tkt-nav-tab:has-text("My Tickets")');
    if (await myTicketsBtn.isVisible()) {
      await myTicketsBtn.click();
    }
    await page.waitForSelector('.tkt-ticket-link', { timeout: 10000 });

    // Open first ticket detail
    await page.locator('.tkt-ticket-link').first().click();
    await page.waitForSelector('.tkt-btn-back', { timeout: 10000 });
    await page.waitForTimeout(400);

    // Switch to Actions Taken tab
    const actionsTab = page.locator('button:has-text("Actions Taken")');
    if (await actionsTab.isVisible()) {
      await actionsTab.click();
      await page.waitForTimeout(300);
    }

    await saveScreenshot(page, '10-requester-actions-readonly.png');

    await page.close();
  }

  await browser.close();
  console.log('🎉 All Lab 4 real screenshots successfully captured!');
}

run().catch((err) => {
  console.error('❌ Screenshot capture failed:', err);
  process.exit(1);
});
