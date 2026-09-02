import { test, expect } from '@playwright/test';

test.describe('Lab 2: Requester Ticket E2E Flow', () => {
  test('should select requester, create a ticket, and see it in My Tickets', async ({ page }) => {
    // 1. ไปที่หน้าแรก (หน้าเลือก Requester)
    await page.goto('http://localhost:5173');

    // 2. ตรวจสอบว่าไม่มี Inactive requester โผล่มา (Alex Turner ต้องไม่มี)
    const pageText = await page.content();
    expect(pageText).not.toContain('Alex Turner');

    // 3. เลือก Requester (เลือก Jennifer Anderson)
    const requesterSelect = page.locator('#dev-requester-select, select');
    if (await requesterSelect.isVisible()) {
      await requesterSelect.selectOption({ label: 'Jennifer Anderson' });
      await page.click('button:has-text("Continue")');
    }

    // 4. ไปที่หน้า Create Ticket
    const createBtn = page.locator('button:has-text("Create Ticket"), a:has-text("Create Ticket")');
    await createBtn.first().click();

    // 5. กรอกข้อมูลตั๋ว
    const categorySelect = page.locator('#ticket-category, select[name="categoryId"]');
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    const systemSelect = page.locator('#ticket-system, select[name="relatedSystemId"]');
    if (await systemSelect.isVisible()) {
      await systemSelect.selectOption({ index: 1 });
    }

    await page.fill('input#ticket-summary, input[name="summary"]', 'Playwright E2E Test Ticket');
    await page.fill('textarea#ticket-description, textarea[name="description"]', 'Testing end-to-end flow with Playwright.');
    
    // กด Submit
    await page.click('button:has-text("Submit")');

    // 6. ไปที่หน้า My Tickets แล้วเช็กว่ามีตั๋วที่เพิ่งสร้างแสดงอยู่
    await expect(page.getByText('Playwright E2E Test Ticket')).toBeVisible();
  });
});
