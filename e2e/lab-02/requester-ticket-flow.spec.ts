import { test, expect } from '@playwright/test';

test.describe('Lab 2: Requester Ticket E2E Flow', () => {
  test('should login as requester, create a ticket, and see it in My Tickets', async ({ page }) => {
    // 1. ไปที่หน้าแรก (หน้าเลือก Requester)
    await page.goto('http://localhost:5173');

    // 2. ตรวจสอบว่าไม่มี Inactive requester โผล่มา (Alex Turner ต้องไม่มี)
    const pageText = await page.content();
    expect(pageText).not.toContain('Alex Turner');

    // 3. เข้าใช้งานเป็น Requester (Jennifer Anderson)
    const requesterSelect = page.locator('#dev-requester-select, select');
    if (await requesterSelect.isVisible()) {
      await requesterSelect.selectOption({ label: 'Jennifer Anderson' });
      await page.click('button:has-text("Continue")');
    } else {
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill('jennifer.anderson@example.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');
      }
    }

    // 4. ไปที่หน้า Create Ticket
    const createBtn = page.locator('button:has-text("Create Ticket"), a:has-text("Create Ticket")');
    await createBtn.first().click();

    // 5. กรอกข้อมูลตั๋ว
    const categorySelect = page.locator('#ticket-category, select[name="categoryId"]');
    await categorySelect.waitFor({ state: 'visible' });
    await categorySelect.selectOption({ index: 1 });

    const systemSelect = page.locator('#ticket-system, select[name="relatedSystemId"]');
    await systemSelect.waitFor({ state: 'visible' });
    await systemSelect.selectOption({ index: 1 });

    await page.fill('input#ticket-summary, input[name="summary"]', 'Playwright E2E Test Ticket');
    await page.fill('textarea#ticket-description, textarea[name="description"]', 'Testing end-to-end flow with Playwright.');
    
    // กด Submit
    await page.click('button:has-text("Submit")');

    // ถ้าขึ้นหน้ายืนยันความสำเร็จ ให้คลิก View Ticket Details เพื่อเข้าดูตั๋ว
    const viewDetailsBtn = page.locator('button:has-text("View Ticket Details")');
    await viewDetailsBtn.waitFor({ state: 'visible', timeout: 10000 });
    await viewDetailsBtn.click();

    // 6. ไปที่หน้า My Tickets หรือหน้ารายละเอียด แล้วเช็กว่ามีตั๋วที่เพิ่งสร้างแสดงอยู่
    await expect(page.getByText('Playwright E2E Test Ticket')).toBeVisible();
  });
  test.afterAll(async () => {
    // Clean up ticket created during E2E test
    const { PrismaClient } = await import('../../server/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    try {
      await prisma.ticket.deleteMany({
        where: {
          summary: 'Playwright E2E Test Ticket',
        },
      });
    } catch (e) {
      console.error('Error cleaning up E2E ticket:', e);
    } finally {
      await prisma.$disconnect();
    }
  });
});
