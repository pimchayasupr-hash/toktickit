const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching Chromium to render PDF...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  
  const htmlPath = path.resolve(__dirname, 'submission.html');
  console.log(`Loading HTML from: file://${htmlPath}`);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  
  const docsPdfPath = path.resolve(__dirname, 'LAB3_SUBMISSION.pdf');
  const rootPdfPath = path.resolve(__dirname, '../../LAB3_SUBMISSION.pdf');
  
  console.log(`Printing PDF to ${docsPdfPath}...`);
  await page.pdf({
    path: docsPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '10mm',
      right: '10mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7.5pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: right; padding-right: 10mm;">CPE 334 — TokTickIT Lab 3 Engineering Submission</div>',
    footerTemplate: '<div style="font-size: 7.5pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });
  
  await browser.close();
  
  // Copy identical file to repo root
  fs.copyFileSync(docsPdfPath, rootPdfPath);
  
  const stats = fs.statSync(docsPdfPath);
  console.log(`PDF generation complete! File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Copied identical PDF to: ${rootPdfPath}`);
})();
