const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'artifacts/lab-04/screenshots');

async function capture() {
  console.log('Starting screenshot capture on pristine seeded database...');
  const browser = await chromium.launch({ headless: true });

  // Ensure directories exist
  fs.mkdirSync(path.join(SCREENSHOT_DIR, 'staff-dashboard'), { recursive: true });
  fs.mkdirSync(path.join(SCREENSHOT_DIR, 'requester-dashboard'), { recursive: true });
  fs.mkdirSync(path.join(SCREENSHOT_DIR, 'actions-taken'), { recursive: true });

  // 1. Staff Dashboard Desktop (1440x900)
  {
    console.log('Capturing Staff Dashboard Desktop...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Staff Dashboard")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'staff-dashboard/staff-dashboard_overview_desktop.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 2. Staff Dashboard Tablet (820x1180)
  {
    console.log('Capturing Staff Dashboard Tablet (820px)...');
    const context = await browser.newContext({ viewport: { width: 820, height: 1180 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Staff Dashboard")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'staff-dashboard/staff-dashboard_overview_tablet.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 3. Staff Dashboard Mobile (375x812)
  {
    console.log('Capturing Staff Dashboard Mobile (375px with adapted navbar)...');
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("Staff Dashboard")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'staff-dashboard/staff-dashboard_overview_mobile.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 4. Staff Dashboard State: Loading Skeleton
  {
    console.log('Capturing Staff Dashboard Loading state...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    // Intercept **/api/dashboard/staff to delay response
    await page.route('**/api/dashboard/staff', async route => {
      await new Promise(r => setTimeout(r, 10000));
      await route.continue();
    });
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('[aria-busy="true"]');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'staff-dashboard/staff-dashboard_state_loading.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 5. Staff Dashboard State: Error State (500 Server Error)
  {
    console.log('Capturing Staff Dashboard Error state...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.route('**/api/dashboard/staff', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error: Database aggregation query timed out' }),
      });
    });
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('button:has-text("Retry")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'staff-dashboard/staff-dashboard_state_error.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 6. Staff Dashboard State: Empty State
  {
    console.log('Capturing Staff Dashboard Empty state...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.route('**/api/dashboard/staff', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          metrics: {
            unassignedCount: 0,
            myAssignedCount: 0,
            openTotalCount: 0,
            urgentCount: 0,
            byStatus: { NEW: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 },
            byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
          },
          myRecentActions: [],
          urgentTickets: [],
          adminMetrics: null,
        }),
      });
    });
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('text=No recent actions recorded yet.');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'staff-dashboard/staff-dashboard_state_empty.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 7. Staff Dashboard State: Forbidden (403 when Requester attempts access)
  {
    console.log('Capturing Staff Dashboard Forbidden state...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.route('**/api/dashboard/staff', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'FORBIDDEN: Requesters are not permitted to access IT Staff operational telemetry.' }),
      });
    });
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('button:has-text("Retry")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'staff-dashboard/staff-dashboard_state_forbidden.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 8. Requester Dashboard Desktop (1440x900)
  {
    console.log('Capturing Requester Dashboard Desktop...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("My Support Dashboard")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'requester-dashboard/requester-dashboard_overview_desktop.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 9. Requester Dashboard Tablet (820x1180)
  {
    console.log('Capturing Requester Dashboard Tablet (820px)...');
    const context = await browser.newContext({ viewport: { width: 820, height: 1180 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("My Support Dashboard")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'requester-dashboard/requester-dashboard_overview_tablet.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 10. Requester Dashboard Mobile (375x812 with adapted navbar)
  {
    console.log('Capturing Requester Dashboard Mobile (375px with adapted navbar)...');
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Dashboard")');
    await page.waitForSelector('h1:has-text("My Support Dashboard")');
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'requester-dashboard/requester-dashboard_overview_mobile.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 11. Actions Taken Lifecycle & Assignee (Staff Ticket Detail for TKT-2026-001234)
  {
    console.log('Capturing Actions Taken Lifecycle Desktop...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Ticket Queue")');
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001234"):visible').first().click();
    await page.waitForSelector('h2:has-text("Actions Taken")');
    await page.waitForTimeout(800);
    const el = page.locator('h2:has-text("Actions Taken")');
    await el.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'actions-taken/actions-taken_lifecycle_desktop.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 12. Requester Actions Read-Only Mode (TKT-2026-001234)
  {
    console.log('Capturing Requester Read-Only Actions...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'jennifer.anderson@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("My Tickets")');
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001234"):visible').first().click();
    await page.waitForSelector('.tkt-tab-nav-btn:has-text("Actions Taken")');
    await page.click('.tkt-tab-nav-btn:has-text("Actions Taken")');
    await page.waitForSelector('h2:has-text("Actions Taken")');
    await page.waitForTimeout(800);
    const el = page.locator('h2:has-text("Actions Taken")');
    await el.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'actions-taken/actions-taken_requester-readonly_desktop.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 13. Resolution Gate Rejection Alert (TKT-2026-001233 with 0 actions)
  {
    console.log('Capturing Resolution Gate Rejection alert...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Ticket Queue")');
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001233');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001233"):visible').first().click();
    await page.waitForSelector('select');

    // Attempt to select RESOLVED
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('RESOLVED');
    await page.waitForSelector('.tkt-alert-error');
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'actions-taken/actions-taken_resolution-gate-rejection_desktop.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 14. Ticket Status History Timeline Card (TKT-2026-001234)
  {
    console.log('Capturing Ticket Status History Timeline...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Ticket Queue")');
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001234"):visible').first().click();
    await page.waitForSelector('text=Ticket Status History');
    await page.waitForTimeout(600);
    const el = page.locator('text=Ticket Status History').first();
    await el.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'actions-taken/actions-taken_status-history_desktop.png'),
      fullPage: false,
    });
    await context.close();
  }

  // 15. Action Taken Optimistic Concurrency 409 Conflict Error
  {
    console.log('Capturing Optimistic Concurrency 409 Conflict alert...');
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.route('**/api/tickets/*/actions-taken*', async route => {
      if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'CONFLICT: This Action Taken was updated or modified concurrently by another user. Please refresh to load latest version.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'michael.staff@toktickit.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('.tkt-navbar');
    await page.click('.tkt-nav-tab:has-text("Ticket Queue")');
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.fill('input[placeholder*="Search"]', 'TKT-2026-001234');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.locator('.tkt-ticket-link:has-text("TKT-2026-001234"):visible').first().click();
    await page.waitForSelector('h2:has-text("Actions Taken")');

    const addBtn = page.locator('button:has-text("Record Action")').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await page.waitForSelector('textarea');
      await page.fill('textarea', 'Concurrent diagnosis and firmware check update.');
      await page.click('button[type="submit"]:has-text("Record Action")');
      await page.waitForSelector('text=CONFLICT');
      await page.waitForTimeout(600);
    }
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'actions-taken/actions-taken_conflict-409_desktop.png'),
      fullPage: false,
    });
    await context.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
