
const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  console.log('Launching Chromium to render PDF...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  
  await page.goto('file:///Users/pimchayasuprateravarnit/toktickit/docs/lab-03/submission.html', { waitUntil: 'networkidle' });
  
  console.log('Printing PDF to /Users/pimchayasuprateravarnit/toktickit/docs/lab-03/LAB3_SUBMISSION.pdf...');
  await page.pdf({
    path: '/Users/pimchayasuprateravarnit/toktickit/docs/lab-03/LAB3_SUBMISSION.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '14mm',
      right: '14mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: right; padding-right: 14mm;">CPE 334 — TokTickIT Lab 3 Engineering Submission</div>',
    footerTemplate: '<div style="font-size: 8pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });
  
  await browser.close();
  const stats = fs.statSync('/Users/pimchayasuprateravarnit/toktickit/docs/lab-03/LAB3_SUBMISSION.pdf');
  console.log('PDF generation complete! File size: ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB');
})();
