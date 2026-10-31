const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

function getImageDataUri(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Image not found: ${fullPath}`);
    return '';
  }
  const ext = path.extname(fullPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  const b64 = fs.readFileSync(fullPath).toString('base64');
  return `data:${mime};base64,${b64}`;
}

async function buildPdf() {
  console.log('Building full Lab 4 Submission following Handout §14 EXACTLY...');

  // Load all comprehensive evidence screenshots
  const imgStaffDesktop = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_overview_desktop.png');
  const imgStaffDrilldown = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_drilldown_desktop.png');
  const imgStaffTablet = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_overview_tablet.png');
  const imgStaffMobile = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_overview_mobile.png');
  const imgStaffLoading = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_state_loading.png');
  const imgStaffEmpty = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_state_empty.png');
  const imgStaffForbidden = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_state_forbidden.png');
  const imgStaffError = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_state_error.png');

  const imgActLifecycle = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_lifecycle_desktop.png');
  const imgActCreate = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_create-form_desktop.png');
  const imgActValidation = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_validation-error_desktop.png');
  const imgActInactive = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_inactive-rejection_desktop.png');
  const imgActEdit = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_edit-form_desktop.png');
  const imgActTablet = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_tablet.png');
  const imgActMobile = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_mobile.png');
  const imgActConflict = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_conflict-409_desktop.png');
  const imgActReadonly = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_requester-readonly_desktop.png');

  const imgWfResolution = getImageDataUri('artifacts/lab-04/screenshots/ticket-workflow/workflow_resolution-gate-rejection_desktop.png');
  const imgWfTransition = getImageDataUri('artifacts/lab-04/screenshots/ticket-workflow/workflow_transition_desktop.png');
  const imgWfHistory = getImageDataUri('artifacts/lab-04/screenshots/ticket-workflow/workflow_status-history_desktop.png');
  const imgWfReqHistory = getImageDataUri('artifacts/lab-04/screenshots/ticket-workflow/workflow_requester-history_desktop.png');
  const imgWfTablet = getImageDataUri('artifacts/lab-04/screenshots/ticket-workflow/workflow_tablet.png');
  const imgWfMobile = getImageDataUri('artifacts/lab-04/screenshots/ticket-workflow/workflow_mobile.png');

  const imgReqDesktop = getImageDataUri('artifacts/lab-04/screenshots/requester-dashboard/requester-dashboard_overview_desktop.png');
  const imgReqDrilldown = getImageDataUri('artifacts/lab-04/screenshots/requester-dashboard/requester-dashboard_drilldown_desktop.png');
  const imgReqTablet = getImageDataUri('artifacts/lab-04/screenshots/requester-dashboard/requester-dashboard_overview_tablet.png');
  const imgReqMobile = getImageDataUri('artifacts/lab-04/screenshots/requester-dashboard/requester-dashboard_overview_mobile.png');

  const imgRegLogin = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_login.png');
  const imgRegMyTickets = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_my-tickets.png');
  const imgRegTicketDetail = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_ticket-detail.png');
  const imgRegAttachments = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_attachments.png');
  const imgRegComments = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_public-comments.png');
  const imgRegAdmin = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_admin-users.png');
  const imgRegInternalNotes = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_internal-notes.png');
  const imgRegDenied = getImageDataUri('artifacts/lab-04/screenshots/regression/regression_requester-denied.png');
  const imgGithubIssues = getImageDataUri('artifacts/lab-04/screenshots/github/github-issues-done.png');

  const metricsVsDbText = fs.readFileSync(path.resolve(__dirname, '../artifacts/lab-04/metrics-vs-db.txt'), 'utf8');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TokTickIT — Lab 4 Official Engineering Submission</title>
<style>
  @page {
    size: A4;
    margin: 11mm 11mm 11mm 11mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.1pt;
    line-height: 1.28;
    color: #1e293b;
    margin: 0;
    padding: 0;
  }
  a {
    color: #006B3C;
    text-decoration: underline;
  }

  .cover-header {
    background: linear-gradient(135deg, #006B3C 0%, #008751 100%);
    color: #ffffff;
    padding: 9px 14px;
    border-radius: 8px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  .cover-header h1 {
    font-size: 13.5pt;
    font-weight: 800;
    margin: 0 0 2px 0;
    letter-spacing: -0.3px;
  }
  .cover-header .subtitle {
    font-size: 8.6pt;
    opacity: 0.95;
    margin-bottom: 6px;
    font-weight: 400;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px 10px;
    margin-top: 5px;
    border-top: 1px solid rgba(255,255,255,0.25);
    padding-top: 5px;
  }
  .meta-item {
    background: #ffffff;
    color: #1e293b;
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 7.5pt;
  }
  .meta-item strong {
    color: #006B3C;
    display: block;
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .page-break {
    page-break-before: always;
  }
  .part-section {
    margin-bottom: 10px;
  }
  .part-title {
    font-size: 11.5pt;
    font-weight: 800;
    color: #006B3C;
    border-bottom: 2px solid #006B3C;
    padding-bottom: 3px;
    margin-top: 0;
    margin-bottom: 7px;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }
  .part-subtitle {
    font-size: 8.6pt;
    font-weight: 700;
    color: #0f172a;
    margin-top: 7px;
    margin-bottom: 4px;
    border-left: 3px solid #008751;
    padding-left: 6px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 3px 0;
    font-size: 6.9pt;
    line-height: 1.2;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 2.5px 5px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #334155;
  }
  tr:nth-child(even) {
    background-color: #f8fafc;
  }

  pre, code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 6.8pt;
    background-color: #f1f5f9;
    padding: 1px 3px;
    border-radius: 3px;
  }
  pre {
    padding: 4px 7px;
    overflow-x: auto;
    line-height: 1.15;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    margin: 3px 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .badge {
    display: inline-block;
    padding: 1.5px 5px;
    border-radius: 4px;
    font-size: 6.6pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-pass {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
  .badge-pending {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }
  .badge-na {
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .evidence-figure {
    width: 96%;
    margin: 5px auto 7px auto;
    text-align: center;
    page-break-inside: avoid;
  }
  .evidence-img {
    width: 100%;
    max-height: 295px;
    object-fit: contain;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background-color: #f8fafc;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    display: block;
    margin: 0 auto;
  }
  .evidence-img-tall {
    max-height: 365px;
  }
  .evidence-img-compact {
    max-height: 215px;
  }
  .caption {
    font-size: 7pt;
    color: #475569;
    text-align: center;
    margin-top: 3px;
    font-style: italic;
    line-height: 1.22;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
</style>
</head>
<body>

<!-- ========================================================================== -->
<!-- PAGE 1: Cover + Answer Part 1 (Git Graph, Branch Flow, Tree, .gitignore)   -->
<!-- ========================================================================== -->
<div class="cover-header">
  <h1>TokTickIT: Actions Taken, Dashboards, and Concurrency Control</h1>
  <div class="subtitle">CPE 334 Introduction to Software Engineering in the Age of AI Agents &bull; Official Final Engineering Submission &bull; <a href="https://github.com/pimchayasupr-hash/toktickit" style="color:#ffffff;">github.com/pimchayasupr-hash/toktickit</a></div>
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Pull Requests &amp; Repository Links</strong>
      <a href="https://github.com/pimchayasupr-hash/toktickit/pull/55">PR #55</a> (<code>84720dc</code>) &bull; <a href="https://github.com/pimchayasupr-hash/toktickit/pull/56">PR #56</a> (<code>86f4516</code>) &bull; <a href="https://github.com/pimchayasupr-hash/toktickit/pull/57">PR #57</a> (<code>83b3cbc</code>) &bull; <a href="https://github.com/pimchayasupr-hash/toktickit/pull/58">PR #58</a> (<code>lab4-staging &rarr; main</code>)
    </div>
    <div class="meta-item">
      <strong>Branch Architecture &amp; Staging Flow</strong>
      <code>feature/lab4-*</code> &amp; <code>hotfix/lab4-*</code> &rarr; <code>lab4-staging</code> &rarr; <code>main</code> (Reviewed by @MiMikoChAn913 &amp; @supa-gif173)
    </div>
    <div class="meta-item">
      <strong>Author &amp; Peer Reviewers</strong>
      Author: <a href="https://github.com/pimchayasupr-hash">@pimchayasupr-hash</a> &bull; Reviewers: <a href="https://github.com/MiMikoChAn913">@MiMikoChAn913</a>, <a href="https://github.com/supa-gif173">@supa-gif173</a>
    </div>
    <div class="meta-item">
      <strong>Automated Verification Harness (Committed Raw Logs)</strong>
      <span class="badge badge-pass">196 Unique Tests (220 Runs: 144 Server + 40 Client + 36 Playwright E2E) 100% PASS</span>
    </div>
  </div>
</div>

<div class="part-section">
  <div class="part-title">Answer Part 1: Git Use with Engineering Workflow (10 pt)</div>
  <p style="margin: 2px 0 4px 0;">
    The TokTickIT engineering workflow enforces Specification-Driven Development (Spec DD), Test-Driven Development (Test DD), feature branch isolation, and peer review governance (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/reviewer.md">docs/lab-04/reviewer.md</a>). Core Lab 4 features were merged via <a href="https://github.com/pimchayasupr-hash/toktickit/pull/55">PR #55</a> (<code>feature/lab4-hardening &rarr; lab4-staging</code>), <a href="https://github.com/pimchayasupr-hash/toktickit/pull/56">PR #56</a> (<code>lab4-staging &rarr; main</code>), and <a href="https://github.com/pimchayasupr-hash/toktickit/pull/57">PR #57</a> (<code>hotfix/lab4-icon-dimensions-and-audit &rarr; lab4-staging</code>, merged at <code>83b3cbc</code>).
  </p>

  <div class="part-subtitle">1.1 Verbatim Git Commit Log Graph (lab4-staging &amp; main)</div>
  <pre><code>*   83b3cbc (HEAD -> lab4-staging, origin/lab4-staging) Merge pull request #57 from pimchayasupr-hash/hotfix/lab4-icon-dimensions-and-audit
|\  
| * a2f008a (origin/hotfix/lab4-icon-dimensions-and-audit) docs(reviewer,pdf): record @supa-gif173 approval review PRR_kwDOTzBGN88AAAABVROROQ on PR #57
| * adeed3e fix(audit): resolve all QA review items, unify dashboard formulas, commit raw test logs, and recapture real 2-session 409/403 screenshots
| * 813ba96 fix(ui,e2e,pdf): enforce explicit SVG dimensions, add Confidential Internal Notes visual distinction, crop evidence screenshots
| * 86f4516 (origin/main, main) Merge pull request #56 from pimchayasupr-hash/lab4-staging
|/  
*   84720dc Merge pull request #55 from pimchayasupr-hash/feature/lab4-hardening
|\  
| * 6d20aca fix(lab4): action lifecycle, atomic concurrency, status history, deterministic e2e, and engineering report
| * 0a81173 test(e2e): end-to-end regression, dashboard audit, and resolution gate verification (fixes #52)
| * c083efa (origin/feature/lab4-frontend) feat(ui): Dashboards, Actions Taken section, and ticket workflow controls (fixes #46, #50, #51)
| * d6835b1 (origin/feature/lab4-backend) feat(api): Actions Taken CRUD, resolution gate, and dashboards (fixes #45, #47, #48, #49)
| * 65f54aa (origin/feature/lab4-db-schema) feat(db): add ActionTaken model, Ticket version field, migration, and idempotent seed (fixes #44)
| * 77d8f2e (origin/lab4/tests) test(plan): add Lab 4 test register and failing tests (Red)
| * cf54f91 (origin/lab4/spec) docs(spec): add Lab 4 specification, ui-spec, and api-spec
|/  
*   7ea5af2 (tag: pre-lab4-backup) Merge pull request #42 from pimchayasupr-hash/fix/lab3-review-fixes</code></pre>

  <div class="part-subtitle">1.2 Branch Progression &amp; Release Merge Governance</div>
  <table>
    <thead>
      <tr><th>Phase</th><th>Branch</th><th>Key Commits</th><th>Governance &amp; Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Safety Backup</strong></td><td><code>main</code></td><td><code>7ea5af2</code></td><td>Tagged <code>pre-lab4-backup</code>; database dump saved to <code>artifacts/lab-04/backups/</code> (git-ignored)</td></tr>
      <tr><td><strong>Spec DD &amp; Test DD</strong></td><td><code>lab4/spec</code>, <code>lab4/tests</code></td><td><code>cf54f91</code>, <code>77d8f2e</code></td><td>Committed <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/specification.md">specification.md</a>, <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/ui-spec.md">ui-spec.md</a>, <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/api-spec.md">api-spec.md</a>, and failing Red tests (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/tests.md">tests.md</a>)</td></tr>
      <tr><td><strong>DB, API &amp; UI</strong></td><td><code>feature/lab4-db-schema</code>..<code>frontend</code></td><td><code>65f54aa</code>, <code>d6835b1</code>, <code>c083efa</code></td><td>Prisma schema/migrations, Express REST routes, Resolution Gate, React 19 UI</td></tr>
      <tr><td><strong>Hardening &amp; PR #55</strong></td><td><code>feature/lab4-hardening &rarr; lab4-staging</code></td><td><code>6d20aca</code>, <code>84720dc</code></td><td>Resolved 5 reviewer comments by @MiMikoChAn913; approved &amp; merged into <code>lab4-staging</code> by @supa-gif173 (<a href="https://github.com/pimchayasupr-hash/toktickit/pull/55">PR #55</a>)</td></tr>
      <tr><td><strong>Release Merge PR #56</strong></td><td><code>lab4-staging &rarr; main</code></td><td><code>86f4516</code></td><td>Approved &amp; merged from <code>lab4-staging</code> into <code>main</code> by @supa-gif173 (<a href="https://github.com/pimchayasupr-hash/toktickit/pull/56">PR #56</a>)</td></tr>
      <tr><td><strong>QA Audit PR #57</strong></td><td><code>hotfix/lab4-icon-dimensions-and-audit &rarr; lab4-staging</code></td><td><code>adeed3e</code>, <code>83b3cbc</code></td><td>SVG dimension guard, unified dashboard formulas, committed <code>artifacts/lab-04/test-output/*.txt</code>, real 2-session 409 capture; approved &amp; merged into <code>lab4-staging</code> by @supa-gif173 (<a href="https://github.com/pimchayasupr-hash/toktickit/pull/57">PR #57</a>)</td></tr>
    </tbody>
  </table>

  <div class="grid-2" style="margin-top: 4px;">
    <div>
      <div class="part-subtitle" style="margin-top: 2px;">1.3 Repository Structure (Handout &sect;12 Exact Match)</div>
      <pre><code>toktickit/
├── README.md &amp; LAB4_SUBMISSION.pdf
├── artifacts/lab-04/
│   ├── backups/ (git-ignored DB dumps)
│   ├── metrics-vs-db.txt
│   ├── screenshots/ (staff-dashboard, actions-taken, ticket-workflow, requester-dashboard, regression, github)
│   └── test-output/ (traceability.txt, server-vitest.txt, client-vitest.txt, playwright-e2e.txt, append-only-proof.txt)
├── client/src/components/ (requester/, staff/, comments/)
├── docs/lab-04/ (specification.md, ui-spec.md, api-spec.md, tests.md, ai-use.md, reviewer.md)
├── e2e/lab-04/ (actions-taken-flow.spec.ts, dashboards.spec.ts, ticket-resolution.spec.ts)
└── server/ (prisma/schema.prisma, migrations/, seed.ts, src/routes/)</code></pre>
    </div>
    <div>
      <div class="part-subtitle" style="margin-top: 2px;">1.4 README.md &amp; .gitignore Excerpts</div>
      <pre><code># README.md Excerpt (Verification &amp; Testing)
$ npm test                        # Traceability + Server (144/144) + Client (40/40) = 184/184 PASS
$ npx playwright test e2e/lab-04/ # E2E (12 tests x 3 browsers = 36/36 PASS, 0 Axe violations)
$ npm run seed --prefix server    # Idempotent seeder (18 operational tickets)

# .gitignore Excerpt (Raw test-output logs are tracked in git!)
/node_modules
server/uploads/
artifacts/lab-04/backups/
.env</code></pre>
    </div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 2: Answer Part 1.5 & 1.6 (Peer Review Log + Kanban Issues Register)   -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-subtitle" style="margin-top: 0;">1.5 Rendered Peer Review Log (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/reviewer.md">docs/lab-04/reviewer.md</a> — Verified Against Real GitHub State)</div>
  <p style="margin: 2px 0 4px 0;">
    Peer review governance strictly adheres to: <strong>RULE 1 (No Self-Merge)</strong>; <strong>RULE 2 (Evidenced Code Review)</strong>; <strong>RULE 3 (Documented Resolution)</strong>; and <strong>RULE 4 (Evidence Screenshots)</strong>.
  </p>
  <table>
    <thead>
      <tr><th style="width: 14%;">PR Link</th><th style="width: 21%;">Branch Flow</th><th style="width: 18%;">Author / Reviewer</th><th style="width: 35%;">Review Findings &amp; Technical Resolutions</th><th style="width: 12%;">GitHub Status</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong><a href="https://github.com/pimchayasupr-hash/toktickit/pull/55">PR #55</a></strong></td>
        <td><code>feature/lab4-hardening</code> &rarr; <code>lab4-staging</code></td>
        <td>Author: @pimchayasupr-hash<br>Reviewers: @MiMikoChAn913, @supa-gif173</td>
        <td>
          5 comments by @MiMikoChAn913 (Review <code>PRR_kwDOTzBGN88AAAABVHAK1A</code>) resolved in <code>6d20aca</code> &amp; <code>c09ada9</code>:<br>
          1. <strong>Action Lifecycle &amp; Assignee (P1)</strong>: Added <code>ActionStatus</code> enum, <code>assigneeId</code>, inactive assignee rejection (400), terminal lock.<br>
          2. <strong>Atomic OCC (P1)</strong>: Database write predicate <code>updateMany({ where: { id, version } })</code>.<br>
          3. <strong>Ticket Version Validation (P1)</strong>: Mandatory numeric version check; atomic status updates.<br>
          4. <strong>Append-Only Status History (P1)</strong>: Added <code>TicketStatusHistory</code> transactional write.<br>
          5. <strong>Deterministic E2E (P2)</strong>: Deterministic fixtures <code>TKT-2026-001233</code> and <code>TKT-2026-001234</code>.<br>
          <em>Verdict</em>: Approved (Review <code>PRR_kwDOTzBGN88AAAABVQxD6w</code>) &amp; Merged into <code>lab4-staging</code> by @supa-gif173 (Commit <code>84720dc</code>).
        </td>
        <td><span class="badge badge-pass">APPROVED &amp; MERGED</span></td>
      </tr>
      <tr>
        <td><strong><a href="https://github.com/pimchayasupr-hash/toktickit/pull/56">PR #56</a></strong></td>
        <td><code>lab4-staging</code> &rarr; <code>main</code></td>
        <td>Author: @pimchayasupr-hash<br>Reviewer: @supa-gif173</td>
        <td>Release staging PR integrating Actions Taken, Dashboards, Resolution Gate, and Concurrency Control. Approved (Review <code>PRR_kwDOTzBGN88AAAABVQ43jg</code>) &amp; Merged into <code>main</code> by @supa-gif173 (Commit <code>86f4516</code>).</td>
        <td><span class="badge badge-pass">APPROVED &amp; MERGED</span></td>
      </tr>
      <tr>
        <td><strong><a href="https://github.com/pimchayasupr-hash/toktickit/pull/57">PR #57</a> &amp; <a href="https://github.com/pimchayasupr-hash/toktickit/pull/58">PR #58</a></strong></td>
        <td><code>hotfix/lab4-*</code> &rarr; <code>lab4-staging</code> &rarr; <code>main</code></td>
        <td>Author: @pimchayasupr-hash<br>Reviewer: @supa-gif173</td>
        <td>Explicit SVG dimensions across all 52 icons, unified dashboard formulas (<code>ACTIVE_OPEN_STATUSES</code> &amp; 30-day resolved window), committed <code>artifacts/lab-04/test-output/*.txt</code>, renamed <code>dashboards.spec.ts</code>, and recaptured real 2-session 409 &amp; 403 screenshots. PR #57 Approved (<code>PRR_kwDOTzBGN88AAAABVROROQ</code>) &amp; Merged into <code>lab4-staging</code> by @supa-gif173 (<code>83b3cbc</code>); <a href="https://github.com/pimchayasupr-hash/toktickit/pull/58">PR #58</a> Approved by @supa-gif173 (<code>PRR_kwDOTzBGN88AAAABVRpK7w</code>).</td>
        <td><span class="badge badge-pass">APPROVED &amp; MERGED</span></td>
      </tr>
      <tr>
        <td><strong><a href="https://github.com/supa-gif173/toktickit/pull/38">Outgoing PR #38</a>, <a href="https://github.com/supa-gif173/toktickit/pull/44">#44</a>, <a href="https://github.com/supa-gif173/toktickit/pull/46">#46</a></strong></td>
        <td><code>supa-gif173/toktickit</code></td>
        <td>Author: @supa-gif173<br>Reviewer: @pimchayasupr-hash</td>
        <td>Conducted peer review on teammate's Sprint 4 specification, workflow, and dashboards (Action lifecycle, atomic OCC write predicates, 4-condition Resolution Gate, transactional <code>TicketStatusHistory</code>, role dashboards, Zen Green tokens; Reviews <code>PRR_kwDOT1_wHc8AAAABVRI9JQ</code>, <code>PRR_kwDOT1_wHc8AAAABVRpIzA</code>).</td>
        <td><span class="badge badge-pass">REVIEWED &amp; APPROVED</span></td>
      </tr>
    </tbody>
  </table>

  <div class="part-subtitle">1.6 Kanban Board Task Register &amp; GitHub Issues Board Evidence (<a href="https://github.com/pimchayasupr-hash/toktickit/issues?q=is%3Aissue+is%3Aclosed">Issues #43–#54</a>)</div>
  <table>
    <thead>
      <tr><th>Issue</th><th>Task Title</th><th>Component Scope</th><th>Assigned Branch</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/43">#43</a></td><td>Sprint 4 Engineering Contract &amp; Specification Baseline</td><td>Spec DD &amp; Traceability</td><td><code>lab4/spec</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/44">#44</a></td><td>Database Schema Migration &amp; Seed Data</td><td>Prisma ORM &amp; PostgreSQL</td><td><code>feature/lab4-db-schema</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/45">#45</a></td><td>Actions Taken REST API &amp; Permissions</td><td>Express &amp; TypeScript API</td><td><code>feature/lab4-backend</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/46">#46</a></td><td>Actions Taken UI Component &amp; Inline Form Panel</td><td>React 19 &amp; Zen Green CSS</td><td><code>feature/lab4-frontend</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/47">#47</a></td><td>Optimistic Concurrency Control (OCC)</td><td>Database write predicates</td><td><code>feature/lab4-backend</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/48">#48</a></td><td>Resolution Gate Backend Enforcement</td><td>Express Status Route</td><td><code>feature/lab4-backend</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/49">#49</a></td><td>Dashboards Telemetry Aggregation API</td><td>Prisma group-by queries</td><td><code>feature/lab4-backend</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/50">#50</a></td><td>Requester Dashboard UI &amp; Attention Banner</td><td>React 19 View</td><td><code>feature/lab4-frontend</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/51">#51</a></td><td>IT Staff Dashboard UI &amp; Queue Tables</td><td>React 19 View</td><td><code>feature/lab4-frontend</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/52">#52</a></td><td>Automated End-to-End Test Suite</td><td>Playwright Multi-Browser</td><td><code>feature/lab4-hardening</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/53">#53</a></td><td>UI Polish, Mobile Layout &amp; Accessibility</td><td>CSS &amp; Axe-core AA</td><td><code>feature/lab4-hardening</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
      <tr><td><a href="https://github.com/pimchayasupr-hash/toktickit/issues/54">#54</a></td><td>Peer Review, Teammate Sign-off &amp; Staging Merge</td><td>Governance Review</td><td><code>lab4-staging &rarr; main</code></td><td><span class="badge badge-pass">Done (Closed)</span></td></tr>
    </tbody>
  </table>

  <div class="evidence-figure" style="margin-top: 4px;">
    <img src="${imgGithubIssues}" class="evidence-img" style="max-height: 125px;" alt="GitHub Issues Board Showing All Issues Closed" />
    <div class="caption">Figure 1.1: GitHub Repository Issues Board (<code>is:issue is:closed</code>) verifying that all Sprint 4 engineering issues (#43–#54) are completed and closed.</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 3: Answer Part 2 (Spec DD — Complete Rendered Specification Summary)  -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-title" style="margin-bottom: 4px;">Answer Part 2: Spec DD (5 pt)</div>
  <p style="margin: 1px 0 3px 0; font-size: 7.4pt;">
    Committed at <code>cf54f91</code> before implementation, the specification suite comprises <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/specification.md">docs/lab-04/specification.md</a> (28 ACs, 22 FRs, 26 BRs), <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/api-spec.md">docs/lab-04/api-spec.md</a>, and <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/ui-spec.md">docs/lab-04/ui-spec.md</a>. Below is the complete rendered summary of all 11 specification sections, transition matrices, migration rules, and dashboard formulas.
  </p>

  <div class="part-subtitle" style="margin-top: 2px; margin-bottom: 1px;">2.1 Rendered 11-Section Specification Architecture (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/specification.md">specification.md</a>, <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/api-spec.md">api-spec.md</a>, <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/ui-spec.md">ui-spec.md</a>)</div>
  <table style="font-size: 5.8pt; line-height: 1.08;">
    <thead>
      <tr><th style="width: 18%;">Spec Section</th><th style="width: 24%;">Ref IDs / Scope</th><th style="width: 58%;">Rendered Specification Content &amp; Contract Rules</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>&sect;1–3 Goal &amp; Scope</strong></td><td>In-Scope vs. Out-of-Scope</td><td><strong>In-Scope</strong>: <code>ActionTaken</code> CRUD &amp; 4-state lifecycle, 2-step Transition Matrix + Resolution Gate, integer <code>version</code> OCC (409), Staff/Admin/Requester Dashboards, non-destructive migration &amp; idempotent seed.<br><strong>Explicitly Excluded (&sect;3.2)</strong>: Binary file uploads on Actions Taken (plain-text <code>attachmentNotes</code> only), SLA timers/cron jobs, email/SMS/webhooks, hard deletion of tickets/actions/history, WebSockets.</td></tr>
      <tr><td><strong>&sect;4–5 Actions Taken</strong></td><td><code>FR-01..09</code>, <code>BR-01..11</code>, <code>AC-01..14</code></td><td>Parent-child under <code>Ticket</code> (<code>onDelete: Restrict</code>). <code>performedById</code> &amp; <code>createdById</code> strictly derived from JWT session (spoofed body IDs ignored). <code>actionDateTime</code>: valid ISO-8601 UTC, <code>Ticket.createdAt - 60s &le; t &le; NOW() + 5m</code>, displayed in <code>en-GB</code> (<code>Asia/Bangkok UTC+7</code>). <code>description</code> (1–2000 chars); <code>result</code> (1–1000 chars, mandatory when <code>status = COMPLETED</code>); <code>followUpNote</code> (1–1000 chars, mandatory when <code>followUpRequired = true</code>, cleared to <code>null</code> when <code>false</code>). <code>assigneeId</code> must reference an active <code>STAFF</code> or <code>ADMIN</code> user (inactive/requester returns <code>400 INACTIVE_ASSIGNEE</code>). Terminal ticket statuses (<code>CLOSED</code>, <code>CANCELLED</code>) lock action creation (<code>400 TERMINAL_STATE_LOCKED</code>). Append-only: no <code>DELETE</code> route exists.</td></tr>
      <tr><td><strong>&sect;5.1–5.2 Workflow &amp; Gate</strong></td><td><code>FR-10..13</code>, <code>BR-12..13</code>, <code>AC-15..19</code></td><td><strong>Two-Step Evaluation Order</strong> on <code>PATCH /api/staff/tickets/:id/status</code>:<br><strong>Step 1 (Transition Matrix)</strong>: Validates <code>targetStatus &isin; VALID_TRANSITIONS[currentStatus]</code> and role permissions. Disallowed jumps (e.g., <code>NEW &rarr; RESOLVED</code> or <code>IN_PROGRESS &rarr; OPEN</code>) immediately return <code>HTTP 400 INVALID_TRANSITION</code>.<br><strong>Step 2 (Resolution Gate)</strong>: Evaluated when transitioning from a permitted origin (<code>OPEN</code>, <code>IN_PROGRESS</code>, <code>WAITING_FOR_REQUESTER</code>, <code>REOPENED</code>) to <code>RESOLVED</code>. Requires: (1) <code>ownerId &ne; null</code> (<code>OWNER_REQUIRED</code>), (2) <code>itPriority &ne; null</code> (<code>PRIORITY_REQUIRED</code>), (3) &ge;1 <code>ActionTaken</code> with <code>status = 'COMPLETED'</code> and non-empty <code>result</code> (<code>COMPLETED_ACTION_REQUIRED</code>), and (4) 0 actions with open follow-ups (<code>OPEN_FOLLOW_UPS_EXIST</code>). Failing any check returns <code>HTTP 422 RESOLUTION_GATE_FAILED</code>. Requester "Problem Appears Resolved" posts an advisory Public Comment without mutating <code>currentStatus</code>.</td></tr>
      <tr><td><strong>&sect;5.3 Concurrency &amp; Idempotency</strong></td><td><code>FR-14..16</code>, <code>BR-14..15</code></td><td>Optimistic Concurrency Control via atomic SQL predicate <code>updateMany({ where: { id, version: expectedVersion }, data: { ..., version: { increment: 1 } } })</code> inside a Prisma <code>$transaction</code>. Stale version returns <code>HTTP 409 CONCURRENCY_CONFLICT</code> with latest entity. Create routes support <code>Idempotency-Key</code> / <code>clientSubmissionId</code>; UI buttons disable during in-flight requests.</td></tr>
      <tr><td><strong>&sect;5.4 Unified Dashboards</strong></td><td><code>FR-17..20</code>, <code>BR-16..26</code>, <code>AC-20..24</code></td><td>Unified active-open set across both dashboards: <code>ACTIVE_OPEN_STATUSES = ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'REOPENED')</code>.<br>&bull; <strong>Staff Dashboard (<code>GET /api/dashboard/staff</code>)</strong>: <code>unassignedCount</code> (<code>ownerId IS NULL AND status IN ACTIVE_OPEN_STATUSES</code> = 4), <code>myAssignedCount</code> (<code>ownerId = staffId AND status IN ACTIVE_OPEN_STATUSES</code> = 4), <code>urgentCount</code> (<code>itPriority = 'URGENT' AND status IN ACTIVE_OPEN_STATUSES</code> = 2), <code>openTotalCount</code> (<code>status IN ACTIVE_OPEN_STATUSES</code> = 13), status/priority distributions, top 5 urgent queue, 5 recent actions by staff user, plus Admin user breakdown.<br>&bull; <strong>Requester Dashboard (<code>GET /api/dashboard/requester</code>)</strong>: <code>openTicketsCount</code> (<code>status IN ACTIVE_OPEN_STATUSES</code> = 4), <code>waitingForRequesterCount</code> (<code>status = 'WAITING_FOR_REQUESTER'</code> = 1), <code>recentlyResolvedCount</code> (30-day rolling window: <code>status = 'RESOLVED' AND updatedAt &ge; NOW() - INTERVAL '30 days'</code> = 0), <code>closedTicketsCount</code> (<code>status = 'CLOSED'</code> = 1). All metric cards drill down into filtered queues.</td></tr>
      <tr><td><strong>&sect;6 UI Design System</strong></td><td><a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/ui-spec.md">ui-spec.md &sect;1–6</a></td><td>Zen Green palette (<code>#006B3C</code> primary 8.4:1 contrast, <code>#008751</code> accent, <code>#F0FDF4</code> mint surface). Strict visual separation: shared <code>PublicCommentsSection</code> uses <code>#FFFFFF</code> surface, <code>3px solid #006B3C</code> top border, and <code>SHARED &bull; Visible to Requester</code> badge; confidential <code>InternalNotesSection</code> uses warm amber <code>#FFFBEB</code> surface, <code>2px solid #D97706</code> border, lock icon, and <code>CONFIDENTIAL &bull; IT Staff &amp; Admins Only</code> badge. All 52 inline SVGs carry explicit <code>width</code>/<code>height</code> attributes (&le; 64px). Standardized <code>en-GB</code> (<code>Asia/Bangkok UTC+7</code>) timestamps across all views.</td></tr>
      <tr><td><strong>&sect;7 Data &amp; Migration</strong></td><td><code>AC-27</code>, <code>BR-26</code></td><td>Non-destructive additive migration adding <code>Ticket.version Int @default(1)</code> (backfilling existing rows to <code>1</code>), <code>ActionTaken</code> table, and <code>TicketStatusHistory</code> table. Pre-migration backup via <code>pg_dump</code>; rollback DDL documented. Idempotent seed script (<code>seed.ts</code>) populates 18 tickets (including 0-action legacy tickets <code>TKT-2026-001233</code> and multi-action <code>TKT-2026-001234</code>).</td></tr>
      <tr><td><strong>&sect;8–11 API &amp; DoD</strong></td><td><a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/api-spec.md">api-spec.md</a></td><td>REST endpoints: <code>GET/POST /api/tickets/:id/actions-taken</code>, <code>GET/PATCH /api/tickets/:id/actions-taken/:actionId</code>, <code>PATCH /api/staff/tickets/:id/status</code>, <code>GET /api/dashboard/staff</code>, <code>GET /api/dashboard/requester</code>, <code>GET /api/health</code>.</td></tr>
    </tbody>
  </table>

  <div class="part-subtitle" style="margin-top: 2px; margin-bottom: 1px;">2.2 Role-Enforced Ticket Status Transition Matrix (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/specification.md">specification.md &sect;5.1</a>) &amp; Action Lifecycle</div>
  <table style="font-size: 5.8pt; line-height: 1.08;">
    <thead>
      <tr><th>From Status</th><th>Permitted Target Statuses</th><th>Permitted Roles</th><th>Step 1 / Step 2 Enforcement &amp; Pre-conditions</th></tr>
    </thead>
    <tbody>
      <tr><td><code>NEW</code></td><td><code>OPEN</code>, <code>IN_PROGRESS</code>, <code>CANCELLED</code></td><td><code>STAFF</code>, <code>ADMIN</code> (<code>REQUESTER</code> own on <code>CANCELLED</code>)</td><td>Step 1 Matrix Check. Direct <code>NEW &rarr; RESOLVED</code> rejected with <code>400 INVALID_TRANSITION</code>.</td></tr>
      <tr><td><code>OPEN</code></td><td><code>IN_PROGRESS</code>, <code>WAITING_FOR_REQUESTER</code>, <code>RESOLVED</code>, <code>CANCELLED</code></td><td><code>STAFF</code>, <code>ADMIN</code> (<code>REQUESTER</code> own on <code>CANCELLED</code>)</td><td><code>OPEN &rarr; RESOLVED</code> permitted in Step 1, strictly guarded by Step 2 <strong>4-Condition Resolution Gate (<code>422 RESOLUTION_GATE_FAILED</code>)</strong>.</td></tr>
      <tr><td><code>IN_PROGRESS</code></td><td><code>WAITING_FOR_REQUESTER</code>, <code>RESOLVED</code>, <code>CANCELLED</code></td><td><code>STAFF</code>, <code>ADMIN</code></td><td><code>IN_PROGRESS &rarr; RESOLVED</code> guarded by Step 2 <strong>Resolution Gate (<code>422</code>)</strong>. Regression to <code>OPEN</code> is disallowed (<code>400</code>).</td></tr>
      <tr><td><code>WAITING_FOR_REQUESTER</code></td><td><code>IN_PROGRESS</code>, <code>RESOLVED</code>, <code>CANCELLED</code></td><td><code>STAFF</code>, <code>ADMIN</code> (<code>REQUESTER</code> own on <code>CANCELLED</code>)</td><td><code>WAITING_FOR_REQUESTER &rarr; RESOLVED</code> guarded by Step 2 <strong>Resolution Gate (<code>422</code>)</strong>.</td></tr>
      <tr><td><code>RESOLVED</code></td><td><code>CLOSED</code>, <code>REOPENED</code></td><td><code>STAFF</code>, <code>ADMIN</code> (<code>REQUESTER</code> own on <code>REOPENED</code>)</td><td>Appends transactional row to <code>TicketStatusHistory</code>; increments <code>Ticket.version</code>.</td></tr>
      <tr><td><code>CLOSED</code></td><td><code>REOPENED</code></td><td><code>STAFF</code>, <code>ADMIN</code></td><td>Terminal while <code>CLOSED</code> (locks new Actions Taken); reopening resumes active triage.</td></tr>
      <tr><td><code>REOPENED</code></td><td><code>IN_PROGRESS</code>, <code>WAITING_FOR_REQUESTER</code>, <code>RESOLVED</code>, <code>CANCELLED</code></td><td><code>STAFF</code>, <code>ADMIN</code></td><td><code>REOPENED &rarr; RESOLVED</code> guarded by Step 2 <strong>Resolution Gate (<code>422</code>)</strong>.</td></tr>
      <tr><td><code>CANCELLED</code></td><td><em>None (Immutable Terminal State)</em></td><td>None</td><td>All transitions and new Actions Taken rejected (<code>400 TERMINAL_STATE_LOCKED</code>).</td></tr>
    </tbody>
  </table>
</div>

<!-- ========================================================================== -->
<!-- PAGE 4: Answer Part 3 (Test DD & Full Rendered Test Register)              -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section" style="margin-bottom: 4px;">
  <div class="part-title" style="margin-bottom: 3px;">Answer Part 3: Test DD and Traceability (10 pt)</div>
  <p style="margin: 1px 0 2px 0; font-size: 7.4pt;">
    Committed in the Red phase (<code>77d8f2e</code>) prior to feature code, the test harness (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/tests.md">docs/lab-04/tests.md</a>) maps 100% of <code>AC-01..28</code>, <code>FR-01..22</code>, and <code>BR-01..26</code>. All raw test output logs are committed in <a href="https://github.com/pimchayasupr-hash/toktickit/tree/hotfix/lab4-icon-dimensions-and-audit/artifacts/lab-04/test-output">artifacts/lab-04/test-output/</a>.
  </p>

  <div class="part-subtitle" style="margin-top: 2px; margin-bottom: 2px;">3.1 Rendered Test Register &amp; Bidirectional Traceability Matrix (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/tests.md">docs/lab-04/tests.md</a>)</div>
  <table style="font-size: 6.1pt; line-height: 1.1;">
    <thead>
      <tr><th style="width: 16%;">Test ID</th><th style="width: 11%;">Level</th><th style="width: 24%;">Covered AC / FR / BR</th><th style="width: 37%;">Test File Path &amp; Scenario Verified</th><th style="width: 12%;">Status</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>TEST-ACT-01..04</strong></td><td>API Integration</td><td><code>AC-01..03, FR-01..03, BR-01..03</code></td><td><code>server/tests/lab-04/actions-taken.api.test.ts</code> — Staff/Admin create action, JWT performer binding (ignores spoofed ID), non-owner staff logging</td><td><span class="badge badge-pass">PASS (4/4)</span></td></tr>
      <tr><td><strong>TEST-ACT-05..09</strong></td><td>API Validation</td><td><code>AC-04..07, FR-04..06, BR-04..07</code></td><td><code>server/tests/lab-04/actions-taken.api.test.ts</code> — ISO-8601 date bounds (&le;+5m, &ge;createdAt), description/result lengths, conditional <code>followUpNote</code></td><td><span class="badge badge-pass">PASS (5/5)</span></td></tr>
      <tr><td><strong>TEST-ACT-10..13</strong></td><td>Auth / Security</td><td><code>AC-08..11, FR-07, BR-08..09, BR-11</code></td><td><code>server/tests/lab-04/actions-taken.api.test.ts</code> — Requester 403 on write, 404 isolation on other's ticket, 200 on own ticket, 400 on <code>CLOSED</code>/<code>CANCELLED</code></td><td><span class="badge badge-pass">PASS (4/4)</span></td></tr>
      <tr><td><strong>TEST-ACT-14..17</strong></td><td>OCC &amp; Audit</td><td><code>AC-12..14, FR-08..09, BR-05, BR-10, BR-14</code></td><td><code>server/tests/lab-04/actions-taken.api.test.ts</code> — Version increment on PATCH, 409 on stale version, XSS sanitization, <strong>404 on DELETE (append-only)</strong></td><td><span class="badge badge-pass">PASS (4/4)</span></td></tr>
      <tr><td><strong>TEST-ACT-18..22</strong></td><td>Lifecycle &amp; Race</td><td><code>FR-14..15, BR-10, BR-14..15</code></td><td><code>server/tests/lab-04/actions-taken.api.test.ts</code> — Active assignee FK, 400 on inactive assignee, <code>COMPLETED</code> requires result, terminal lock, parallel <code>Promise.all</code> race (one 200, one 409)</td><td><span class="badge badge-pass">PASS (5/5)</span></td></tr>
      <tr><td><strong>TEST-WFK-01..08</strong></td><td>Workflow &amp; Gate</td><td><code>AC-15..19, FR-10..14, BR-12..14</code></td><td><code>server/tests/lab-04/ticket-workflow.api.test.ts</code> — Step 1 <code>400 INVALID_TRANSITION</code> vs Step 2 <code>422 RESOLUTION_GATE_FAILED</code>, atomic <code>Ticket.version</code> OCC, append-only <code>TicketStatusHistory</code> &amp; <strong>404 on DELETE history</strong></td><td><span class="badge badge-pass">PASS (8/8)</span></td></tr>
      <tr><td><strong>TEST-DSH-01..05</strong></td><td>Dashboard API</td><td><code>AC-20..23, FR-17..19, BR-16..26</code></td><td><code>server/tests/lab-04/requester-dashboard.api.test.ts</code>, <code>staff-dashboard.api.test.ts</code>, <code>metrics-vs-db.test.ts</code> — Unified <code>ACTIVE_OPEN_STATUSES</code>, 30-day resolved window, zero-state, SQL parity</td><td><span class="badge badge-pass">PASS (18/18)</span></td></tr>
      <tr><td><strong>TEST-UI-01..05</strong></td><td>Component (RTL)</td><td><code>AC-24..25, FR-16, FR-20, FR-22</code></td><td><code>client/src/tests/lab-04/ActionsTaken.test.tsx</code>, <code>StaffDashboard.test.tsx</code>, <code>RequesterDashboard.test.tsx</code>, <code>TicketWorkflow.test.tsx</code> — Follow-up toggle, inline errors + <code>aria-describedby</code>, drill-downs</td><td><span class="badge badge-pass">PASS (8/8)</span></td></tr>
      <tr><td><strong>TEST-E2E-01..04</strong></td><td>Playwright E2E</td><td><code>AC-01..26, FR-17..21, UI-Spec &sect;6</code></td><td><code>e2e/lab-04/actions-taken-flow.spec.ts</code>, <code>ticket-resolution.spec.ts</code>, <code>dashboards.spec.ts</code> — 12 specs &times; 3 browsers (Chromium, Firefox, WebKit = 36 runs), 0px overflow, SVG &le; 64px, 0 Axe violations</td><td><span class="badge badge-pass">PASS (36/36)</span></td></tr>
      <tr><td><strong>TEST-MIG-REGR</strong></td><td>Seed &amp; Labs 1–3</td><td><code>AC-27..28, FR-15, FR-21, BR-26</code></td><td>All 49 test files across Labs 1–4 (29 Server + 17 Client + 3 E2E) — Idempotent seeding, legacy 0-action tickets, RBAC, comments/notes, attachments</td><td><span class="badge badge-pass">196 Unique / 220 Runs</span></td></tr>
    </tbody>
  </table>

  <div class="grid-2" style="margin-top: 4px;">
    <div>
      <div class="part-subtitle" style="margin-top: 2px;">3.2 Traceability &amp; Runner Summary (Committed Raw Logs)</div>
      <pre><code># artifacts/lab-04/test-output/traceability.txt
Defined &amp; Referenced: 28 ACs, 22 FRs, 26 BRs (100% Covered, 0 Orphans)

# artifacts/lab-04/test-output/server-vitest.txt
Test Files  29 passed (29) | Tests  144 passed (144)

# artifacts/lab-04/test-output/client-vitest.txt
Test Files  17 passed (17) | Tests  40 passed (40)

# artifacts/lab-04/test-output/playwright-e2e.txt
Running 36 tests (Chromium: 12, Firefox: 12, WebKit: 12) -> 36 passed</code></pre>
    </div>
    <div>
      <div class="part-subtitle" style="margin-top: 2px;">3.3 Append-Only Audit Proof (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/hotfix/lab4-icon-dimensions-and-audit/artifacts/lab-04/test-output/append-only-proof.txt">append-only-proof.txt</a>)</div>
      <pre><code># Verifies DELETE routes are rejected with HTTP 404 and 0 rows are deleted:
✓ tests/lab-04/actions-taken.api.test.ts > TEST-ACT-17:
  DELETE /api/tickets/:ticketId/actions-taken/:actionId returns 404 or 405 (append-only)
✓ tests/lab-04/ticket-workflow.api.test.ts > TEST-WFK-07:
  Append-only TicketStatusHistory records actor-attributed transitions in same transaction
  (+ DELETE /api/staff/tickets/:id/status-history rejected with 404; history preserved)
Test Files 2 passed (2) | Tests 2 passed</code></pre>
    </div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 4 (Bottom): Answer Part 4 (AI Use with Reflection)                    -->
<!-- ========================================================================== -->
<div class="part-section" style="margin-top: 8px;">
  <div class="part-title">Answer Part 4: AI Use with Reflection (5 pt)</div>
  <p style="margin: 2px 0 4px 0;">
    <strong>AI Tooling Profile (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/docs/lab-04/ai-use.md">docs/lab-04/ai-use.md</a>)</strong>: Google Antigravity (leveraging Gemini 2.5 Pro for specification synthesis, atomic transaction modeling, and security auditing, and Gemini 2.5 Flash for test execution and DOM diagnostics).
  </p>
  <table>
    <thead>
      <tr><th style="width: 23%;">Prompt / Engineering Task</th><th style="width: 47%;">Concrete Changes Generated</th><th style="width: 30%;">Human Audit &amp; Verification</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>1–2. Spec DD &amp; Red Tests</strong></td><td>Authored <code>specification.md</code>, <code>api-spec.md</code>, <code>ui-spec.md</code>, <code>tests.md</code>, and failing Red tests (<code>77d8f2e</code>).</td><td>Verified 100% coverage via <code>check-traceability.py</code>.</td></tr>
      <tr><td><strong>3–4. Schema, Seed &amp; Gate</strong></td><td>Added <code>ActionTaken</code>, <code>TicketStatusHistory</code>, <code>Ticket.version</code>, idempotent <code>seed.ts</code>, and 2-step Resolution Gate.</td><td>Verified repeatable seeding and 400 vs 422 status codes.</td></tr>
      <tr><td><strong>5–7. Reviewer P1 Fixes</strong></td><td>Added <code>ActionStatus</code> enum, active assignee check, and atomic SQL predicate <code>updateMany({ where: { id, version } })</code>.</td><td>Verified with parallel <code>Promise.all</code> race tests (<code>TEST-ACT-22</code>, <code>TEST-WFK-08</code>).</td></tr>
      <tr><td><strong>8–10. Final QA &amp; Audit</strong></td><td>Explicit <code>width</code>/<code>height</code> on all 52 SVGs, unified <code>ACTIVE_OPEN_STATUSES</code> &amp; 30-day resolved window, real 2-session 409 capture.</td><td>Visual inspection of every screenshot + 36/36 cross-browser E2E pass.</td></tr>
    </tbody>
  </table>
  <p style="margin: 4px 0 0 0; font-size: 7.5pt;">
    <strong>Reflection</strong>: AI accelerated boilerplate, Prisma aggregation queries, and concurrent test harnesses, while human engineering oversight was critical for catching subtle cross-layer inconsistencies—such as ensuring <code>IN_PROGRESS &rarr; OPEN</code> was removed from seed history to match the state machine, unifying active-open status definitions across both dashboards, and capturing authentic two-session concurrency conflicts rather than synthetic mocks.
  </p>
</div>

<!-- ========================================================================== -->
<!-- PAGE 5: Answer Part 5 (Staff Dashboard Desktop, Drill-Down, Tablet)        -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-title">Answer Part 5: Working IT Staff Dashboard UI (5 pt)</div>
  <p style="margin: 2px 0 4px 0;">
    The IT Staff Dashboard (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/client/src/components/staff/StaffDashboard.tsx">StaffDashboard.tsx</a>) renders real-time operational metrics computed from PostgreSQL using unified active-open statuses (<code>NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED</code>) with 1-click drill-down into the filtered queue.
  </p>

  <div class="evidence-figure">
    <img src="${imgStaffDesktop}" class="evidence-img evidence-img-tall" alt="IT Staff Dashboard Desktop" />
    <div class="caption">Figure 5.1: IT Staff Dashboard (Desktop 1440px) on pristine seeded database showing 4-column Metric Cards (Unassigned: 4, My Assigned: 4, High &amp; Urgent: 2, Open Total: 13), Urgent Attention Queue (2 Tickets), Status Distribution (Total: 13 active), Priority Breakdown (Active Queue: URGENT 2, HIGH 3, MEDIUM 7, LOW 1), and My Recent Actions (4 Actions with unified typography and Asia/Bangkok timestamps).</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgStaffDrilldown}" class="evidence-img" alt="IT Staff Dashboard Drill-Down to Filtered Queue" />
    <div class="caption">Figure 5.1B: Staff Dashboard Card Drill-Down Navigation (<code>AC-24, FR-20</code>). Clicking the "Unassigned (4)" metric card on the Staff Dashboard navigates directly to the IT Staff Shared Ticket Queue pre-filtered to <code>Status: Active Open (Non-Terminal)</code> and <code>Owner: Unassigned</code>, displaying the active badge <code>Filtered View: Unassigned Queue &times; Clear</code> and <code>Showing 1 to 4 of 4 tickets</code> (exact 1:1 count match).</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 6: Answer Part 5 (Staff Dashboard Tablet, Mobile, Loading, Empty)     -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="grid-2">
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgStaffTablet}" class="evidence-img" style="max-height: 245px;" alt="IT Staff Dashboard Tablet" />
      <div class="caption">Figure 5.2: IT Staff Dashboard (Tablet 768px) rendering adaptive 2-column metric grid with zero horizontal overflow.</div>
    </div>
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgStaffMobile}" class="evidence-img" style="max-height: 245px;" alt="IT Staff Dashboard Mobile" />
      <div class="caption">Figure 5.3: IT Staff Dashboard (Mobile 360px) featuring 2-row wrapped navigation bar, single-column stack, and zero horizontal overflow.</div>
    </div>
  </div>

  <div class="evidence-figure" style="margin-top: 6px;">
    <img src="${imgStaffLoading}" class="evidence-img evidence-img-compact" alt="Staff Dashboard Loading State" />
    <div class="caption">Figure 5.4: Staff Dashboard Loading State (<strong>simulated via route interception delay</strong> on <code>GET /api/dashboard/staff</code>) displaying accessible shimmer skeleton placeholders (<code>aria-busy="true"</code>) while telemetry is in flight.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgStaffEmpty}" class="evidence-img" style="max-height: 270px;" alt="Staff Dashboard Empty State" />
    <div class="caption">Figure 5.5: Staff Dashboard Empty State (<strong>simulated via route interception returning zero counts</strong>) displaying 0 across all metric counters and the friendly Zen Green "Queue is Clear &amp; Up to Date" callout when zero active tickets exist.</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 7: Answer Part 5 (Forbidden 403, Error 500, Metrics-vs-DB Audit)      -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="evidence-figure">
    <img src="${imgStaffForbidden}" class="evidence-img evidence-img-compact" alt="Staff Dashboard Forbidden State" />
    <div class="caption">Figure 5.6: Staff Dashboard Forbidden State (HTTP 403) captured from a <strong>real authenticated Requester session</strong> (<code>Jennifer Anderson, Role: Requester</code> visible in the top-right navigation bar) attempting to navigate to <code>#/staff/dashboard</code>, triggering a real backend <code>403 FORBIDDEN</code> response.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgStaffError}" class="evidence-img evidence-img-compact" alt="Staff Dashboard Error State" />
    <div class="caption">Figure 5.7: Staff Dashboard Error State (HTTP 500, <strong>simulated via route interception</strong> on <code>GET /api/dashboard/staff</code>) rendering a safe failure alert card with an interactive "Retry Connection" button.</div>
  </div>

  <div class="part-subtitle">5.1 Dashboard Telemetry vs. Direct PostgreSQL Database Queries Audit (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/hotfix/lab4-icon-dimensions-and-audit/artifacts/lab-04/metrics-vs-db.txt">artifacts/lab-04/metrics-vs-db.txt</a>)</div>
  <pre><code>${metricsVsDbText}</code></pre>
</div>

<!-- ========================================================================== -->
<!-- PAGE 8: Answer Part 6 (Actions Taken Lifecycle, Create Form, Validation)   -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-title">Answer Part 6: Working Actions Taken UI (10 pt)</div>
  <p style="margin: 2px 0 4px 0;">
    The Actions Taken subsystem (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/client/src/components/staff/ActionsTakenSection.tsx">ActionsTakenSection.tsx</a>) enables IT Staff and Administrators to record, delegate, edit, and transition troubleshooting steps across a 4-state lifecycle (<code>Pending</code>, <code>In Progress</code>, <code>Completed</code>, <code>Cancelled</code>) with inline validation and atomic optimistic concurrency control.
  </p>

  <div class="evidence-figure">
    <img src="${imgActLifecycle}" class="evidence-img" style="max-height: 255px;" alt="Actions Taken Subsystem Lifecycle" />
    <div class="caption">Figure 6.1: Actions Taken Subsystem Card on <code>TKT-2026-001234</code> displaying chronological entries across <code>Completed</code> (with documented <code>Result:</code> box and <code>(Terminal / Immutable)</code> lock label), <code>In Progress</code> (with quick-transition buttons <code>Complete</code>, <code>Cancel</code>, and <code>Edit</code>), and <code>Cancelled</code> states.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgActCreate}" class="evidence-img" style="max-height: 255px;" alt="Create Action Taken Form Panel" />
    <div class="caption">Figure 6.2: Create Mode Inline Form Panel (<code>Record New Action Taken</code>) showing <code>Action Date &amp; Time *</code>, <code>Action Status *</code> dropdown (<code>Pending</code>, <code>In Progress</code>, <code>Completed</code>, <code>Cancelled</code>), <code>Operational Assignee</code> dropdown, <code>Action Description *</code> textarea (with 2000-char counter), <code>Action Result</code> textarea (1000-char counter), <code>Follow-Up Required</code> checkbox, and plain-text <code>Attachment Notes (Optional)</code> input.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgActValidation}" class="evidence-img" style="max-height: 255px;" alt="Action Taken Validation Error Placement" />
    <div class="caption">Figure 6.3: Field-Level Validation Error Placement &amp; ARIA Linking (<code>TEST-UI-ACT-05</code>). Attempting to submit an action with status <code>Completed</code> and <code>Follow-Up Required</code> checked while leaving both textareas blank renders inline field-level error messages directly beneath <code>#actionResult</code> (<code>id="actionResult-error"</code>) and <code>#followUpNote</code> (<code>id="followUpNote-error"</code>) linked via <code>aria-describedby</code> and <code>aria-invalid="true"</code>, while preserving all entered form values.</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 9: Answer Part 6 (Inactive Assignee, Edit Mode, Two-Session 409)      -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="evidence-figure">
    <img src="${imgActInactive}" class="evidence-img" style="max-height: 265px;" alt="Inactive Assignee Assignment Rejection" />
    <div class="caption">Figure 6.4: Inactive Assignee Rejection (<code>HTTP 400 INACTIVE_ASSIGNEE</code>). Selecting deactivated staff account <code>Kevin Patel [INACTIVE &mdash; Deactivated Staff]</code> in the <code>Operational Assignee</code> dropdown and clicking <code>Save Action</code> triggers a real backend <code>400 INACTIVE_ASSIGNEE</code> rejection, displaying <code>"Assignee must be an active IT Staff or Administrator."</code> both in the top alert banner and inline beneath <code>#actionAssignee</code> while keeping the selected option visible.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgActEdit}" class="evidence-img" style="max-height: 265px;" alt="Edit Action Taken Form Panel" />
    <div class="caption">Figure 6.5: Edit Action Taken Mode (<code>Edit Action Taken</code>). Clicking <code>Edit</code> on an active <code>In Progress</code> action opens the pre-populated form holding the current entity <code>version = 1</code>, <code>Action Status: In Progress</code>, <code>Operational Assignee: Michael Henderson (IT Support)</code>, and existing description <code>"Thermal burn-in load test under Geekbench suite."</code> with an <code>Update Action</code> submit button.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgActConflict}" class="evidence-img" style="max-height: 265px;" alt="Optimistic Concurrency 409 Conflict on Edit" />
    <div class="caption">Figure 6.6: Real Two-Session Optimistic Concurrency Conflict (<code>HTTP 409 Conflict</code>) in <strong>Edit Action Taken</strong> mode. While Session A held the open <code>Edit Action Taken</code> form at <code>version = 1</code>, concurrent Session B submitted a <code>PATCH</code> incrementing the database row to <code>version = 2</code>. When Session A clicked <code>Update Action</code>, the backend atomic predicate rejected the stale write with <code>HTTP 409 Conflict</code>, rendering the banner and <code>Reload Latest Data</code> button without losing Session A's typed text.</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 10: Answer Part 6 (Requester Read-Only, Tablet/Mobile, OCC Code)      -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="evidence-figure">
    <img src="${imgActReadonly}" class="evidence-img" style="max-height: 235px;" alt="Requester Read-Only Actions View" />
    <div class="caption">Figure 6.7: Requester Read-Only View on Own Ticket (<code>AC-10, FR-07</code>). Requesters inspect chronological Actions Taken and documented results on their own ticket, with all mutation controls (<code>+ Add Action</code>, <code>Edit</code>, quick status buttons) omitted from the DOM and blocked by <code>403 Forbidden</code> on the API.</div>
  </div>

  <div class="grid-2" style="margin-top: 6px;">
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgActTablet}" class="evidence-img" style="max-height: 220px;" alt="Actions Taken Tablet View" />
      <div class="caption">Figure 6.8: Actions Taken Card (Tablet 768px) with responsive metadata wrapping.</div>
    </div>
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgActMobile}" class="evidence-img" style="max-height: 220px;" alt="Actions Taken Mobile View" />
      <div class="caption">Figure 6.9: Actions Taken Card (Mobile 360px) with stacked controls and zero overflow.</div>
    </div>
  </div>

  <div class="part-subtitle" style="margin-top: 8px;">6.1 Atomic Optimistic Concurrency Database Predicate (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/server/src/routes/actions-taken.ts">server/src/routes/actions-taken.ts</a>)</div>
  <pre><code>// Atomic compare-and-increment database predicate inside Prisma transaction (server/src/routes/actions-taken.ts)
const txResult = await prisma.$transaction(async (tx) => {
  const updatedBatch = await tx.actionTaken.updateMany({
    where: { id: actionId, ticketId, version: Number(version) },
    data: { ...updateData, updatedById: req.user!.id, version: { increment: 1 } },
  });
  if (updatedBatch.count === 0) {
    const currentRecord = await tx.actionTaken.findUnique({ where: { id: actionId } });
    return { conflict: true, currentRecord };
  }
  const updatedAction = await tx.actionTaken.findUnique({ where: { id: actionId }, include: { performedBy: true, assignee: true } });
  return { conflict: false, updatedAction };
});
if (txResult.conflict) {
  res.status(409).json({ error: { code: 'CONCURRENCY_CONFLICT', message: 'Conflict detected: This action was modified by another staff member while you were editing. Please review the latest data.', currentVersion: txResult.currentRecord?.version, currentEntity: txResult.currentRecord } });
  return;
}</code></pre>
</div>

<!-- ========================================================================== -->
<!-- PAGE 11: Answer Part 7 (Workflow Resolution Gate, Transition, History)     -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-title">Answer Part 7: Working Ticket Workflow (5 pt)</div>
  <p style="margin: 2px 0 4px 0;">
    The Ticket Workflow subsystem (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/server/src/routes/staff.ts">server/src/routes/staff.ts</a>, <a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/client/src/components/staff/StaffTicketDetail.tsx">StaffTicketDetail.tsx</a>) enforces the two-step state machine and 4-condition Resolution Gate, atomic ticket version concurrency checks, and transactional status history logging.
  </p>

  <div class="evidence-figure">
    <img src="${imgWfResolution}" class="evidence-img" style="max-height: 210px;" alt="Resolution Gate Rejection Banner" />
    <div class="caption">Figure 7.1: Strict Resolution Gate Rejection (<code>HTTP 422 RESOLUTION_GATE_FAILED</code>) on legacy zero-action ticket <code>TKT-2026-001233</code> (<code>Status: Open</code>). Attempting the permitted matrix transition <code>OPEN &rarr; RESOLVED</code> passes Step 1 but is blocked by Step 2 because zero completed Actions Taken exist, displaying: <code>"Resolution Gate Failed: At least one COMPLETED Action Taken with a recorded result is required before resolving a ticket."</code></div>
  </div>

  <div class="evidence-figure">
    <img src="${imgWfTransition}" class="evidence-img" style="max-height: 210px;" alt="Successful Permitted Status Transition" />
    <div class="caption">Figure 7.2: Permitted Status Transition Execution on <code>TKT-2026-001234</code>. Transitioning status from <code>In Progress</code> to <code>Waiting for Requester</code> atomically increments <code>Ticket.version</code>, updates <code>Current Status</code> to <code>Waiting for Requester</code>, and displays the confirmation banner <code>"Ticket status updated to WAITING_FOR_REQUESTER."</code></div>
  </div>

  <div class="evidence-figure">
    <img src="${imgWfHistory}" class="evidence-img" style="max-height: 140px;" alt="Ticket Status History Timeline (Staff View)" />
    <div class="caption">Figure 7.3: Append-Only Ticket Status History Timeline (Staff View on <code>TKT-2026-001234</code>) showing all 3 chronological transitions: seeded <code>NEW &rarr; OPEN</code>, seeded <code>OPEN &rarr; IN_PROGRESS</code>, and the newly recorded <code>IN_PROGRESS &rarr; WAITING_FOR_REQUESTER</code> transition with actor role and <code>Asia/Bangkok</code> timestamp.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgWfReqHistory}" class="evidence-img" style="max-height: 140px;" alt="Ticket Status History Timeline (Requester View)" />
    <div class="caption">Figure 7.4: Requester-Visible Status History Tab on <code>TKT-2026-001234</code> displaying the exact same 3 valid transitions (<code>NEW &rarr; OPEN &rarr; IN_PROGRESS &rarr; WAITING_FOR_REQUESTER</code>) in read-only mode.</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 12: Answer Part 7 (Workflow Tablet/Mobile + Two-Step Backend Code)    -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="grid-2">
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgWfTablet}" class="evidence-img" style="max-height: 290px;" alt="Ticket Workflow Tablet View" />
      <div class="caption">Figure 7.5: Ticket Workflow &amp; Status Controls on Tablet Viewport (768px) showing responsive form controls and zero horizontal overflow.</div>
    </div>
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgWfMobile}" class="evidence-img" style="max-height: 290px;" alt="Ticket Workflow Mobile View" />
      <div class="caption">Figure 7.6: Ticket Workflow &amp; Status Controls on Mobile Viewport (360px) with wrapped navigation and full-width dropdown selectors.</div>
    </div>
  </div>

  <div class="part-subtitle" style="margin-top: 8px;">7.1 Two-Step Transition Matrix &amp; Resolution Gate Implementation (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/server/src/routes/staff.ts">server/src/routes/staff.ts</a>)</div>
  <pre><code>// Step 1: Transition Matrix Validation (Disallowed transitions return HTTP 400 INVALID_TRANSITION)
const VALID_TRANSITIONS: Record&lt;string, string[]&gt; = {
  NEW: ['OPEN', 'IN_PROGRESS', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  WAITING_FOR_REQUESTER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'WAITING_FOR_REQUESTER', 'RESOLVED', 'CANCELLED'],
  CANCELLED: [],
};
if (!allowedNext.includes(targetStatus)) {
  res.status(400).json({ error: { code: 'INVALID_TRANSITION', message: \`Cannot transition ticket from \${ticket.currentStatus} to \${targetStatus}.\` } });
  return;
}

// Step 2: 4-Condition Resolution Gate (Evaluated when targetStatus === 'RESOLVED'; failures return HTTP 422 RESOLUTION_GATE_FAILED)
if (targetStatus === 'RESOLVED') {
  if (!ticket.ownerId) {
    res.status(422).json({ error: { code: 'RESOLUTION_GATE_FAILED', reason: 'OWNER_REQUIRED', message: 'Resolution Gate Failed: Ticket must have an assigned IT Staff owner before it can be resolved.' } });
    return;
  }
  if (!ticket.itPriority) {
    res.status(422).json({ error: { code: 'RESOLUTION_GATE_FAILED', reason: 'PRIORITY_REQUIRED', message: 'Resolution Gate Failed: IT Priority must be assigned before resolving a ticket.' } });
    return;
  }
  const validActions = ticket.actionsTaken.filter((a) =&gt; a.status === 'COMPLETED' &amp;&amp; a.result &amp;&amp; a.result.trim().length &gt; 0);
  if (validActions.length === 0) {
    res.status(422).json({ error: { code: 'RESOLUTION_GATE_FAILED', reason: 'COMPLETED_ACTION_REQUIRED', message: 'Resolution Gate Failed: At least one COMPLETED Action Taken with a recorded result is required before resolving a ticket.' } });
    return;
  }
  const openFollowUps = ticket.actionsTaken.filter((a) =&gt; a.followUpRequired &amp;&amp; a.status !== 'COMPLETED');
  if (openFollowUps.length &gt; 0) {
    res.status(422).json({ error: { code: 'RESOLUTION_GATE_FAILED', reason: 'OPEN_FOLLOW_UPS_EXIST', message: 'Resolution Gate Failed: All Actions Taken requiring follow-up must be completed before resolving the ticket.' } });
    return;
  }
}</code></pre>
</div>

<!-- ========================================================================== -->
<!-- PAGE 13: Answer Part 8 (Requester Dashboard Desktop, Drill-Down, Tablet/Mob)-->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-title">Answer Part 8: Working Requester Dashboard and Final Regression UI (5 pt)</div>
  <p style="margin: 2px 0 4px 0;">
    The Requester Dashboard (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/client/src/components/requester/RequesterDashboard.tsx">RequesterDashboard.tsx</a>) provides requesters with real-time personal ticket counters, an actionable feedback alert banner, and 1-click drill-down into their filtered ticket list.
  </p>

  <div class="evidence-figure">
    <img src="${imgReqDesktop}" class="evidence-img" style="max-height: 265px;" alt="Requester Dashboard Desktop" />
    <div class="caption">Figure 8.1: Requester Dashboard (Desktop 1440px) for <code>Jennifer Anderson</code> showing Personal Metric Cards (Open Tickets: 4, Waiting for My Feedback: 1, Recently Resolved [30d]: 0, Closed Tickets: 1), prominent amber "Action Required on Your Tickets" banner, My Recent Tickets list, and Quick Actions.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgReqDrilldown}" class="evidence-img" style="max-height: 235px;" alt="Requester Dashboard Drill-Down to Filtered My Tickets" />
    <div class="caption">Figure 8.1B: Requester Dashboard Card Drill-Down Navigation (<code>AC-24, FR-20</code>). Clicking the "Waiting for My Feedback (1)" card navigates to <code>My IT Support Tickets</code> with active filter pill <code>Filtered by Status: Waiting for My Feedback &times; Clear</code>, showing <code>Showing 1 to 1 of 1 tickets</code> (<code>TKT-2026-001230</code>) and the bottom pagination bar.</div>
  </div>

  <div class="grid-2" style="margin-top: 4px;">
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgReqTablet}" class="evidence-img" style="max-height: 205px;" alt="Requester Dashboard Tablet" />
      <div class="caption">Figure 8.2: Requester Dashboard (Tablet 768px) with 2-column card grid.</div>
    </div>
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgReqMobile}" class="evidence-img" style="max-height: 205px;" alt="Requester Dashboard Mobile" />
      <div class="caption">Figure 8.3: Requester Dashboard (Mobile 360px) with single-column stack and 0px overflow.</div>
    </div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 14: Answer Part 8 (Regression: Login, My Tickets, Ticket Detail)      -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-subtitle" style="margin-top: 0;">8.1 Labs 1–3 End-to-End Regression Verification (Authentication, My Tickets, Ticket Detail)</div>

  <div class="evidence-figure">
    <img src="${imgRegLogin}" class="evidence-img" style="max-height: 235px;" alt="Authentication and Login Flow" />
    <div class="caption">Figure 8.4: Authentication &amp; Login Screen Regression (Lab 3) showing email and password inputs, Sign In button, and 1-click demo credential cards for Requester, IT Staff, and Admin roles.</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgRegMyTickets}" class="evidence-img" style="max-height: 255px;" alt="My Tickets List and Filtering" />
    <div class="caption">Figure 8.5: Requester My IT Support Tickets Regression (Lab 2) displaying keyword search bar, Filters toggle button, status/priority pills, ticket rows (<code>Showing 1 to 5 of 5 tickets</code>), and the bottom pagination bar (<code>&lt; Previous | 1 | Next &gt;</code>).</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgRegTicketDetail}" class="evidence-img" style="max-height: 255px;" alt="Ticket Detail View" />
    <div class="caption">Figure 8.6: Requester Ticket Detail View Regression (Lab 2) on <code>TKT-2026-001234</code> showing ticket metadata fields, advisory <code>Problem Appears Resolved</code> button, and navigation tabs (<code>Public Comments (2)</code>, <code>Actions Taken</code>, <code>Status History (3)</code>, <code>Attachments (0)</code>).</div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 15: Answer Part 8 (Attachments, Public Comments vs Internal Notes)    -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-subtitle" style="margin-top: 0;">8.2 Attachments, Shared Public Comments vs. Confidential Internal Notes, and RBAC Regression</div>

  <div class="evidence-figure">
    <img src="${imgRegAttachments}" class="evidence-img" style="max-height: 215px;" alt="Authenticated Attachments and Size Validation" />
    <div class="caption">Figure 8.7: Attachment Upload, Download &amp; Size Validation Regression (Lab 2) confirming uploaded file <code>battery_diagnostics_report.pdf (45.0 KB)</code> with explicit <code>Download</code> and <code>Remove</code> buttons alongside the inline size-limit rejection banner (<code>File "high_res_screen_capture.pdf" exceeds the 5 MB size limit (6.20 MB).</code>).</div>
  </div>

  <div class="evidence-figure">
    <img src="${imgRegComments}" class="evidence-img" style="max-height: 245px;" alt="Public Comments vs Private Internal Notes Comparison" />
    <div class="caption">Figure 8.8: Shared Public Comments vs. Private Internal Notes Visual Separation (Handout &sect;7) showing shared Public Comments (left: white surface <code>#FFFFFF</code>, Zen Green <code>#006B3C</code> top border, <code>SHARED &bull; Visible to Requester</code> badge) beside confidential Private Internal Notes (right: warm amber surface <code>#FFFBEB</code>, solid amber border <code>#D97706</code>, lock icon, and <code>CONFIDENTIAL &bull; IT Staff &amp; Admins Only</code> badge).</div>
  </div>

  <div class="grid-2" style="margin-top: 4px;">
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgRegInternalNotes}" class="evidence-img" style="max-height: 220px;" alt="Private Internal Notes Close-Up" />
      <div class="caption">Figure 8.9: Private Internal Notes Card Close-Up verifying warm amber surface (<code>#FFFBEB</code>), solid border (<code>#D97706</code>), non-overlapping header layout, and <code>CONFIDENTIAL &bull; IT Staff &amp; Admins Only</code> badge.</div>
    </div>
    <div class="evidence-figure" style="width: 100%; margin: 0;">
      <img src="${imgRegAdmin}" class="evidence-img" style="max-height: 220px;" alt="Administrator User Management" />
      <div class="caption">Figure 8.10: Administrator User Management Regression (Lab 3) showing user directory, role badges, active/inactive status pills, and <code>+ Create New User</code> control.</div>
    </div>
  </div>
</div>

<!-- ========================================================================== -->
<!-- PAGE 16: Answer Part 8.5 (Access Isolation) + Part 9 (Tokens, Checklist)   -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="evidence-figure">
    <img src="${imgRegDenied}" class="evidence-img" style="max-height: 215px;" alt="Requester Access Isolation" />
    <div class="caption">Figure 8.11: Requester Access Isolation Regression (Lab 3, <code>BR-08</code>) captured from a real authenticated Requester session (<code>Jennifer Anderson, Role: Requester</code> visible in the top navigation bar) attempting to access <code>#/staff/queue</code>, displaying the real backend <code>403 Forbidden</code> rejection banner.</div>
  </div>

  <div class="part-title" style="margin-top: 8px;">Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish (5 pt)</div>

  <div class="part-subtitle">9.1 Zen Green &amp; Confidential Amber Design Tokens (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/client/src/index.css">client/src/index.css</a>)</div>
  <table>
    <thead>
      <tr><th>Token / Component</th><th>Hex Values</th><th>Swatch</th><th>Semantic Usage &amp; Contrast Verification</th></tr>
    </thead>
    <tbody>
      <tr><td><code>--color-primary-forest</code></td><td><code>#006B3C</code> / <code>#FFFFFF</code></td><td><span style="display:inline-block;width:22px;height:10px;background:#006B3C;border-radius:2px;"></span></td><td>Navbar, primary buttons, shared Public Comments top border (Contrast: <strong>8.4:1 AAA</strong>)</td></tr>
      <tr><td><code>--color-primary-accent</code></td><td><code>#008751</code> / <code>#F0FDF4</code></td><td><span style="display:inline-block;width:22px;height:10px;background:#008751;border-radius:2px;"></span></td><td>Interactive hover states, resolved status badges, <code>SHARED &bull; Visible to Requester</code> pill</td></tr>
      <tr><td><code>--color-confidential-amber</code></td><td><code>#FFFBEB</code> / <code>#D97706</code> / <code>#92400E</code></td><td><span style="display:inline-block;width:22px;height:10px;background:#FFFBEB;border:2px solid #D97706;border-radius:2px;"></span></td><td>Private Internal Notes card surface, 2px solid border, and <code>CONFIDENTIAL &bull; IT Staff &amp; Admins Only</code> badge</td></tr>
      <tr><td><code>--color-error-crimson</code></td><td><code>#FEF2F2</code> / <code>#DC2626</code> / <code>#991B1B</code></td><td><span style="display:inline-block;width:22px;height:10px;background:#DC2626;border-radius:2px;"></span></td><td>Inline field validation errors, 409 conflict alerts, 422 Resolution Gate rejection banners</td></tr>
    </tbody>
  </table>

  <div class="part-subtitle">9.2 Completed Visual, Responsive &amp; Accessibility Checklist (Strictly Evidenced Items Ticked)</div>
  <table>
    <thead>
      <tr><th style="width: 14%;">Status</th><th style="width: 30%;">Checklist Item</th><th style="width: 56%;">Automated Test / Code Verification Evidence</th></tr>
    </thead>
    <tbody>
      <tr><td><span class="badge badge-pass">[x] VERIFIED</span></td><td><strong>WCAG 2.1 AA Color Contrast (&ge; 4.5:1)</strong></td><td>Verified via <code>@axe-core/playwright</code> in <code>e2e/lab-04/dashboards.spec.ts</code> across Staff and Requester Dashboards (<strong>0 Violations</strong>; primary green <code>#006B3C</code> = 8.4:1).</td></tr>
      <tr><td><span class="badge badge-pass">[x] VERIFIED</span></td><td><strong>Zero Horizontal Overflow (360px, 768px, 1280px)</strong></td><td>Verified via Playwright assertions <code>scrollWidth &le; clientWidth</code> across all 3 browser engines in <code>e2e/lab-04/dashboards.spec.ts</code> (18/18 viewport runs PASS).</td></tr>
      <tr><td><span class="badge badge-pass">[x] VERIFIED</span></td><td><strong>Explicit SVG Dimensions (&le; 64px Guard)</strong></td><td>All 52 inline SVGs have explicit <code>width</code>/<code>height</code> attributes; verified by Playwright bounding-box test in <code>e2e/lab-04/dashboards.spec.ts</code>.</td></tr>
      <tr><td><span class="badge badge-pass">[x] VERIFIED</span></td><td><strong>Form Labels, <code>aria-invalid</code> &amp; <code>aria-describedby</code></strong></td><td>Every input has an explicit <code>&lt;label htmlFor&gt;</code>; field-level errors link via <code>aria-describedby</code> and assert in <code>client/src/tests/lab-04/ActionsTaken.test.tsx</code> (<code>TEST-UI-ACT-05</code>).</td></tr>
      <tr><td><span class="badge badge-pass">[x] VERIFIED</span></td><td><strong>Shared vs. Private Note Visual Distinction</strong></td><td>Verified in Figures 8.8 &amp; 8.9: Zen Green shared comments vs. Confidential Amber (<code>#FFFBEB</code> / <code>#D97706</code>) internal notes.</td></tr>
      <tr><td><span class="badge badge-pass">[x] VERIFIED</span></td><td><strong>Unified Timestamp Locale (<code>Asia/Bangkok</code>)</strong></td><td>All 9 date formatters across client components use <code>toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', ... })</code>.</td></tr>
      <tr><td><span class="badge badge-na">[ ] N/A (Inline)</span></td><td><strong>Action Taken Modal Focus Trap</strong></td><td><em>Unticked (Not Applicable)</em>: Actions Taken create/edit uses an inline collapsible form panel inside the page flow rather than a modal dialog overlay. (Mandatory password modal Escape guard is tested in <code>ChangePasswordModal-mandatory.test.tsx</code>.)</td></tr>
    </tbody>
  </table>
</div>

<!-- ========================================================================== -->
<!-- PAGE 17: Answer Part 9.3, 9.4, 9.5 (SQL Parity Table, Full Test Matrix)    -->
<!-- ========================================================================== -->
<div class="page-break"></div>

<div class="part-section">
  <div class="part-subtitle" style="margin-top: 0; margin-bottom: 2px;">9.3 Dashboard Metrics vs. Direct PostgreSQL Queries Parity Matrix (<a href="https://github.com/pimchayasupr-hash/toktickit/blob/main/server/tests/lab-04/metrics-vs-db.test.ts">metrics-vs-db.test.ts</a>)</div>
  <p style="margin: 1px 0 2px 0; font-size: 7.3pt;">
    Both dashboards use the exact same active-open status set <code>ACTIVE_OPEN = ('NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED')</code>, and <code>recentlyResolvedCount</code> enforces the 30-day rolling window (<code>updatedAt &ge; NOW() - INTERVAL '30 days'</code>):
  </p>
  <table style="font-size: 6.2pt; line-height: 1.12;">
    <thead>
      <tr><th>Dashboard</th><th>Metric Card</th><th>API Field</th><th>Direct PostgreSQL Query Equivalent</th><th>UI / API / DB</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>IT Staff</strong></td><td>Unassigned</td><td><code>unassignedCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "ownerId" IS NULL AND "currentStatus" IN ('NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED')</code></td><td><strong>4 / 4 / 4</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
      <tr><td><strong>IT Staff</strong></td><td>My Assigned</td><td><code>myAssignedCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "ownerId" = 7 AND "currentStatus" IN ('NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED')</code></td><td><strong>4 / 4 / 4</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
      <tr><td><strong>IT Staff</strong></td><td>High &amp; Urgent</td><td><code>urgentCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "itPriority" = 'URGENT' AND "currentStatus" IN ('NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED')</code></td><td><strong>2 / 2 / 2</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
      <tr><td><strong>IT Staff</strong></td><td>Open Total</td><td><code>openTotalCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "currentStatus" IN ('NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED')</code></td><td><strong>13 / 13 / 13</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
      <tr><td><strong>Requester</strong></td><td>Open Tickets</td><td><code>openTicketsCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "requesterId" = 1 AND "currentStatus" IN ('NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED')</code></td><td><strong>4 / 4 / 4</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
      <tr><td><strong>Requester</strong></td><td>Waiting for Feedback</td><td><code>waitingForRequesterCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "requesterId" = 1 AND "currentStatus" = 'WAITING_FOR_REQUESTER'</code></td><td><strong>1 / 1 / 1</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
      <tr><td><strong>Requester</strong></td><td>Recently Resolved (30d)</td><td><code>recentlyResolvedCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "requesterId" = 1 AND "currentStatus" = 'RESOLVED' AND "updatedAt" &ge; NOW() - INTERVAL '30 days'</code></td><td><strong>0 / 0 / 0</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
      <tr><td><strong>Requester</strong></td><td>Closed Tickets</td><td><code>closedTicketsCount</code></td><td><code>SELECT COUNT(*) FROM "Ticket" WHERE "requesterId" = 1 AND "currentStatus" = 'CLOSED'</code></td><td><strong>1 / 1 / 1</strong></td><td><span class="badge badge-pass">EXACT MATCH</span></td></tr>
    </tbody>
  </table>

  <div class="part-subtitle" style="margin-top: 4px; margin-bottom: 2px;">9.4 Complete Automated Test Suite Execution Matrix (196 Unique Tests / 220 Total Runs PASS)</div>
  <table style="font-size: 6.2pt; line-height: 1.12;">
    <thead>
      <tr><th>Layer</th><th>Test Suite File Path</th><th>Target Capability &amp; Regression Scope Verified</th><th>Passing / Total</th></tr>
    </thead>
    <tbody>
      <tr><td>Server API</td><td><code>server/tests/lab-04/actions-taken.api.test.ts</code></td><td>Action Taken CRUD, 4-State Lifecycle, Active Assignee FK, Atomic OCC (409), 404 on DELETE</td><td><span class="badge badge-pass">22 / 22 PASS</span></td></tr>
      <tr><td>Server API</td><td><code>server/tests/lab-04/ticket-workflow.api.test.ts</code></td><td>2-Step Matrix (400) &amp; Resolution Gate (422), Ticket OCC (409), Append-Only Status History</td><td><span class="badge badge-pass">14 / 14 PASS</span></td></tr>
      <tr><td>Server API</td><td><code>server/tests/lab-04/staff-dashboard.api.test.ts</code></td><td>Staff Metrics, Urgent Queue, Recent Actions, 403 Forbidden Requester Guard</td><td><span class="badge badge-pass">8 / 8 PASS</span></td></tr>
      <tr><td>Server API</td><td><code>server/tests/lab-04/requester-dashboard.api.test.ts</code></td><td>Requester Isolation, Personal Metrics, 30-Day Resolved Window, Feedback Banner</td><td><span class="badge badge-pass">8 / 8 PASS</span></td></tr>
      <tr><td>Server API</td><td><code>server/tests/lab-04/metrics-vs-db.test.ts</code></td><td>Direct PostgreSQL Count Parity vs. Staff &amp; Requester Dashboard Endpoints</td><td><span class="badge badge-pass">2 / 2 PASS</span></td></tr>
      <tr><td>Server API</td><td><code>server/tests/lab-03/*.test.ts</code> (11 suites)</td><td>RBAC Matrix (9/9), Admin Users (8/8), Password Complexity (4/4), Auth (9/9), Comments/Notes (16/16), etc.</td><td><span class="badge badge-pass">61 / 61 PASS</span></td></tr>
      <tr><td>Server API</td><td><code>server/tests/lab-01/ &amp; lab-02/*.test.ts</code> (13 suites)</td><td>Health Check, Ticket Creation, Ticket Detail, Attachments, Idempotency, Validators</td><td><span class="badge badge-pass">29 / 29 PASS</span></td></tr>
      <tr><td>Client UI</td><td><code>client/src/tests/lab-04/*.test.tsx</code> (4 suites)</td><td><code>ActionsTaken.test.tsx</code> (4/4), <code>StaffDashboard.test.tsx</code> (2/2), <code>RequesterDashboard.test.tsx</code> (1/1), <code>TicketWorkflow.test.tsx</code> (1/1)</td><td><span class="badge badge-pass">8 / 8 PASS</span></td></tr>
      <tr><td>Client UI</td><td><code>client/src/tests/lab-02/ &amp; lab-03/*.test.tsx</code> (13 suites)</td><td>Login, Mandatory Password Modal, Staff Queue, Staff Detail, My Tickets, Attachments, Admin Users</td><td><span class="badge badge-pass">32 / 32 PASS</span></td></tr>
      <tr><td>Playwright E2E</td><td><code>e2e/lab-04/actions-taken-flow.spec.ts</code></td><td>Action Lifecycle, Assignee, and Requester Read-Only across Chromium, Firefox, WebKit</td><td><span class="badge badge-pass">6 / 6 PASS (2&times;3)</span></td></tr>
      <tr><td>Playwright E2E</td><td><code>e2e/lab-04/ticket-resolution.spec.ts</code></td><td>Resolution Gate 422 Rejection &amp; 200 Success Path across Chromium, Firefox, WebKit</td><td><span class="badge badge-pass">6 / 6 PASS (2&times;3)</span></td></tr>
      <tr><td>Playwright E2E</td><td><code>e2e/lab-04/dashboards.spec.ts</code></td><td>Responsive Viewports (360px/768px/1280px), SVG &le; 64px Guard, Axe-core WCAG AA across 3 Browsers</td><td><span class="badge badge-pass">24 / 24 PASS (8&times;3)</span></td></tr>
      <tr><td><strong>Grand Total</strong></td><td><strong>49 Test Suites + <code>check-traceability.py</code></strong></td><td><strong>196 Unique Automated Tests / 220 Cross-Browser Executions</strong></td><td><span class="badge badge-pass">100% PASS</span></td></tr>
    </tbody>
  </table>

  <div class="part-subtitle" style="margin-top: 4px; margin-bottom: 2px;">9.5 Engineering Submission Verification Sign-Off</div>
  <table style="font-size: 6.2pt; line-height: 1.12;">
    <thead>
      <tr><th>Role</th><th>GitHub Identity</th><th>Verification &amp; Governance Record</th><th>Current Status</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Author</strong></td><td><a href="https://github.com/pimchayasupr-hash">@pimchayasupr-hash</a></td><td>Full Spec DD, Test DD (196 tests / 220 runs PASS), committed raw logs, and verified screenshots</td><td><span class="badge badge-pass">Verified &amp; Packaged</span></td></tr>
      <tr><td><strong>Peer Reviewer 1</strong></td><td><a href="https://github.com/MiMikoChAn913">@MiMikoChAn913</a></td><td>Reviewed <a href="https://github.com/pimchayasupr-hash/toktickit/pull/55">PR #55</a> (<code>PRR_kwDOTzBGN88AAAABVHAK1A</code>); all 5 P1/P2 findings resolved and re-verified</td><td><span class="badge badge-pass">Approved (Round 2)</span></td></tr>
      <tr><td><strong>Peer Reviewer 2</strong></td><td><a href="https://github.com/supa-gif173">@supa-gif173</a></td><td>Approved &amp; merged <a href="https://github.com/pimchayasupr-hash/toktickit/pull/55">PR #55</a> (<code>84720dc</code>), <a href="https://github.com/pimchayasupr-hash/toktickit/pull/56">PR #56</a> (<code>86f4516</code>), and <a href="https://github.com/pimchayasupr-hash/toktickit/pull/57">PR #57</a> (<code>83b3cbc</code>, Review <code>PRR_kwDOTzBGN88AAAABVROROQ</code>)</td><td><span class="badge badge-pass">APPROVED &amp; MERGED (PR #55, #56, #57)</span></td></tr>
    </tbody>
  </table>
</div>

</body>
</html>`;

  const htmlPath = path.resolve(__dirname, '..', 'artifacts/lab-04/submission/Lab4_Submission.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Saved HTML to ${htmlPath}`);

  console.log('Launching Playwright Chromium to print Lab4_Submission.pdf...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  const pdfPath = path.resolve(__dirname, '..', 'artifacts/lab-04/submission/Lab4_Submission.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '11mm',
      bottom: '11mm',
      left: '11mm',
      right: '11mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7.2pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: right; padding-right: 11mm;">CPE 334 Introduction to Software Engineering in the Age of AI Agents &mdash; TokTickIT Lab 4</div>',
    footerTemplate: '<div style="font-size: 7.2pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });

  await browser.close();
  const stats = fs.statSync(pdfPath);
  console.log(`PDF successfully generated at: ${pdfPath}`);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // Copy identical PDF to docs/lab-04/LAB4_SUBMISSION.pdf and ./LAB4_SUBMISSION.pdf
  const docsPdfPath = path.resolve(__dirname, '..', 'docs/lab-04/LAB4_SUBMISSION.pdf');
  const rootPdfPath = path.resolve(__dirname, '..', 'LAB4_SUBMISSION.pdf');
  fs.copyFileSync(pdfPath, docsPdfPath);
  fs.copyFileSync(pdfPath, rootPdfPath);
  console.log(`Copied identical PDF to:`);
  console.log(`  - ${docsPdfPath}`);
  console.log(`  - ${rootPdfPath}`);
}

buildPdf().catch(err => {
  console.error('Error building PDF:', err);
  process.exit(1);
});
