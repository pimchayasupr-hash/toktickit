const fs = require('fs');

let html = fs.readFileSync('docs/lab-03/submission.html', 'utf8');

// 1. Remove @bottom-center in CSS to eliminate duplicate footer
html = html.replace(/@bottom-center\s*\{[^}]+\}/g, '');

// 2. Adjust margins and sizes for compact <=45 page budget
html = html.replace(
  /margin:\s*[0-9]+mm\s*[0-9]+mm\s*[0-9]+mm\s*[0-9]+mm;/,
  'margin: 12mm 10mm 12mm 10mm;'
);

// 3. Compact typography and styles in <style>
const oldStyleRegex = /<style>[\s\S]*?<\/style>/;
const compactStyle = `<style>
  @page {
    size: A4;
    margin: 12mm 10mm 12mm 10mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8pt;
    line-height: 1.32;
    color: #1e293b;
    margin: 0;
    padding: 0;
  }
  
  .cover-header {
    background: linear-gradient(135deg, #005a36 0%, #008751 100%);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 6px;
    margin-bottom: 12px;
    box-shadow: 0 2px 6px rgba(0, 90, 54, 0.12);
  }
  .cover-header h1 {
    font-size: 15pt;
    font-weight: 800;
    margin: 0 0 4px 0;
    letter-spacing: -0.3px;
  }
  .cover-header .subtitle {
    font-size: 9pt;
    opacity: 0.92;
    margin-bottom: 10px;
    font-weight: 400;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 14px;
    margin-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.25);
    padding-top: 8px;
  }
  .meta-item {
    background: #ffffff;
    color: #1e293b;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 7.5pt;
    border: 1px solid rgba(0,0,0,0.08);
  }
  .meta-item strong {
    color: #005a36;
  }
  
  .part-container {
    page-break-before: always;
    padding-top: 8px;
  }
  .part-container:first-of-type {
    page-break-before: avoid;
  }
  
  h1.part-title {
    font-size: 12pt;
    font-weight: 700;
    color: #005a36;
    border-bottom: 2px solid #005a36;
    padding-bottom: 3px;
    margin-top: 0;
    margin-bottom: 8px;
    text-transform: none;
    letter-spacing: -0.2px;
  }
  
  h2 {
    font-size: 9.5pt;
    color: #005a36;
    margin-top: 8px;
    margin-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2px;
  }
  h3 {
    font-size: 8.5pt;
    color: #0f172a;
    margin-top: 6px;
    margin-bottom: 2px;
  }
  h4 {
    font-size: 8pt;
    color: #334155;
    margin-top: 4px;
    margin-bottom: 2px;
  }
  
  p, li {
    font-size: 8pt;
    color: #334155;
    margin-bottom: 3px;
    line-height: 1.32;
  }
  ul, ol {
    margin-top: 2px;
    margin-bottom: 6px;
    padding-left: 18px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 10px 0;
    font-size: 7.5pt;
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 3px 5px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background-color: #005a36;
    color: #ffffff;
    font-weight: 600;
  }
  tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  
  pre, code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }
  code {
    font-size: 7.5pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 3px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }
  pre {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-left: 3px solid #005a36;
    border-radius: 4px;
    padding: 4px 6px;
    font-size: 7pt;
    line-height: 1.25;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 4px 0 6px 0;
  }
  pre code {
    background: transparent;
    padding: 0;
    border: none;
    color: #0f172a;
  }
  
  .badge {
    display: inline-block;
    padding: 1px 5px;
    border-radius: 10px;
    font-size: 7pt;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge-pass { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .badge-done { background: #238636; color: #ffffff; }
  .badge-active { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  
  .callout {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 3px solid #16a34a;
    border-radius: 4px;
    padding: 6px 10px;
    margin: 6px 0 8px 0;
    font-size: 7.5pt;
  }
  .callout-title {
    font-weight: 700;
    color: #166534;
    margin-bottom: 2px;
  }
  
  .img-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 4px;
    margin: 6px 0 8px 0;
    text-align: center;
    page-break-inside: avoid;
  }
  .img-card img {
    max-width: 100%;
    height: auto;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
    display: block;
    margin: 0 auto;
  }
  .img-caption {
    font-size: 7pt;
    color: #475569;
    margin-top: 4px;
    font-weight: 500;
  }
  
  .img-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 6px 0 8px 0;
    page-break-inside: avoid;
  }
  .img-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    margin: 6px 0 8px 0;
    page-break-inside: avoid;
  }
  
  .checklist-table th { background: #005a36; }
  .checklist-pass { color: #166534; font-weight: 700; }
</style>`;

html = html.replace(oldStyleRegex, compactStyle);

// 4. Ensure repo link nowrap and production branch text
html = html.replace(
  /<a href="https:\/\/github\.com\/pimchayasupr-hash\/toktickit"[^>]*>[\s\S]*?github\.com\/pimchayasupr-hash\/toktickit[\s\S]*?<\/a>/,
  '<a href="https://github.com/pimchayasupr-hash/toktickit" style="color:#005a36; white-space:nowrap;"><span style="white-space:nowrap;">https://github.com/pimchayasupr-hash/toktickit</span></a>'
);

html = html.replace(
  /<strong>Production Branch:<\/strong>[^<]+<code>[^<]+<\/code>\)/,
  '<strong>Production Branch:</strong> main (latest, see <a href="https://github.com/pimchayasupr-hash/toktickit/tree/main" style="color:#005a36;">commit link</a>)'
);

// 5. Update test totals on cover
html = html.replace(
  /146 \/ 146 PASS \(Server 91\/91, Client 28\/28, E2E 27\/27\)/,
  '94 / 94 PASS (Server Vitest 67/67, Client Vitest 15/15, Playwright E2E 12/12)'
);
html = html.replace(
  /100% \(AC-01\.\.AC-22, FR-01\.\.FR-21, BR-01\.\.BR-17\)/,
  '100% (AC-01..AC-23, FR-01..FR-21, BR-01..BR-18)'
);

// 6. Replace 404 project link with working projects link
html = html.replace(
  /https:\/\/github\.com\/users\/pimchayasupr-hash\/projects\/1/g,
  'https://github.com/pimchayasupr-hash?tab=projects'
);

// 7. Remove the 9 duplicate image cards in Part 9 (lines between table and Completed Visual Quality Checklist)
const p9RemainingImagesRegex = /<\/table>\s*<div class="img-grid-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<h2>3\. Completed Visual Quality Checklist<\/h2>/;
const p9RemainingImagesReplacement = `</table>\n\n  <h2>3. Completed Visual Quality Checklist</h2>`;
html = html.replace(p9RemainingImagesRegex, p9RemainingImagesReplacement);

// 8. Fix Escape key descriptions in UI checklist and Screen Modes (BR-02 non-dismissibility)
html = html.replace(
  'Pressing <code>Escape</code> closes Create User, Edit User, Reset Password, and Change Password modals.',
  'Pressing <code>Escape</code> closes Create User, Edit User, and Reset Password modals. Mandatory Change Password modal is non-dismissible (BR-02).'
);
html = html.replace(
  'Modals trap focus and allow dismissal via <code>Esc</code> key.',
  'Modals trap focus. Create/Edit/Reset modals allow dismissal via <code>Esc</code> key, while mandatory Change Password modal is non-dismissible (BR-02).'
);

// 9. In Part 1, add PR #42 to PR list table if not already present
if (!html.includes('PR #42')) {
  const prTableTbodyEnd = '</tbody>\n  </table>';
  const pr42Row = `      <tr>
        <td><strong>#42</strong></td>
        <td>Lab 3 Final Consistency &amp; Evidence</td>
        <td><code>fix/lab3-consistency</code> &rarr; <code>lab3-staging</code></td>
        <td>@supa-gif173 / @Beethoven190</td>
        <td><strong>@peer</strong></td>
        <td>2026-10-02 (Pending Review)</td>
        <td><a href="https://github.com/pimchayasupr-hash/toktickit/pull/42">PR #42</a></td>
      </tr>\n    ` + prTableTbodyEnd;
  html = html.replace(prTableTbodyEnd, pr42Row);
}

fs.writeFileSync('docs/lab-03/submission.html', html, 'utf8');
console.log('docs/lab-03/submission.html updated successfully.');
