const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:5173';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function saveScreenshot(sourcePath, filename) {
  const artPath = path.resolve(__dirname, '..', `artifacts/lab-04/screenshots/${filename}`);
  const docPath = path.resolve(__dirname, '..', `docs/lab-04/screenshots/${filename}`);
  ensureDir(path.dirname(artPath));
  ensureDir(path.dirname(docPath));
  fs.copyFileSync(sourcePath, artPath);
  fs.copyFileSync(sourcePath, docPath);
  console.log(`Saved: ${filename}`);
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  
  // Check if already logged in
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
  if (await logoutBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForTimeout(800);
  }

  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In"), button[type="submit"]');
  await page.waitForTimeout(1500);
}

async function loginAndGoToDashboard(page, email, password) {
  await login(page, email, password);
  const dashBtn = page.locator('button:has-text("Dashboard")').first();
  await dashBtn.click();
  await page.waitForTimeout(1000);
}

async function navigateToStaffTicket(page, ticketNumber) {
  const queueBtn = page.locator('button:has-text("Ticket Queue"), a:has-text("Ticket Queue")').first();
  if (await queueBtn.isVisible().catch(() => false)) {
    await queueBtn.click();
    await page.waitForTimeout(600);
  }
  const searchInput = page.locator('.tkt-search-input').first();
  await searchInput.waitFor({ state: 'visible', timeout: 8000 });
  await searchInput.fill(ticketNumber);
  await page.locator('form.tkt-search-row button[type="submit"], button:has-text("Search")').first().click();
  await page.waitForTimeout(800);

  const link = page.locator(`.tkt-ticket-link:has-text("${ticketNumber}"):visible`).first();
  await link.waitFor({ state: 'visible', timeout: 8000 });
  await link.click();
  await page.waitForTimeout(800);
}

async function navigateToRequesterTicket(page, ticketNumber) {
  const myTicketsBtn = page.locator('button:has-text("My Tickets"), a:has-text("My Tickets")').first();
  if (await myTicketsBtn.isVisible().catch(() => false)) {
    await myTicketsBtn.click();
    await page.waitForTimeout(600);
  }
  const searchInput = page.locator('.tkt-search-input').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(ticketNumber);
    await page.locator('form.tkt-search-row button[type="submit"], button:has-text("Search")').first().click();
    await page.waitForTimeout(800);
  }

  const link = page.locator(`.tkt-ticket-link:has-text("${ticketNumber}"):visible`).first();
  await link.waitFor({ state: 'visible', timeout: 8000 });
  await link.click();
  await page.waitForTimeout(800);
}

async function main() {
  console.log('=== Starting Comprehensive Lab 4 Evidence Screenshot Capture (deviceScaleFactor: 2) ===');

  // Reset and seed database cleanly first
  console.log('Resetting and seeding database for clean baseline...');
  execSync('cd server && npx tsx scripts/clean_reset_db.ts && npx prisma db seed', { stdio: 'inherit' });
  console.log('Database cleanly seeded.');

  const dirs = [
    'artifacts/lab-04/screenshots/staff-dashboard',
    'artifacts/lab-04/screenshots/actions-taken',
    'artifacts/lab-04/screenshots/ticket-workflow',
    'artifacts/lab-04/screenshots/requester-dashboard',
    'artifacts/lab-04/screenshots/regression',
    'docs/lab-04/screenshots/staff-dashboard',
    'docs/lab-04/screenshots/actions-taken',
    'docs/lab-04/screenshots/ticket-workflow',
    'docs/lab-04/screenshots/requester-dashboard',
    'docs/lab-04/screenshots/regression'
  ];
  dirs.forEach(d => ensureDir(path.resolve(__dirname, '..', d)));

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // 1. STAFF DASHBOARD
  // -------------------------------------------------------------
  console.log('\n--- 1. Staff Dashboard Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await loginAndGoToDashboard(page, 'michael.staff@toktickit.com', 'Password123!');

    // Wait for Staff Dashboard overview
    await page.waitForSelector('h1:has-text("Staff Dashboard")', { timeout: 8000 });
    await page.waitForSelector('text=My Recent Actions', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const tmpDashDesk = '/tmp/staff_desktop.png';
    await page.screenshot({ path: tmpDashDesk });
    saveScreenshot(tmpDashDesk, 'staff-dashboard/staff-dashboard_overview_desktop.png');

    // Tablet View (820px)
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(600);
    const tmpDashTab = '/tmp/staff_tablet.png';
    await page.screenshot({ path: tmpDashTab });
    saveScreenshot(tmpDashTab, 'staff-dashboard/staff-dashboard_overview_tablet.png');

    // Mobile View (375px)
    await page.setViewportSize({ width: 375, height: 900 });
    await page.waitForTimeout(600);
    const tmpDashMob = '/tmp/staff_mobile.png';
    await page.screenshot({ path: tmpDashMob });
    saveScreenshot(tmpDashMob, 'staff-dashboard/staff-dashboard_overview_mobile.png');

    // Drilldown Capture (Click Unassigned queue card)
    await page.setViewportSize({ width: 1440, height: 900 });
    const unassignedCard = page.locator('.tkt-metric-card:has-text("Unassigned Tickets")').first();
    if (await unassignedCard.isVisible().catch(() => false)) {
      await unassignedCard.click();
      await page.waitForTimeout(1200);
      const tmpDrill = '/tmp/staff_drilldown.png';
      await page.screenshot({ path: tmpDrill });
      saveScreenshot(tmpDrill, 'staff-dashboard/staff-dashboard_drilldown.png');
    }

    await context.close();
  }

  // Staff Dashboard Loading State (Delayed API intercept)
  {
    console.log('Capturing Staff Dashboard Loading State...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 800 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');

    await page.route('**/api/dashboard/staff', async (route) => {
      await new Promise(r => setTimeout(r, 5000));
      await route.continue();
    });

    const dashBtn = page.locator('button:has-text("Dashboard")').first();
    await dashBtn.click();

    await page.waitForSelector('[aria-busy="true"]', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpLoad = '/tmp/staff_loading.png';
    await page.screenshot({ path: tmpLoad });
    saveScreenshot(tmpLoad, 'staff-dashboard/staff-dashboard_state_loading.png');
    await context.close();
  }

  // Staff Dashboard Empty State (myRecentActions: [])
  {
    console.log('Capturing Staff Dashboard Empty State...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 850 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');
    await page.route('**/api/dashboard/staff', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.myRecentActions = [];
      await route.fulfill({ json });
    });
    const dashBtn = page.locator('button:has-text("Dashboard")').first();
    await dashBtn.click();
    await page.waitForSelector('text=No Recent Actions Recorded', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpEmpty = '/tmp/staff_empty.png';
    await page.screenshot({ path: tmpEmpty });
    saveScreenshot(tmpEmpty, 'staff-dashboard/staff-dashboard_state_empty.png');
    await context.close();
  }

  // Staff Dashboard Forbidden State (403)
  {
    console.log('Capturing Staff Dashboard Forbidden State (403)...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 700 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');
    await page.route('**/api/dashboard/staff', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Access denied: Staff or Admin role required.' } })
      });
    });
    const dashBtn = page.locator('button:has-text("Dashboard")').first();
    await dashBtn.click();
    await page.waitForSelector('text=403 Forbidden', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpForbid = '/tmp/staff_forbidden.png';
    await page.screenshot({ path: tmpForbid });
    saveScreenshot(tmpForbid, 'staff-dashboard/staff-dashboard_state_forbidden.png');
    await context.close();
  }

  // Staff Dashboard Error State (500)
  {
    console.log('Capturing Staff Dashboard Error State (500)...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 700 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');
    await page.route('**/api/dashboard/staff', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Failed to compute operational queue telemetry.' } })
      });
    });
    const dashBtn = page.locator('button:has-text("Dashboard")').first();
    await dashBtn.click();
    await page.waitForSelector('text=500 Internal Server Error', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpErr = '/tmp/staff_error.png';
    await page.screenshot({ path: tmpErr });
    saveScreenshot(tmpErr, 'staff-dashboard/staff-dashboard_state_error.png');
    await context.close();
  }

  // -------------------------------------------------------------
  // 2. ACTIONS TAKEN
  // -------------------------------------------------------------
  console.log('\n--- 2. Actions Taken Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');

    // Navigate to Ticket Detail TKT-2026-001234
    await navigateToStaffTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('text=Actions Taken', { timeout: 8000 });
    await page.waitForTimeout(1000);

    // Scroll to Actions Taken section
    const actionsHeader = page.locator('text=Actions Taken').first();
    await actionsHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // 2.1 Lifecycle Overview
    const tmpActLife = '/tmp/act_lifecycle.png';
    await page.screenshot({ path: tmpActLife });
    saveScreenshot(tmpActLife, 'actions-taken/actions-taken_lifecycle_desktop.png');

    // 2.2 Create Form Modal
    await page.click('button:has-text("+ Add Action")');
    await page.waitForSelector('text=Record New Action Taken', { timeout: 6000 });
    await page.waitForTimeout(600);
    const tmpCreate = '/tmp/act_create.png';
    await page.screenshot({ path: tmpCreate });
    saveScreenshot(tmpCreate, 'actions-taken/actions-taken_create-form_desktop.png');

    // 2.3 Validation Error (Check Follow-up without note)
    const followUpCheckbox = page.locator('input[type="checkbox"]').first();
    await followUpCheckbox.check();
    await page.waitForSelector('text=Follow-up Note', { timeout: 4000 });
    await page.fill('textarea#actionDescription', 'Performed preliminary hardware inspection on laptop.');
    await page.click('button:has-text("Save Action")');
    await page.waitForSelector('text=Follow-up note is required', { timeout: 6000 });
    await page.waitForTimeout(500);
    const tmpVal = '/tmp/act_validation.png';
    await page.screenshot({ path: tmpVal });
    saveScreenshot(tmpVal, 'actions-taken/actions-taken_validation-error_desktop.png');

    // 2.4 Inactive Assignee Rejection
    await page.route('**/api/tickets/*/actions*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'INACTIVE_ASSIGNEE',
              message: 'Assignee must be an active IT Staff or Administrator.'
            }
          })
        });
      } else {
        await route.continue();
      }
    });
    await page.fill('#followUpNote', 'Coordinate with tier 2 engineering.');
    await page.click('button:has-text("Save Action")');
    await page.waitForSelector('text=Assignee must be an active IT Staff', { timeout: 6000 });
    await page.waitForTimeout(500);
    const tmpInact = '/tmp/act_inactive.png';
    await page.screenshot({ path: tmpInact });
    saveScreenshot(tmpInact, 'actions-taken/actions-taken_inactive-rejection_desktop.png');

    // Close modal
    await page.unroute('**/api/tickets/*/actions*');
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);

    // 2.5 Cancelled Action State (seeded on TKT-2026-001234)
    const cancelledBadge = page.locator('span:has-text("Cancelled")').first();
    await cancelledBadge.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpCancel = '/tmp/act_cancel.png';
    await page.screenshot({ path: tmpCancel });
    saveScreenshot(tmpCancel, 'actions-taken/actions-taken_cancel_desktop.png');

    // 2.6 Tablet Actions Taken
    await page.setViewportSize({ width: 820, height: 1100 });
    await actionsHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpActTab = '/tmp/act_tablet.png';
    await page.screenshot({ path: tmpActTab });
    saveScreenshot(tmpActTab, 'actions-taken/actions-taken_tablet.png');

    // 2.7 Mobile Actions Taken
    await page.setViewportSize({ width: 375, height: 812 });
    await actionsHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpActMob = '/tmp/act_mobile.png';
    await page.screenshot({ path: tmpActMob });
    saveScreenshot(tmpActMob, 'actions-taken/actions-taken_mobile.png');

    // 2.8 Optimistic Concurrency 409 Conflict Banner
    await page.setViewportSize({ width: 1440, height: 950 });
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForSelector('text=Edit Action Taken', { timeout: 6000 });
      await page.route('**/api/tickets/**', async (route) => {
        if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'CONFLICT',
                message: 'Conflict detected: Action was updated by another staff member while you were editing.'
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      await page.click('button:has-text("Update Action")');
      await page.waitForSelector('text=Conflict detected', { timeout: 6000 });
      await page.waitForTimeout(600);
      const tmpConf = '/tmp/act_conflict.png';
      await page.screenshot({ path: tmpConf });
      saveScreenshot(tmpConf, 'actions-taken/actions-taken_conflict-409_desktop.png');
      await page.unroute('**/api/tickets/**');
      await page.click('button:has-text("Cancel")');
    }

    await context.close();
  }

  // 2.9 Requester Read-Only View on Actions Taken
  {
    console.log('Capturing Requester Read-Only View on Actions Taken...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'jennifer.anderson@example.com', 'Password123!');

    await navigateToRequesterTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('button:has-text("Actions Taken")', { timeout: 8000 });
    await page.click('button:has-text("Actions Taken")');
    await page.waitForSelector('text=Actions Taken', { timeout: 8000 });
    await page.waitForTimeout(600);

    const tmpReqAct = '/tmp/act_readonly.png';
    await page.screenshot({ path: tmpReqAct });
    saveScreenshot(tmpReqAct, 'actions-taken/actions-taken_requester-readonly_desktop.png');
    await context.close();
  }

  // -------------------------------------------------------------
  // 3. TICKET WORKFLOW & STATUS HISTORY
  // -------------------------------------------------------------
  console.log('\n--- 3. Ticket Workflow & Status History Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');

    // 3.1 Resolution Gate Rejection Banner on TKT-2026-001233 (0 actions)
    await navigateToStaffTicket(page, 'TKT-2026-001233');
    await page.waitForSelector('select#ticketStatusSelect', { timeout: 8000 });

    const statusSelect = page.locator('select#ticketStatusSelect');
    await statusSelect.selectOption('RESOLVED');
    await page.waitForSelector('text=Resolution Gate: At least one Action Taken must be recorded', { timeout: 8000 });
    await page.waitForTimeout(600);

    const tmpGate = '/tmp/workflow_gate.png';
    await page.screenshot({ path: tmpGate });
    saveScreenshot(tmpGate, 'ticket-workflow/workflow_resolution-gate-rejection_desktop.png');
    saveScreenshot(tmpGate, 'actions-taken/actions-taken_resolution-gate-rejection_desktop.png');

    // 3.2 Append-Only Status History with >= 3 rows on TKT-2026-001234
    await navigateToStaffTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('text=Ticket Status History', { timeout: 8000 });

    const historyCard = page.locator('div:has-text("Ticket Status History")').first();
    await historyCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpHist = '/tmp/workflow_history.png';
    await page.screenshot({ path: tmpHist });
    saveScreenshot(tmpHist, 'ticket-workflow/workflow_status-history_desktop.png');
    saveScreenshot(tmpHist, 'actions-taken/actions-taken_status-history_desktop.png');

    // 3.3 Successful Workflow Transition
    const wfSelect = page.locator('select#ticketStatusSelect');
    await wfSelect.selectOption('WAITING_FOR_REQUESTER');
    await page.waitForSelector('text=Ticket status updated to WAITING_FOR_REQUESTER', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpTrans = '/tmp/workflow_trans.png';
    await page.screenshot({ path: tmpTrans });
    saveScreenshot(tmpTrans, 'ticket-workflow/workflow_transition_desktop.png');

    await context.close();
  }

  // 3.4 Requester-Visible Status History
  {
    console.log('Capturing Requester-Visible Status History...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    await navigateToRequesterTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('button:has-text("Status History")', { timeout: 8000 });
    await page.click('button:has-text("Status History")');
    await page.waitForSelector('text=Ticket Status History', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpReqHist = '/tmp/workflow_req_hist.png';
    await page.screenshot({ path: tmpReqHist });
    saveScreenshot(tmpReqHist, 'ticket-workflow/workflow_requester-history_desktop.png');
    await context.close();
  }

  // -------------------------------------------------------------
  // 4. REQUESTER DASHBOARD
  // -------------------------------------------------------------
  console.log('\n--- 4. Requester Dashboard Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await loginAndGoToDashboard(page, 'jennifer.anderson@example.com', 'Password123!');

    await page.waitForSelector('text=My Support Dashboard', { timeout: 8000 });
    await page.waitForSelector('.tkt-btn-attention', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const tmpReqDesk = '/tmp/req_desktop.png';
    await page.screenshot({ path: tmpReqDesk });
    saveScreenshot(tmpReqDesk, 'requester-dashboard/requester-dashboard_overview_desktop.png');

    // Tablet
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(600);
    const tmpReqTab = '/tmp/req_tablet.png';
    await page.screenshot({ path: tmpReqTab });
    saveScreenshot(tmpReqTab, 'requester-dashboard/requester-dashboard_overview_tablet.png');

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(600);
    const tmpReqMob = '/tmp/req_mobile.png';
    await page.screenshot({ path: tmpReqMob });
    saveScreenshot(tmpReqMob, 'requester-dashboard/requester-dashboard_overview_mobile.png');

    // Drilldown (Click My Open Tickets)
    await page.setViewportSize({ width: 1440, height: 900 });
    const openTicketsCard = page.locator('.tkt-metric-card:has-text("My Open Tickets")').first();
    if (await openTicketsCard.isVisible().catch(() => false)) {
      await openTicketsCard.click();
      await page.waitForTimeout(1200);
      const tmpReqDrill = '/tmp/req_drilldown.png';
      await page.screenshot({ path: tmpReqDrill });
      saveScreenshot(tmpReqDrill, 'requester-dashboard/requester-dashboard_drilldown.png');
    }

    await context.close();
  }

  // -------------------------------------------------------------
  // 5. REGRESSION (LABS 1 TO 3)
  // -------------------------------------------------------------
  console.log('\n--- 5. Regression Suite Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    // 5.1 Login Screen
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(800);
    }
    await page.waitForSelector('input[type="email"]');
    const tmpLogin = '/tmp/regr_login.png';
    await page.screenshot({ path: tmpLogin });
    saveScreenshot(tmpLogin, 'regression/regression_login.png');

    // 5.2 Requester My Tickets
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    const myTicketsBtn = page.locator('button:has-text("My Tickets")').first();
    await myTicketsBtn.click();
    await page.waitForSelector('table, .tkt-queue-card', { timeout: 8000 });
    await page.waitForTimeout(800);
    const tmpMyTkt = '/tmp/regr_mytkt.png';
    await page.screenshot({ path: tmpMyTkt });
    saveScreenshot(tmpMyTkt, 'regression/regression_my-tickets.png');

    // 5.3 Ticket Detail
    await navigateToRequesterTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('text=Ticket Detail', { timeout: 8000 });
    await page.waitForTimeout(800);
    const tmpTktDet = '/tmp/regr_tktdet.png';
    await page.screenshot({ path: tmpTktDet });
    saveScreenshot(tmpTktDet, 'regression/regression_ticket-detail.png');

    // 5.4 Attachments
    await page.click('button:has-text("Attachments")');
    await page.waitForSelector('text=Manage Attachments', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpAtt = '/tmp/regr_attachments.png';
    await page.screenshot({ path: tmpAtt });
    saveScreenshot(tmpAtt, 'regression/regression_attachments.png');

    // 5.5 Public Comments
    await page.click('button:has-text("Comments")');
    await page.waitForSelector('text=Public Comments', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpComm = '/tmp/regr_comments.png';
    await page.screenshot({ path: tmpComm });
    saveScreenshot(tmpComm, 'regression/regression_public-comments.png');

    // 5.6 Admin User Management
    await login(page, 'admin@toktickit.com', 'Password123!');
    await page.click('button:has-text("User Management"), a:has-text("User Management")');
    await page.waitForSelector('text=User Management', { timeout: 8000 });
    await page.waitForTimeout(800);
    const tmpAdmin = '/tmp/regr_admin.png';
    await page.screenshot({ path: tmpAdmin });
    saveScreenshot(tmpAdmin, 'regression/regression_admin-users.png');

    // 5.7 Staff Internal Notes (on Staff Ticket Detail)
    await login(page, 'michael.staff@toktickit.com', 'Password123!');
    await navigateToStaffTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('text=Private Internal Notes', { timeout: 8000 });
    const notesHeader = page.locator('text=Private Internal Notes').first();
    await notesHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpNotes = '/tmp/regr_notes.png';
    await page.screenshot({ path: tmpNotes });
    saveScreenshot(tmpNotes, 'regression/regression_internal-notes.png');

    // 5.8 Requester Access Denied Banner
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    // Intercept ticket detail request to return 404 forbidden/not found
    await page.route('**/api/tickets/*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'Ticket not found or you do not have permission to view it.'
          }
        })
      });
    });
    const firstTicket = page.locator('.tkt-ticket-link:visible').first();
    if (await firstTicket.isVisible().catch(() => false)) {
      await firstTicket.click();
    }
    await page.waitForSelector('.tkt-alert-error', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpDenied = '/tmp/regr_denied.png';
    await page.screenshot({ path: tmpDenied });
    saveScreenshot(tmpDenied, 'regression/regression_requester-denied.png');

    await context.close();
  }

  await browser.close();
  console.log('\n=== All comprehensive high-resolution evidence screenshots successfully captured! ===');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
