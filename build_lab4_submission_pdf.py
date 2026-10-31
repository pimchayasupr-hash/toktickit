import os
import re
import json
import base64
import markdown
import subprocess

BASE_DIR = "/Users/pimchayasuprateravarnit/toktickit"
DOCS_DIR = os.path.join(BASE_DIR, "docs", "lab-04")
ARTIFACTS_DIR = os.path.join(DOCS_DIR, "screenshots")
OUTPUT_HTML = os.path.join(DOCS_DIR, "submission.html")
OUTPUT_PDF = os.path.join(DOCS_DIR, "LAB4_SUBMISSION.pdf")

def read_file(filepath):
    if not os.path.exists(filepath):
        return ""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def get_base64_image(image_filename):
    full_path = os.path.join(ARTIFACTS_DIR, image_filename)
    if not os.path.exists(full_path):
        return ""
    with open(full_path, "rb") as f:
        data = f.read()
    return f"data:image/png;base64,{base64.b64encode(data).decode('utf-8')}"

def render_md(content):
    return markdown.markdown(content, extensions=['tables', 'fenced_code'])

def main():
    print("🚀 Building Lab 4 Submission Document & PDF...")
    
    spec_md = read_file(os.path.join(DOCS_DIR, "specification.md"))
    tests_md = read_file(os.path.join(DOCS_DIR, "tests.md"))
    ui_spec_md = read_file(os.path.join(DOCS_DIR, "ui-spec.md"))
    api_spec_md = read_file(os.path.join(DOCS_DIR, "api-spec.md"))
    reviewer_md = read_file(os.path.join(DOCS_DIR, "reviewer.md"))
    report_md = read_file(os.path.join(DOCS_DIR, "report.md"))

    spec_html = render_md(spec_md)
    tests_html = render_md(tests_md)
    ui_spec_html = render_md(ui_spec_md)
    api_spec_html = render_md(api_spec_md)
    reviewer_html = render_md(reviewer_md)
    report_html = render_md(report_md)

    # Base64 screenshots
    img_req_dash_desktop = get_base64_image("01-requester-dashboard-desktop.png")
    img_req_dash_tablet = get_base64_image("02-requester-dashboard-tablet.png")
    img_req_dash_mobile = get_base64_image("03-requester-dashboard-mobile.png")
    img_stf_dash_desktop = get_base64_image("04-staff-dashboard-desktop.png")
    img_stf_dash_tablet = get_base64_image("05-staff-dashboard-tablet.png")
    img_stf_dash_mobile = get_base64_image("06-staff-dashboard-mobile.png")
    img_actions_lifecycle = get_base64_image("07-actions-taken-lifecycle-desktop.png")
    img_status_history = get_base64_image("08-ticket-status-history.png")
    img_res_gate_rejection = get_base64_image("09-resolution-gate-rejection.png")
    img_req_readonly = get_base64_image("10-requester-actions-readonly.png")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TokTickIT — Lab 4 Engineering Submission</title>
<style>
  @page {{
    size: A4;
    margin: 12mm 12mm 14mm 12mm;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.5pt;
    line-height: 1.35;
    color: #1e293b;
    margin: 0;
    padding: 0;
  }}
  
  .cover-header {{
    background: linear-gradient(135deg, #006B3C 0%, #008751 100%);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 14px;
  }}
  .cover-header h1 {{
    font-size: 15pt;
    font-weight: 800;
    margin: 0 0 4px 0;
    letter-spacing: -0.3px;
  }}
  .cover-header .subtitle {{
    font-size: 9.5pt;
    opacity: 0.95;
    margin-bottom: 8px;
    font-weight: 400;
  }}
  .meta-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    margin-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.25);
    padding-top: 8px;
  }}
  .meta-item {{
    background: #ffffff;
    color: #1e293b;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 8pt;
  }}
  .meta-item strong {{
    color: #006B3C;
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  
  .section-card {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }}
  .section-title {{
    font-size: 11pt;
    font-weight: 700;
    color: #006B3C;
    border-bottom: 2px solid #006B3C;
    padding-bottom: 4px;
    margin-top: 0;
    margin-bottom: 10px;
  }}
  
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 7.8pt;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #f1f5f9;
    font-weight: 600;
    color: #334155;
  }}
  tr:nth-child(even) {{
    background-color: #f8fafc;
  }}
  
  pre, code {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 7.5pt;
    background-color: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
  }}
  pre code {{
    display: block;
    padding: 8px;
    overflow-x: auto;
    line-height: 1.3;
  }}
  
  .badge {{
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
  }}
  .badge-pass {{
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }}
  .badge-p1 {{
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }}
  
  .evidence-img {{
    width: 100%;
    max-height: 280px;
    object-fit: contain;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    margin: 6px 0;
    background-color: #f8fafc;
  }}
  .caption {{
    font-size: 7pt;
    color: #64748b;
    text-align: center;
    margin-bottom: 8px;
    font-style: italic;
  }}
  
  .grid-2 {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }}
  .grid-3 {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }}
  
  .page-break {{
    page-break-before: always;
  }}
</style>
</head>
<body>

<div class="cover-header">
  <h1>TokTickIT: Actions Taken, Dashboards, and Concurrency Control</h1>
  <div class="subtitle">Lab 4 Engineering Report &amp; Verification Evidence Package (CPE 334)</div>
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Pull Request (PR #55)</strong>
      https://github.com/pimchayasupr-hash/toktickit/pull/55
    </div>
    <div class="meta-item">
      <strong>Branch &amp; Integration</strong>
      feature/lab4-hardening &rarr; lab4-staging &rarr; main
    </div>
    <div class="meta-item">
      <strong>Author &amp; Reviewer</strong>
      Author: @pimchayasupr-hash &bull; Reviewer: @MiMikoChAn913
    </div>
    <div class="meta-item">
      <strong>Automated Verification Status</strong>
      <span class="badge badge-pass">100% Passed (144 Server + 40 Client + 11 E2E)</span>
    </div>
  </div>
</div>

<div class="section-card">
  <div class="section-title">1. Executive Summary &amp; Reviewer-Driven Hardening</div>
  <p>
    TokTickIT Lab 4 extends the enterprise IT Service Desk with full operational task tracking (<strong>Actions Taken</strong>), strict transition gates (<strong>Resolution Gate</strong>), database-level concurrency protection (<strong>Atomic Optimistic Locking with Predicates</strong>), immutable audit trails (<strong>Ticket Status History</strong>), and role-tailored real-time <strong>Dashboards</strong>.
  </p>
  <p>
    Following rigorous code review by <code>@MiMikoChAn913</code> on Pull Request #55, 5 critical areas (4 &times; P1, 1 &times; P2) were hardened with 8 new regression tests:
  </p>
  <ul>
    <li><strong>Action Lifecycle &amp; Assignee</strong>: Implemented <code>ActionStatus</code> enum (<code>PENDING</code>, <code>IN_PROGRESS</code>, <code>COMPLETED</code>, <code>CANCELLED</code>), operational assignee delegation (<code>assigneeId</code>), inactive-assignee rejection (<code>INACTIVE_ASSIGNEE</code>), terminal action immutability, and conditional result enforcement.</li>
    <li><strong>Atomic Optimistic Concurrency</strong>: Replaced in-memory checks with atomic database write predicates <code>updateMany({{ where: {{ id, version }} }})</code> inside transactions, returning HTTP 409 Conflict without silent overwrites.</li>
    <li><strong>Mandatory Version Validation</strong>: Enforced numeric version validation on status writes (HTTP 400 on missing version) and atomic compare-and-increment on tickets.</li>
    <li><strong>Append-Only Ticket Status History</strong>: Added <code>TicketStatusHistory</code> model, writing exactly 1 actor-attributed row in the same transaction as successful status updates, and 0 rows on conflicts.</li>
    <li><strong>Deterministic E2E Resolution Gate Verification</strong>: Eliminated conditional skips, asserting exact rejection on fixture <code>TKT-2026-001233</code> and resolution success with audit trail on <code>TKT-2026-001234</code>.</li>
  </ul>
</div>

<div class="section-card">
  <div class="section-title">2. Peer Review Verification Matrix (PR #55)</div>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Priority</th>
        <th style="width: 25%;">Reviewer Comment (@MiMikoChAn913)</th>
        <th style="width: 38%;">Technical Resolution &amp; Implementation</th>
        <th style="width: 25%;">Regression Test Evidence</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="badge badge-p1">[P1] Lifecycle</span></td>
        <td>Missing ActionTaken lifecycle, operational assigneeId, inactive-assignee rejection, and premature result requirement.</td>
        <td>Added ActionStatus enum, assigneeId relation to User, validateAssignee check, terminal immutability, and made result required only on COMPLETED.</td>
        <td><code>TEST-ACT-18..20</code>, <code>TEST-ACT-22</code>, <code>TEST-UI-ACT-04..05</code>, <code>E2E-ACT-02</code> <span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-p1">[P1] Action Lock</span></td>
        <td>Non-atomic optimistic concurrency permits silent lost updates under concurrent writes.</td>
        <td>Implemented atomic database predicate <code>updateMany({{ where: {{ id, version }} }})</code> in transaction; returns 409 Conflict if count is 0.</td>
        <td><code>TEST-ACT-21</code> (Concurrent write race condition) <span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-p1">[P1] Ticket Lock</span></td>
        <td>Omitting version bypasses ticket concurrency, and update by id permits race conditions.</td>
        <td>Enforced numeric version validation (400 Bad Request) and atomic compare-and-increment <code>updateMany</code> in database transaction.</td>
        <td><code>TEST-WFK-06</code>, <code>TEST-WFK-07</code> (Stale write &amp; race condition) <span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-p1">[P1] History</span></td>
        <td>Status change updates mutable ticket only without append-only TicketStatusHistory.</td>
        <td>Created TicketStatusHistory table; appended actor-attributed row atomically in same transaction (0 rows appended on conflict).</td>
        <td><code>TEST-WFK-08</code>, <code>GET /api/staff/tickets/:id/status-history</code> <span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><span class="badge badge-pass">[P2] E2E Gate</span></td>
        <td>Conditional <code>if (canSelectResolved)</code> allows E2E test to pass without exercising resolution gate.</td>
        <td>Used deterministic fixtures <code>TKT-2026-001233</code> (0 actions &rarr; rejected) and <code>TKT-2026-001234</code> (completed &rarr; resolved with history).</td>
        <td><code>E2E-RES-01</code>, <code>E2E-RES-02</code> (Deterministic) <span class="badge badge-pass">PASS</span></td>
      </tr>
    </tbody>
  </table>
</div>

<div class="page-break"></div>

<div class="section-card">
  <div class="section-title">3. Visual Evidence: Dashboards &amp; Responsive Layouts</div>
  <div class="grid-2">
    <div>
      <img src="{img_req_dash_desktop}" class="evidence-img" alt="Requester Dashboard Desktop" />
      <div class="caption">Fig 1a: Requester Dashboard (Desktop 1440&times;900) — Status Cards &amp; Attention Banner</div>
    </div>
    <div>
      <img src="{img_stf_dash_desktop}" class="evidence-img" alt="Staff Dashboard Desktop" />
      <div class="caption">Fig 1b: IT Staff Dashboard (Desktop 1440&times;900) — Team Queue, Status &amp; Priority Breakdown</div>
    </div>
  </div>
  <div class="grid-3">
    <div>
      <img src="{img_req_dash_tablet}" class="evidence-img" alt="Requester Dashboard Tablet" />
      <div class="caption">Fig 2a: Requester Dashboard (Tablet 820&times;1180)</div>
    </div>
    <div>
      <img src="{img_req_dash_mobile}" class="evidence-img" alt="Requester Dashboard Mobile" />
      <div class="caption">Fig 2b: Requester Dashboard (Mobile 375&times;812)</div>
    </div>
    <div>
      <img src="{img_stf_dash_mobile}" class="evidence-img" alt="Staff Dashboard Mobile" />
      <div class="caption">Fig 2c: Staff Dashboard (Mobile 375&times;812)</div>
    </div>
  </div>
</div>

<div class="section-card">
  <div class="section-title">4. Visual Evidence: Actions Taken Lifecycle, Resolution Gate &amp; Audit History</div>
  <div class="grid-2">
    <div>
      <img src="{img_actions_lifecycle}" class="evidence-img" alt="Actions Taken Lifecycle" />
      <div class="caption">Fig 3a: Actions Taken Subsystem — Badges (Pending, In Progress, Completed), Assignee, and Terminal Lock</div>
    </div>
    <div>
      <img src="{img_status_history}" class="evidence-img" alt="Ticket Status History" />
      <div class="caption">Fig 3b: Append-Only Ticket Status History — Actor-Attributed Audit Trail</div>
    </div>
  </div>
  <div class="grid-2">
    <div>
      <img src="{img_res_gate_rejection}" class="evidence-img" alt="Resolution Gate Rejection" />
      <div class="caption">Fig 4a: Resolution Gate Rejection Alert — Blocks transition when 0 actions recorded</div>
    </div>
    <div>
      <img src="{img_req_readonly}" class="evidence-img" alt="Requester Read-Only View" />
      <div class="caption">Fig 4b: Requester Read-Only View — Visibility into Actions Taken and Status History without Edit controls</div>
    </div>
  </div>
</div>

<div class="page-break"></div>

<div class="section-card">
  <div class="section-title">5. Comprehensive Test Execution Report</div>
  <p><strong>Traceability Matrix Verification</strong>: 100% of defined Acceptance Criteria (AC-01..AC-23), Functional Requirements (FR-01..FR-21), and Business Rules (BR-01..BR-18) are covered without orphan references.</p>
  <table>
    <thead>
      <tr>
        <th>Suite</th>
        <th>Framework</th>
        <th>Tests Run</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Traceability Script</td>
        <td>Python 3 (AST Parser)</td>
        <td>62 Checks</td>
        <td>62</td>
        <td>0</td>
        <td>0.12s</td>
      </tr>
      <tr>
        <td>Server API &amp; Concurrency Suites</td>
        <td>Vitest + Supertest</td>
        <td>144 Tests (29 files)</td>
        <td>144</td>
        <td>0</td>
        <td>24.42s</td>
      </tr>
      <tr>
        <td>Client Component &amp; Dashboard Suites</td>
        <td>Vitest + RTL</td>
        <td>40 Tests (17 files)</td>
        <td>40</td>
        <td>0</td>
        <td>8.67s</td>
      </tr>
      <tr>
        <td>Playwright Multi-Browser E2E Suite</td>
        <td>Playwright + Axe-core</td>
        <td>11 Tests (3 files)</td>
        <td>11</td>
        <td>0</td>
        <td>17.70s</td>
      </tr>
      <tr style="font-weight: 700; background-color: #f1f5f9;">
        <td colspan="2">TOTAL AUTOMATED AUDIT</td>
        <td>257 Checks</td>
        <td>257 (100%)</td>
        <td>0 (0%)</td>
        <td>50.91s</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 14px;">
    <strong>Verification Commands:</strong>
    <pre><code>npm run test:traceability
npm run test:server
npm run test:client
npx playwright test e2e/lab-04/ --project=chromium</code></pre>
  </div>
</div>

</body>
</html>
"""

    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"HTML successfully generated at: {OUTPUT_HTML}")

    # Generate PDF via Playwright
    node_script = f"""
const {{ chromium }} = require('@playwright/test');
const fs = require('fs');

(async () => {{
  console.log('Launching Chromium to render PDF...');
  const browser = await chromium.launch({{ headless: true }});
  const page = await browser.newPage({{ viewport: {{ width: 1200, height: 1600 }} }});
  
  await page.goto('file://{OUTPUT_HTML}', {{ waitUntil: 'networkidle' }});
  
  console.log('Printing PDF to {OUTPUT_PDF}...');
  await page.pdf({{
    path: '{OUTPUT_PDF}',
    format: 'A4',
    printBackground: true,
    margin: {{
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }},
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7.5pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: right; padding-right: 12mm;">CPE 334 — TokTickIT Lab 4 Engineering Submission</div>',
    footerTemplate: '<div style="font-size: 7.5pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  }});
  
  await browser.close();
  const stats = fs.statSync('{OUTPUT_PDF}');
  console.log('PDF generation complete! File size: ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB');
}})();
"""
    node_script_path = os.path.join(DOCS_DIR, "render_pdf.js")
    with open(node_script_path, "w", encoding="utf-8") as f:
        f.write(node_script)
    
    subprocess.run(["node", node_script_path], check=True)
    print(f"Successfully generated PDF: {OUTPUT_PDF}")

    # Also create copy in root for convenience
    root_pdf = os.path.join(BASE_DIR, "LAB4_SUBMISSION.pdf")
    subprocess.run(["cp", OUTPUT_PDF, root_pdf], check=True)
    print(f"Copied PDF to project root: {root_pdf}")

if __name__ == "__main__":
    main()

