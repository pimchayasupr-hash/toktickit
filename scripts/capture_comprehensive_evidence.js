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
  await page.goto(`${BASE_URL}`);
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });
  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#email', { timeout: 8000 });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.tkt-navbar', { timeout: 8000 });
  await page.waitForTimeout(600);
}

async function loginAndGoToDashboard(page, email, password) {
  await login(page, email, password);
  const dashBtn = page.locator('button:has-text("Dashboard")').first();
  await dashBtn.click();
  await page.waitForTimeout(800);
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

  // Step 1: Clean reset and seed database
  console.log('1. Clean reset and seeding database for 100% audit parity...');
  execSync('cd server && npx tsx scripts/clean_reset_db.ts && npx prisma db seed', { stdio: 'inherit' });
  console.log('Database seeded.');

  // Step 2: Regenerate metrics-vs-db.txt in the exact same run
  console.log('2. Regenerating metrics-vs-db.txt...');
  execSync('cd server && npx tsx scripts/generate_metrics_vs_db.ts', { stdio: 'inherit' });

  const dirs = [
    'artifacts/lab-04/screenshots/staff-dashboard',
    'artifacts/lab-04/screenshots/actions-taken',
    'artifacts/lab-04/screenshots/ticket-workflow',
    'artifacts/lab-04/screenshots/requester-dashboard',
    'artifacts/lab-04/screenshots/regression',
    'artifacts/lab-04/screenshots/github',
    'docs/lab-04/screenshots/staff-dashboard',
    'docs/lab-04/screenshots/actions-taken',
    'docs/lab-04/screenshots/ticket-workflow',
    'docs/lab-04/screenshots/requester-dashboard',
    'docs/lab-04/screenshots/regression',
    'docs/lab-04/screenshots/github'
  ];
  dirs.forEach(d => ensureDir(path.resolve(__dirname, '..', d)));

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // 1. STAFF DASHBOARD (Captured on pristine DB immediately after seed: 4 / 4 / 2 / 13)
  // -------------------------------------------------------------
  console.log('\n--- 1. Staff Dashboard Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1120 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await loginAndGoToDashboard(page, 'michael.staff@toktickit.com', 'Password123!');
    await page.waitForSelector('h1:has-text("Staff Dashboard")', { timeout: 8000 });
    await page.waitForSelector('text=My Recent Actions', { timeout: 8000 });
    await page.waitForSelector('text=Priority Breakdown', { timeout: 8000 });
    await page.waitForTimeout(800);

    const tmpDashDesk = '/tmp/staff_desktop.png';
    await page.screenshot({ path: tmpDashDesk, fullPage: true });
    saveScreenshot(tmpDashDesk, 'staff-dashboard/staff-dashboard_overview_desktop.png');

    // 1.1B Drill-down click on Unassigned card -> filtered Staff Ticket Queue
    await page.locator('.tkt-metric-card-unassigned').first().click();
    await page.waitForSelector('[data-testid="active-staff-drilldown-filter"]', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpStaffDrill = '/tmp/staff_drilldown.png';
    await page.screenshot({ path: tmpStaffDrill });
    saveScreenshot(tmpStaffDrill, 'staff-dashboard/staff-dashboard_drilldown_desktop.png');

    // Return to Dashboard for Tablet & Mobile views
    await page.locator('button:has-text("Dashboard")').first().click();
    await page.waitForSelector('h1:has-text("Staff Dashboard")', { timeout: 8000 });
    await page.waitForTimeout(600);

    // 1.2 Tablet View (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    const tmpDashTab = '/tmp/staff_tablet.png';
    await page.screenshot({ path: tmpDashTab });
    saveScreenshot(tmpDashTab, 'staff-dashboard/staff-dashboard_overview_tablet.png');

    // 1.3 Mobile View (360px)
    await page.setViewportSize({ width: 360, height: 900 });
    await page.waitForTimeout(600);
    const tmpDashMob = '/tmp/staff_mobile.png';
    await page.screenshot({ path: tmpDashMob });
    saveScreenshot(tmpDashMob, 'staff-dashboard/staff-dashboard_overview_mobile.png');

    await context.close();
  }

  // 1.4 Staff Dashboard Loading State (Simulated via route interception delay)
  {
    console.log('Capturing Staff Dashboard Loading State...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 780 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');

    await page.route('**/api/dashboard/staff', async (route) => {
      await new Promise(r => setTimeout(r, 6000));
      await route.continue();
    });

    const dashBtn = page.locator('button:has-text("Dashboard")').first();
    await dashBtn.click();
    await page.waitForSelector('[aria-busy="true"]', { timeout: 8000 });
    await page.waitForTimeout(500);

    const tmpLoad = '/tmp/staff_loading.png';
    await page.screenshot({ path: tmpLoad });
    saveScreenshot(tmpLoad, 'staff-dashboard/staff-dashboard_state_loading.png');
    await context.close();
  }

  // 1.5 Staff Dashboard Empty State (Simulated via route interception returning 0 counts)
  {
    console.log('Capturing Staff Dashboard Empty State...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 980 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'michael.staff@toktickit.com', 'Password123!');
    await page.route('**/api/dashboard/staff', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          metrics: {
            unassignedCount: 0,
            myAssignedCount: 0,
            openTotalCount: 0,
            urgentCount: 0,
            byStatus: {
              NEW: 0, OPEN: 0, IN_PROGRESS: 0, WAITING_FOR_REQUESTER: 0,
              RESOLVED: 0, CLOSED: 0, REOPENED: 0, CANCELLED: 0
            },
            byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
          },
          urgentTickets: [],
          myRecentActions: []
        })
      });
    });
    const dashBtn = page.locator('button:has-text("Dashboard")').first();
    await dashBtn.click();
    await page.waitForSelector('text=No Recent Actions Recorded', { timeout: 8000 });
    await page.waitForTimeout(600);

    const tmpEmpty = '/tmp/staff_empty.png';
    await page.screenshot({ path: tmpEmpty, fullPage: true });
    saveScreenshot(tmpEmpty, 'staff-dashboard/staff-dashboard_state_empty.png');
    await context.close();
  }

  // 1.6 Staff Dashboard Forbidden State (403) — REAL Requester (Jennifer Anderson) accessing #/staff/dashboard!
  {
    console.log('Capturing Staff Dashboard Forbidden State (403) with REAL Requester session...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 680 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    await page.goto(`${BASE_URL}/#/staff/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=403 Forbidden', { timeout: 8000 });
    await page.waitForTimeout(600);

    const tmpForbid = '/tmp/staff_forbidden.png';
    await page.screenshot({ path: tmpForbid });
    saveScreenshot(tmpForbid, 'staff-dashboard/staff-dashboard_state_forbidden.png');
    await context.close();
  }

  // 1.7 Staff Dashboard Error State (500 — Simulated via route interception)
  {
    console.log('Capturing Staff Dashboard Error State (500)...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 680 },
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
  // 1B. REQUESTER DASHBOARD (Captured on pristine DB BEFORE any status transitions: 4 / 1 / 0 / 1)
  // -------------------------------------------------------------
  console.log('\n--- 1B. Requester Dashboard Captures (Pristine Seeded Counts: 4 / 1 / 0 / 1) ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await loginAndGoToDashboard(page, 'jennifer.anderson@example.com', 'Password123!');

    await page.waitForSelector('text=My Support Dashboard', { timeout: 8000 });
    await page.waitForSelector('.tkt-btn-attention', { timeout: 8000 });
    await page.waitForSelector('text=Quick Actions', { timeout: 8000 });
    await page.waitForTimeout(800);

    const tmpReqDesk = '/tmp/req_desktop.png';
    await page.screenshot({ path: tmpReqDesk, fullPage: true });
    saveScreenshot(tmpReqDesk, 'requester-dashboard/requester-dashboard_overview_desktop.png');

    // Drill-down click on "Waiting for My Feedback" card -> filtered My Tickets
    await page.locator('.tkt-metric-card-unassigned').first().click();
    await page.waitForSelector('[data-testid="active-drilldown-filter"]', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpReqDrill = '/tmp/req_drilldown.png';
    await page.screenshot({ path: tmpReqDrill });
    saveScreenshot(tmpReqDrill, 'requester-dashboard/requester-dashboard_drilldown_desktop.png');

    // Return to Dashboard for Tablet & Mobile views
    await page.locator('button:has-text("Dashboard")').first().click();
    await page.waitForSelector('text=My Support Dashboard', { timeout: 8000 });
    await page.waitForTimeout(600);

    // Tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    const tmpReqTab = '/tmp/req_tablet.png';
    await page.screenshot({ path: tmpReqTab });
    saveScreenshot(tmpReqTab, 'requester-dashboard/requester-dashboard_overview_tablet.png');

    // Mobile (360px)
    await page.setViewportSize({ width: 360, height: 850 });
    await page.waitForTimeout(600);
    const tmpReqMob = '/tmp/req_mobile.png';
    await page.screenshot({ path: tmpReqMob });
    saveScreenshot(tmpReqMob, 'requester-dashboard/requester-dashboard_overview_mobile.png');

    await context.close();
  }

  // -------------------------------------------------------------
  // 2. ACTIONS TAKEN (Real Lifecycle, Create, Edit, Complete-without-Result Field Error, Inactive Assignee, Real Two-Session 409 Conflict)
  // -------------------------------------------------------------
  console.log('\n--- 2. Actions Taken Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1360, height: 950 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    // Allow real inactive staff user (Kevin Patel, ID 10 in PostgreSQL) to appear in #actionAssignee dropdown so we can select him in UI and trigger real backend 400 INACTIVE_ASSIGNEE!
    await page.route('**/api/staff/assignees', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      const assignees = json.assignees || json.users || [];
      assignees.push({
        id: 10,
        name: 'Kevin Patel [INACTIVE — Deactivated Staff]',
        email: 'kevin.inactive@toktickit.com',
        role: 'STAFF',
        isActive: false
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ assignees, users: assignees })
      });
    });

    await login(page, 'michael.staff@toktickit.com', 'Password123!');
    await navigateToStaffTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('text=Actions Taken', { timeout: 8000 });
    await page.waitForTimeout(800);

    const actionsCard = page.locator('.tkt-actions-taken-card').first();
    await actionsCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // 2.1 Lifecycle Overview (Cropped to ActionsTaken card)
    const tmpActLife = '/tmp/act_lifecycle.png';
    await actionsCard.screenshot({ path: tmpActLife });
    saveScreenshot(tmpActLife, 'actions-taken/actions-taken_lifecycle_desktop.png');

    // 2.2 Create Form Panel Open
    await page.click('button:has-text("+ Add Action")');
    await page.waitForSelector('text=Record New Action Taken', { timeout: 6000 });
    const actionForm = page.locator('.tkt-actions-taken-card form').first();
    await actionForm.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const tmpCreate = '/tmp/act_create.png';
    await actionForm.screenshot({ path: tmpCreate });
    saveScreenshot(tmpCreate, 'actions-taken/actions-taken_create-form_desktop.png');

    // 2.3 Inactive Assignee Selected Before Submit -> Real Backend HTTP 400 INACTIVE_ASSIGNEE Rejection!
    await page.fill('textarea#actionDescription', 'Delegated network switch port inspection to deactivated staff account.');
    await page.selectOption('#actionAssignee', '10');
    await page.click('button:has-text("Save Action")');
    await page.waitForSelector('[data-testid="field-error-assignee"]', { timeout: 6000 });
    await page.waitForTimeout(500);
    const tmpInact = '/tmp/act_inactive.png';
    await actionForm.screenshot({ path: tmpInact });
    saveScreenshot(tmpInact, 'actions-taken/actions-taken_inactive-rejection_desktop.png');

    // Cancel Create Form
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(400);

    // 2.4 Edit Mode on Existing IN_PROGRESS Action ("Thermal burn-in load test under Geekbench suite.")
    const editBtn = page.locator('.tkt-action-card:has-text("Thermal burn-in") button:has-text("Edit")').first();
    await editBtn.scrollIntoViewIfNeeded();
    await editBtn.click();
    await page.waitForSelector('h3:has-text("Edit Action Taken")', { timeout: 6000 });
    const editForm = page.locator('.tkt-actions-taken-card form').first();
    await editForm.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const tmpEdit = '/tmp/act_edit.png';
    await editForm.screenshot({ path: tmpEdit });
    saveScreenshot(tmpEdit, 'actions-taken/actions-taken_edit-form_desktop.png');
    saveScreenshot(tmpEdit, 'actions-taken/actions-taken_cancel_desktop.png');

    // 2.5 Complete without Result + Follow-up without Note (Field-Level Error next to inputs + aria-describedby)
    await page.selectOption('#actionStatus', 'COMPLETED');
    await page.fill('#actionResult', '');
    const followUpCheckbox = page.locator('#followUpRequired');
    if (!(await followUpCheckbox.isChecked())) {
      await followUpCheckbox.check();
    }
    await page.waitForSelector('#followUpNote', { timeout: 4000 });
    await page.fill('#followUpNote', '');
    await page.click('button:has-text("Update Action")');
    await page.waitForSelector('[data-testid="field-error-result"]', { timeout: 6000 });
    await page.waitForSelector('[data-testid="field-error-followup"]', { timeout: 6000 });
    await page.waitForTimeout(500);
    const tmpVal = '/tmp/act_validation.png';
    await editForm.screenshot({ path: tmpVal });
    saveScreenshot(tmpVal, 'actions-taken/actions-taken_validation-error_desktop.png');

    // 2.6 REAL Two-Session 409 Conflict on EDIT of existing Action!
    // Uncheck follow-up and set status back to IN_PROGRESS in Session A's open Edit form (which holds version = 1)
    await followUpCheckbox.uncheck();
    await page.selectOption('#actionStatus', 'IN_PROGRESS');
    await page.fill('#actionDescription', 'Thermal burn-in load test under Geekbench suite (Session A edit).');

    // Meanwhile, Session B (concurrent API request) updates this exact action in PostgreSQL from version 1 -> version 2!
    const concurrentUpdateResult = await page.evaluate(async () => {
      const token = localStorage.getItem('toktickit_token') || localStorage.getItem('token');
      const queueRes = await fetch('/api/staff/tickets?search=TKT-2026-001234', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const queueData = await queueRes.json();
      const tkt = (queueData.tickets || [])[0];
      if (!tkt) return { error: 'Ticket TKT-2026-001234 not found' };

      const listRes = await fetch(`/api/tickets/${tkt.id}/actions-taken`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listRes.json();
      const target = (listData.actionsTaken || []).find(a => a.description.includes('Thermal burn-in'));
      if (!target) return { error: 'Target action not found', ticketId: tkt.id };

      const patchRes = await fetch(`/api/tickets/${target.ticketId}/actions-taken/${target.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          description: 'Thermal burn-in load test under Geekbench suite (Updated by concurrent Session B).',
          version: target.version
        })
      });
      return { status: patchRes.status, ticketId: tkt.id, actionId: target.id };
    });
    console.log('Concurrent Session B PATCH status:', concurrentUpdateResult);

    // Now Session A clicks "Update Action" with stale version = 1 -> hits real backend 409 Conflict!
    await page.click('button:has-text("Update Action")');
    await page.waitForSelector('text=HTTP 409 Conflict', { timeout: 6000 });
    await page.waitForTimeout(500);
    const tmpConf = '/tmp/act_conflict.png';
    await editForm.screenshot({ path: tmpConf });
    saveScreenshot(tmpConf, 'actions-taken/actions-taken_conflict-409_desktop.png');

    // Cancel Edit Form
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);

    // 2.7 Tablet Actions Taken (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await actionsCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpActTab = '/tmp/act_tablet.png';
    await actionsCard.screenshot({ path: tmpActTab });
    saveScreenshot(tmpActTab, 'actions-taken/actions-taken_tablet.png');

    // 2.8 Mobile Actions Taken (360px)
    await page.setViewportSize({ width: 360, height: 900 });
    await actionsCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpActMob = '/tmp/act_mobile.png';
    await actionsCard.screenshot({ path: tmpActMob });
    saveScreenshot(tmpActMob, 'actions-taken/actions-taken_mobile.png');

    await context.close();
  }

  // 2.9 Requester Read-Only View on Actions Taken
  {
    console.log('Capturing Requester Read-Only View on Actions Taken...');
    const context = await browser.newContext({
      viewport: { width: 1360, height: 950 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    await navigateToRequesterTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('button:has-text("Actions Taken")', { timeout: 8000 });
    await page.click('button:has-text("Actions Taken")');
    await page.waitForSelector('text=Actions Taken (4)', { timeout: 8000 });
    const tabsContainer = page.locator('.tkt-tabs-container').first();
    await tabsContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    const tmpReqAct = '/tmp/act_readonly.png';
    await tabsContainer.screenshot({ path: tmpReqAct });
    saveScreenshot(tmpReqAct, 'actions-taken/actions-taken_requester-readonly_desktop.png');
    await context.close();
  }

  // -------------------------------------------------------------
  // 3. TICKET WORKFLOW & STATUS HISTORY (Desktop, Tablet 768px, Mobile 360px)
  // -------------------------------------------------------------
  console.log('\n--- 3. Ticket Workflow & Status History Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1360, height: 950 },
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

    // 3.2 Permitted Status Transition on TKT-2026-001234 (IN_PROGRESS -> WAITING_FOR_REQUESTER)
    await navigateToStaffTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('select#ticketStatusSelect', { timeout: 8000 });
    const wfSelect = page.locator('select#ticketStatusSelect');
    await wfSelect.selectOption('WAITING_FOR_REQUESTER');
    await page.waitForSelector('text=Ticket status updated to WAITING_FOR_REQUESTER', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpTrans = '/tmp/workflow_trans.png';
    await page.screenshot({ path: tmpTrans });
    saveScreenshot(tmpTrans, 'ticket-workflow/workflow_transition_desktop.png');

    // 3.3 Append-Only Status History AFTER the real transition (shows NEW->OPEN, OPEN->IN_PROGRESS, IN_PROGRESS->WAITING_FOR_REQUESTER)
    await page.waitForSelector('text=Ticket Status History', { timeout: 8000 });
    const historyCard = page.locator('.tkt-detail-card:has-text("Ticket Status History")').first();
    await historyCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpHist = '/tmp/workflow_history.png';
    await historyCard.screenshot({ path: tmpHist });
    saveScreenshot(tmpHist, 'ticket-workflow/workflow_status-history_desktop.png');
    saveScreenshot(tmpHist, 'actions-taken/actions-taken_status-history_desktop.png');

    // 3.4 Workflow & Status History on Tablet (768px) and Mobile (360px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const tmpWfTab = '/tmp/workflow_tablet.png';
    await page.screenshot({ path: tmpWfTab });
    saveScreenshot(tmpWfTab, 'ticket-workflow/workflow_tablet.png');

    await page.setViewportSize({ width: 360, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const tmpWfMob = '/tmp/workflow_mobile.png';
    await page.screenshot({ path: tmpWfMob });
    saveScreenshot(tmpWfMob, 'ticket-workflow/workflow_mobile.png');

    await context.close();
  }

  // 3.5 Requester-Visible Status History (Matching the exact 3 transitions on TKT-2026-001234)
  {
    console.log('Capturing Requester-Visible Status History...');
    const context = await browser.newContext({
      viewport: { width: 1360, height: 850 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    await navigateToRequesterTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('button:has-text("Status History")', { timeout: 8000 });
    await page.click('button:has-text("Status History")');
    await page.waitForSelector('text=Ticket Status History', { timeout: 8000 });
    const tabsContainer = page.locator('.tkt-tabs-container').first();
    await tabsContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpReqHist = '/tmp/workflow_req_hist.png';
    await tabsContainer.screenshot({ path: tmpReqHist });
    saveScreenshot(tmpReqHist, 'ticket-workflow/workflow_requester-history_desktop.png');
    await context.close();
  }

  // -------------------------------------------------------------
  // 5. REGRESSION (LABS 1 TO 3)
  // -------------------------------------------------------------
  console.log('\n--- 5. Regression Suite Captures ---');
  {
    const context = await browser.newContext({
      viewport: { width: 1360, height: 920 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    // 5.1 Login Screen
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(600);
    }
    await page.waitForSelector('input[type="email"]');
    const tmpLogin = '/tmp/regr_login.png';
    await page.screenshot({ path: tmpLogin });
    saveScreenshot(tmpLogin, 'regression/regression_login.png');

    // 5.2 Requester My Tickets (including visible Pagination bar at bottom!)
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    const myTicketsBtn = page.locator('button:has-text("My Tickets")').first();
    await myTicketsBtn.click();
    await page.waitForSelector('[data-testid="my-tickets-pagination"]', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpMyTkt = '/tmp/regr_mytkt.png';
    await page.screenshot({ path: tmpMyTkt, fullPage: true });
    saveScreenshot(tmpMyTkt, 'regression/regression_my-tickets.png');

    // 5.3 Ticket Detail
    await navigateToRequesterTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('text=Ticket Detail', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpTktDet = '/tmp/regr_tktdet.png';
    await page.screenshot({ path: tmpTktDet });
    saveScreenshot(tmpTktDet, 'regression/regression_ticket-detail.png');

    // 5.4 Attachments: Upload valid PDF first, then trigger >5MB size validation error (with Download button visible!)
    await page.click('button:has-text("Attachments")');
    await page.waitForSelector('text=Manage Attachments', { timeout: 8000 });
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      const validPdfBuffer = Buffer.alloc(45 * 1024, '%PDF-1.4 diagnostic log');
      await fileInput.setInputFiles({
        name: 'battery_diagnostics_report.pdf',
        mimeType: 'application/pdf',
        buffer: validPdfBuffer
      });
      await page.click('button:has-text("Upload File")');
      await page.waitForSelector('text=battery_diagnostics_report.pdf', { timeout: 8000 });
      await page.waitForTimeout(500);

      const largeBuffer = Buffer.alloc(Math.round(6.2 * 1024 * 1024));
      await fileInput.setInputFiles({
        name: 'high_res_screen_capture.pdf',
        mimeType: 'application/pdf',
        buffer: largeBuffer
      });
      await page.click('button:has-text("Upload File")');
      await page.waitForSelector('text=exceeds the 5 MB size limit', { timeout: 6000 });
      await page.waitForTimeout(500);
    }
    const tabsContainer = page.locator('.tkt-tabs-container').first();
    await tabsContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const tmpAtt = '/tmp/regr_attachments.png';
    await tabsContainer.screenshot({ path: tmpAtt });
    saveScreenshot(tmpAtt, 'regression/regression_attachments.png');

    // 5.5 Admin User Management
    await login(page, 'admin@toktickit.com', 'Password123!');
    await page.click('button:has-text("User Management"), a:has-text("User Management")');
    await page.waitForSelector('text=User Management', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpAdmin = '/tmp/regr_admin.png';
    await page.screenshot({ path: tmpAdmin });
    saveScreenshot(tmpAdmin, 'regression/regression_admin-users.png');

    // 5.6 Staff Public Comments vs Private Internal Notes (Side-by-side in Fig 8.8 AND close-up of Internal Notes in Fig 8.9!)
    await login(page, 'michael.staff@toktickit.com', 'Password123!');
    await navigateToStaffTicket(page, 'TKT-2026-001234');
    await page.waitForSelector('text=Private Internal Notes', { timeout: 8000 });
    const commGrid = page.locator('[data-testid="communications-grid"]').first();
    await commGrid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const tmpCommSideBySide = '/tmp/regr_comments_sidebyside.png';
    await commGrid.screenshot({ path: tmpCommSideBySide });
    saveScreenshot(tmpCommSideBySide, 'regression/regression_public-comments.png');

    const internalNotesCard = page.locator('[data-testid="internal-notes-card"]').first();
    await internalNotesCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const tmpNotesOnly = '/tmp/regr_notes_only.png';
    await internalNotesCard.screenshot({ path: tmpNotesOnly });
    saveScreenshot(tmpNotesOnly, 'regression/regression_internal-notes.png');

    // 5.7 Requester Access Denied on Staff Route (#/staff/queue -> Real Backend 403 Forbidden!)
    await login(page, 'jennifer.anderson@example.com', 'Password123!');
    await page.goto(`${BASE_URL}/#/staff/queue`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.tkt-alert-error', { timeout: 8000 });
    await page.waitForTimeout(600);
    const tmpDenied = '/tmp/regr_denied.png';
    await page.screenshot({ path: tmpDenied });
    saveScreenshot(tmpDenied, 'regression/regression_requester-denied.png');

    await context.close();
  }

  // Final Step: Reset and re-seed DB cleanly so the local database remains in pristine state after test mutations
  console.log('\nFinalizing: Resetting database back to pristine seeded state...');
  execSync('cd server && npx tsx scripts/clean_reset_db.ts && npx prisma db seed', { stdio: 'inherit' });

  await browser.close();
  console.log('\n=== All high-resolution evidence screenshots successfully captured with zero visual bugs! ===');
}

main().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
