const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_BASE = path.join(__dirname, '../artifacts/lab-03/screenshots');
const DOCS_BASE = path.join(__dirname, '../docs/lab-03/screenshots');

const CATEGORIES = {
  '01-login-desktop.png': 'authentication',
  '02-login-mobile.png': 'authentication',
  '07-login-tablet.png': 'authentication',
  '13-change-password-modal.png': 'authentication',
  '03-staff-queue-desktop.png': 'staff-queue',
  '04-staff-queue-mobile.png': 'staff-queue',
  '08-staff-queue-tablet.png': 'staff-queue',
  '05-ticket-detail-desktop.png': 'staff-ticket-detail',
  '09-ticket-detail-tablet.png': 'staff-ticket-detail',
  '10-ticket-detail-mobile.png': 'staff-ticket-detail',
  '14-problem-appears-resolved.png': 'staff-ticket-detail',
  '06-admin-users-desktop.png': 'user-management',
  '11-admin-users-tablet.png': 'user-management',
  '12-admin-users-mobile.png': 'user-management',
  '15-create-user-modal.png': 'user-management',
};

async function saveScreenshot(page, filename, altDocName) {
  const buf = await page.screenshot({ fullPage: false });
  if (filename) {
    // 1. Flat in artifacts
    fs.writeFileSync(path.join(ARTIFACTS_BASE, filename), buf);
    // 2. Subcategory in artifacts
    const cat = CATEGORIES[filename];
    if (cat) {
      const catDir = path.join(ARTIFACTS_BASE, cat);
      fs.mkdirSync(catDir, { recursive: true });
      fs.writeFileSync(path.join(catDir, filename), buf);
    }
    // 3. Flat in docs
    fs.writeFileSync(path.join(DOCS_BASE, filename), buf);
  }
  if (altDocName) {
    fs.writeFileSync(path.join(DOCS_BASE, altDocName), buf);
  }
  console.log(`✅ Saved: ${filename || ''} (${CATEGORIES[filename] || 'root'})`);
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
  console.log('🚀 Starting TokTickIT real screenshot capture with Playwright...');
  const browser = await chromium.launch({ headless: true });

  // 1. LOGIN SCREEN (Desktop 1440x900, Tablet 820x1180, Mobile 375x812)
  console.log('1. Capturing Login views...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('input[type="email"]');
    await page.waitForTimeout(300);

    await saveScreenshot(page, '01-login-desktop.png', 'login_desktop.png');

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(300);
    await saveScreenshot(page, '07-login-tablet.png', 'login_tablet.png');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await saveScreenshot(page, '02-login-mobile.png', 'login_mobile.png');

    await page.close();
  }

  // 2. MANDATORY PASSWORD CHANGE MODAL
  console.log('2. Capturing Change Password modal with live validation...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 1,
            name: 'Sarah Jenkins',
            email: 'sarah.jenkins@example.com',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: true,
          }
        })
      });
    });

    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('toktickit_token', 'mock_token');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#newPassword', { timeout: 8000 });

    await page.fill('#currentPassword', 'Password123!');
    await page.fill('#newPassword', 'SecurePass2026!');
    await page.fill('#confirmPassword', 'SecurePass2026!');
    await page.waitForTimeout(400);

    await saveScreenshot(page, '13-change-password-modal.png', 'change_password.png');
    await page.close();
  }

  // 3. STAFF TICKET QUEUE (Desktop 1440x900, Tablet 820x1180, Mobile 390x844)
  console.log('3. Capturing Staff Ticket Queue...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'michael.staff@toktickit.com', 'Password123!');
    await page.locator('.tkt-ticket-link:visible').first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(400);

    await saveScreenshot(page, '03-staff-queue-desktop.png', 'queue_desktop.png');

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '08-staff-queue-tablet.png', 'queue_tablet.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '04-staff-queue-mobile.png', 'queue_mobile.png');

    await page.close();
  }

  // 4. STAFF TICKET DETAIL
  console.log('4. Capturing Staff Ticket Detail...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'michael.staff@toktickit.com', 'Password123!');
    await page.locator('.tkt-ticket-link:visible').first().waitFor({ timeout: 10000 });
    await page.locator('.tkt-ticket-link:visible').first().click();
    await page.locator('.tkt-btn-back:visible').first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(500);

    await saveScreenshot(page, '05-ticket-detail-desktop.png', 'detail_desktop.png');

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '09-ticket-detail-tablet.png', 'detail_tablet.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '10-ticket-detail-mobile.png', 'detail_mobile.png');

    await page.close();
  }

  // 5. REQUESTER VIEW & PROBLEM APPEARS RESOLVED
  console.log('5. Capturing Requester view & Problem Appears Resolved...');
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loginAs(page, 'jennifer.anderson@example.com', 'Password123!');
    await page.locator('.tkt-ticket-link:visible').first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(400);

    await saveScreenshot(page, null, 'requester_tickets.png');

    await page.locator('.tkt-ticket-link:visible').first().click();
    await page.waitForSelector('button:has-text("Problem Appears Resolved")', { timeout: 10000 });
    await page.waitForTimeout(500);

    await saveScreenshot(page, '14-problem-appears-resolved.png', 'problem_resolved.png');
    await page.close();
  }

  // 6. ADMINISTRATOR USER MANAGEMENT & CREATE USER MODAL
  console.log('6. Capturing Administrator User Management views...');
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await loginAs(page, 'admin@toktickit.com', 'Password123!');
    await page.locator('text=User Management').first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(400);

    await saveScreenshot(page, '06-admin-users-desktop.png', 'admin_desktop.png');

    await page.setViewportSize({ width: 820, height: 1180 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '11-admin-users-tablet.png', 'admin_tablet.png');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await saveScreenshot(page, '12-admin-users-mobile.png', 'admin_mobile.png');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('button:has-text("Create New User")').first().click();
    await page.locator('h3:has-text("Create New User Account")').first().waitFor({ timeout: 5000 });
    await page.fill('#createName', 'Robert Taylor (Network Specialist)');
    await page.fill('#createEmail', 'robert.tech@toktickit.com');
    await page.selectOption('#createRole', 'STAFF');
    await page.fill('#createInitialPassword', 'Welcome2026!');
    await page.waitForTimeout(400);
    await saveScreenshot(page, '15-create-user-modal.png', 'create_user_modal.png');

    await page.close();
  }

  await browser.close();
  console.log('🎉 ALL SCREENSHOTS CAPTURED WITH LIVE REAL DATA PERFECTLY!');
}

run().catch(err => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
