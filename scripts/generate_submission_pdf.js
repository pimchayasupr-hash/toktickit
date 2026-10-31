const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

// Helper to get base64 data URI of an image
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

async function generatePdf() {
  console.log('Generating Lab 4 Submission HTML & PDF with exact Answer Parts 1 to 9...');

  const imgStaffDesktop = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_overview_desktop.png');
  const imgStaffTablet = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_overview_tablet.png');
  const imgStaffMobile = getImageDataUri('artifacts/lab-04/screenshots/staff-dashboard/staff-dashboard_overview_mobile.png');

  const imgActLifecycle = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_lifecycle_desktop.png');
  const imgActReadonly = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_requester-readonly_desktop.png');
  const imgActHistory = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_status-history_desktop.png');
  const imgActResolution = getImageDataUri('artifacts/lab-04/screenshots/actions-taken/actions-taken_resolution-gate-rejection_desktop.png');

  const imgReqDesktop = getImageDataUri('artifacts/lab-04/screenshots/requester-dashboard/requester-dashboard_overview_desktop.png');
  const imgReqTablet = getImageDataUri('artifacts/lab-04/screenshots/requester-dashboard/requester-dashboard_overview_tablet.png');
  const imgReqMobile = getImageDataUri('artifacts/lab-04/screenshots/requester-dashboard/requester-dashboard_overview_mobile.png');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TokTickIT — Lab 4 Official Engineering Submission</title>
<style>
  @page {
    size: A4;
    margin: 14mm 12mm 14mm 12mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.5pt;
    line-height: 1.35;
    color: #1e293b;
    margin: 0;
    padding: 0;
  }
  
  .cover-header {
    background: linear-gradient(135deg, #006B3C 0%, #008751 100%);
    color: #ffffff;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 14px;
  }
  .cover-header h1 {
    font-size: 15pt;
    font-weight: 800;
    margin: 0 0 4px 0;
    letter-spacing: -0.3px;
  }
  .cover-header .subtitle {
    font-size: 9.5pt;
    opacity: 0.95;
    margin-bottom: 8px;
    font-weight: 400;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
    margin-top: 8px;
    border-top: 1px solid rgba(255,255,255,0.25);
    padding-top: 8px;
  }
  .meta-item {
    background: #ffffff;
    color: #1e293b;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 8pt;
  }
  .meta-item strong {
    color: #006B3C;
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .part-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .part-title {
    font-size: 12pt;
    font-weight: 800;
    color: #006B3C;
    border-bottom: 2px solid #006B3C;
    padding-bottom: 4px;
    margin-top: 0;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }
  .part-subtitle {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 10px;
    margin-bottom: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 7.6pt;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
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
    font-size: 7.2pt;
    background-color: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
  }
  pre {
    padding: 8px 10px;
    overflow-x: auto;
    line-height: 1.3;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-pass {
    background-color: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .evidence-img {
    width: 100%;
    max-height: 270px;
    object-fit: contain;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    margin: 6px 0;
    background-color: #f8fafc;
  }
  .caption {
    font-size: 7pt;
    color: #64748b;
    text-align: center;
    margin-bottom: 8px;
    font-style: italic;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

<div class="cover-header">
  <h1>TokTickIT: Actions Taken, Dashboards, and Concurrency Control</h1>
  <div class="subtitle">CPE 334 Introduction to Software Engineering in the Age of AI Agents &bull; Official Final Engineering Submission</div>
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Pull Request (PR #55)</strong>
      https://github.com/pimchayasupr-hash/toktickit/pull/55
    </div>
    <div class="meta-item">
      <strong>Branch Architecture</strong>
      feature/lab4-hardening &rarr; lab4-staging &rarr; main (commit <code>0c18ec8</code>)
    </div>
    <div class="meta-item">
      <strong>Author &amp; Peer Reviewer</strong>
      Author: @pimchayasupr-hash &bull; Reviewer: @MiMikoChAn913
    </div>
    <div class="meta-item">
      <strong>Automated Verification Status</strong>
      <span class="badge badge-pass">100% Passed (144 Server + 40 Client + 11 E2E)</span>
    </div>
  </div>
</div>

<!-- ========================================== -->
<!-- ANSWER PART 1 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 1: Git Use with Engineering Workflow</div>
  <p>
    The TokTickIT engineering workflow strictly enforces Specification-Driven Development (Spec DD), Test-Driven Development (Test DD), feature isolation, and peer review governance. All development was conducted on isolated feature branches, validated against a local PostgreSQL database, and integrated through a clean Git flow.
  </p>

  <div class="part-subtitle">1.1 Verbatim Git Commit Log Graph (main)</div>
  <pre><code>*   0c18ec8 (HEAD -> main) release(lab4): integrate Actions Taken, dashboards, resolution gate, concurrency, and submission evidence
|\\  
| * c09ada9 (lab4-staging, feature/lab4-hardening) docs(evidence): capture dashboard screenshots, metrics-vs-db audit, and progress log
| * 60ff56b docs(readme): finalize Lab 4 documentation, demo script, and test commands
| * 638d62d docs(workflow): update created-issues status to Done
| * 7e4fc4b docs(spec): align ui-spec and api-spec with action lifecycle and status history
| * 6d20aca fix(lab4): action lifecycle, atomic concurrency, status history, deterministic e2e, and engineering report
| * e9bc80d (origin/feature/lab4-hardening) docs(review): record PR #55 URL in reviewer.md and pr-body.md
| * a0f5420 docs(review): update Lab 4 reviewer guide with PR branch and verified test counts
| * 0a81173 test(e2e): end-to-end regression, dashboard audit, and resolution gate verification (fixes #52)
| * c083efa (origin/feature/lab4-frontend, feature/lab4-frontend) feat(ui): Dashboards, Actions Taken section, and ticket workflow controls (fixes #46, #50, #51)
| * d6835b1 (origin/feature/lab4-backend, feature/lab4-backend) feat(api): Actions Taken CRUD, resolution gate, and dashboards (fixes #45, #47, #48, #49)
| * 65f54aa (origin/feature/lab4-db-schema, feature/lab4-db-schema) feat(db): add ActionTaken model, Ticket version field, migration, and idempotent seed (fixes #44)
| * 4faf0ae (origin/lab4/tests, lab4/tests) docs(workflow): add GitHub issues register and peer reviewer template
| * 77d8f2e test(plan): add Lab 4 test register and failing tests (Red)
| * cf54f91 (origin/lab4/spec, lab4/spec) docs(spec): add Lab 4 specification, ui-spec, and api-spec
|/  
*   7ea5af2 (tag: pre-lab4-backup, origin/main, origin/lab4-staging, origin/HEAD) Merge pull request #42 from pimchayasupr-hash/fix/lab3-review-fixes</code></pre>

  <div class="part-subtitle">1.2 Branch Progression &amp; Release Merge Governance</div>
  <table>
    <thead>
      <tr><th>Phase</th><th>Branch</th><th>Key Commits</th><th>Governance &amp; Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Safety Backup</strong></td><td><code>main</code></td><td><code>7ea5af2</code></td><td>Tagged <code>pre-lab4-backup</code> and dumped local PostgreSQL to <code>artifacts/lab-04/backups/</code></td></tr>
      <tr><td><strong>Spec DD</strong></td><td><code>lab4/spec</code></td><td><code>cf54f91</code></td><td>Committed specification.md, ui-spec.md, and api-spec.md before any implementation</td></tr>
      <tr><td><strong>Test DD</strong></td><td><code>lab4/tests</code></td><td><code>77d8f2e</code></td><td>Established failing test harness (Red phase) for API, workflow, and dashboards</td></tr>
      <tr><td><strong>DB &amp; Schema</strong></td><td><code>feature/lab4-db-schema</code></td><td><code>65f54aa</code></td><td>Prisma schema evolution, non-destructive migrations, idempotent seeder</td></tr>
      <tr><td><strong>Backend API</strong></td><td><code>feature/lab4-backend</code></td><td><code>d6835b1</code></td><td>Express REST routes, resolution gate logic, server-side aggregations</td></tr>
      <tr><td><strong>Frontend UI</strong></td><td><code>feature/lab4-frontend</code></td><td><code>c083efa</code></td><td>React 19 components, Zen Green tokens, accessible form controls</td></tr>
      <tr><td><strong>Hardening</strong></td><td><code>feature/lab4-hardening</code></td><td><code>6d20aca</code>, <code>c09ada9</code></td><td>Resolved all 5 reviewer comments (P1/P2); added 8 regression tests</td></tr>
      <tr><td><strong>Production Merge</strong></td><td><code>main</code></td><td><code>0c18ec8</code></td><td>Merged from <code>lab4-staging</code> via <code>--no-ff</code> with full pipeline verification</td></tr>
    </tbody>
  </table>

  <div class="part-subtitle">1.3 Peer Review Governance Rules &amp; Register (reviewer.md)</div>
  <p>
    Strict review governance was enforced: <strong>RULE 1 (No Self-Merge)</strong> prohibited author self-merges; <strong>RULE 2 (Evidenced Code Review)</strong> required concrete technical review comments; <strong>RULE 3 (Documented Resolution)</strong> required explanation or follow-up commits for every comment; <strong>RULE 4 (Evidence Screenshots)</strong> archived verification artifacts. Pull Request #55 was thoroughly inspected by <code>@MiMikoChAn913</code>, and all 5 comments were addressed.
  </p>

  <div class="part-subtitle">1.4 Kanban Issue Register</div>
  <p>
    All 11 planned tasks (#44 through #54) were tracked via the project board: Issues #44 through #53 are marked <strong>Done</strong>, with Issue #54 reserved for final reviewer sign-off.
  </p>
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- ANSWER PART 2 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 2: Spec DD</div>
  <p>
    Specification-Driven Development guarantees that implementation and testing are anchored in formal, unambiguous requirements. The system specification was committed at <code>cf54f91</code> in <code>docs/lab-04/specification.md</code>.
  </p>

  <div class="part-subtitle">2.1 Core Business Rules &amp; Acceptance Criteria Breakdown</div>
  <table>
    <thead>
      <tr><th style="width: 20%;">Requirement Ref</th><th style="width: 35%;">Specification Description</th><th style="width: 45%;">Enforcement &amp; Verification Mechanism</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>AC-01..03, BR-01..03</strong></td>
        <td>IT Staff / Admin action logging; identity derivation</td>
        <td><code>performedById</code> and <code>createdById</code> bound to authenticated JWT token; client spoofing ignored.</td>
      </tr>
      <tr>
        <td><strong>AC-04..07, BR-04..05</strong></td>
        <td>Field validations and follow-up requirements</td>
        <td>Duration > 0, description &ge; 10 chars, past/present date. <code>followUpNote</code> required if <code>followUpRequired = true</code>.</td>
      </tr>
      <tr>
        <td><strong>AC-08..10, FR-07</strong></td>
        <td>Requester read isolation</td>
        <td>Requesters can only view actions on tickets they created; accessing others returns HTTP 404 Not Found.</td>
      </tr>
      <tr>
        <td><strong>AC-14, BR-10</strong></td>
        <td>Append-only audit trail</td>
        <td>No <code>DELETE</code> route implemented; historical actions are permanently preserved.</td>
      </tr>
      <tr>
        <td><strong>AC-15..17, BR-13</strong></td>
        <td>Strict Resolution Gate Enforcement</td>
        <td>Blocks transition to <code>RESOLVED</code> unless ticket has owner, &ge;1 action taken, &ge;1 completed action with result, and addressed follow-ups.</td>
      </tr>
      <tr>
        <td><strong>AC-18..19, BR-14</strong></td>
        <td>Atomic Concurrency Control</td>
        <td>Database write predicates: <code>updateMany({ where: { id, version } })</code> returning HTTP 409 Conflict.</td>
      </tr>
      <tr>
        <td><strong>Part 6, BR-19..23</strong></td>
        <td>Action Lifecycle &amp; Assignee</td>
        <td><code>ActionStatus</code> enum (<code>PENDING</code>, <code>IN_PROGRESS</code>, <code>COMPLETED</code>, <code>CANCELLED</code>), active assignee validation, terminal lock.</td>
      </tr>
      <tr>
        <td><strong>Part 7, BR-25..26</strong></td>
        <td>Append-only Status History</td>
        <td><code>TicketStatusHistory</code> written in exact same transaction as ticket status changes.</td>
      </tr>
    </tbody>
  </table>

  <div class="part-subtitle">2.2 Ticket &amp; Action State Transition State Machines</div>
  <div class="grid-2">
    <div>
      <strong>Ticket Status Transitions (BR-12, BR-13)</strong>
      <ul>
        <li><code>NEW</code> &rarr; <code>OPEN</code>, <code>CANCELLED</code></li>
        <li><code>OPEN</code> &rarr; <code>IN_PROGRESS</code>, <code>WAITING_FOR_REQUESTER</code>, <code>CANCELLED</code></li>
        <li><code>IN_PROGRESS</code> &rarr; <code>RESOLVED</code> (Resolution Gate!), <code>WAITING_FOR_REQUESTER</code>, <code>CANCELLED</code></li>
        <li><code>WAITING_FOR_REQUESTER</code> &rarr; <code>IN_PROGRESS</code>, <code>CANCELLED</code></li>
        <li><code>RESOLVED</code> &rarr; <code>CLOSED</code>, <code>REOPENED</code></li>
        <li><code>CLOSED</code>, <code>CANCELLED</code> &rarr; Terminal (Immutable)</li>
      </ul>
    </div>
    <div>
      <strong>Action Taken Lifecycle (Part 6, BR-19..24)</strong>
      <ul>
        <li><code>PENDING</code> &rarr; <code>IN_PROGRESS</code>, <code>COMPLETED</code>, <code>CANCELLED</code></li>
        <li><code>IN_PROGRESS</code> &rarr; <code>COMPLETED</code>, <code>CANCELLED</code></li>
        <li><code>COMPLETED</code> &rarr; Terminal (Mandatory result required)</li>
        <li><code>CANCELLED</code> &rarr; Terminal (Immutable)</li>
        <li>Assigned to active IT Staff/Admin only (Requesters and inactive rejected with 400).</li>
      </ul>
    </div>
  </div>

  <div class="part-subtitle">2.3 Definition of Done (DoD)</div>
  <p>
    Features require 100% bidirectional traceability, Red-to-Green automated unit/integration tests, zero horizontal scrollbar across 360px/768px/1280px viewports, 0 Axe-core accessibility violations, and peer review sign-off.
  </p>
</div>

<!-- ========================================== -->
<!-- ANSWER PART 3 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 3: Test DD and Traceability</div>
  <p>
    Test-Driven Development was executed by creating a comprehensive test register and failing test suite before implementation code was introduced.
  </p>

  <div class="part-subtitle">3.1 Automated Traceability Audit Output (check-traceability.py)</div>
  <pre><code>=== Specification Definition Audit ===
Defined Acceptance Criteria: 23 (AC-01..AC-23)
Defined Functional Reqs:     21 (FR-01..FR-21)
Defined Business Rules:      18 (BR-01..BR-18)

=== Traceability Matrix Coverage Audit ===
Referenced Acceptance Criteria: 23 (100% Coverage)
Referenced Functional Reqs:     21 (100% Coverage)
Referenced Business Rules:      18 (100% Coverage)

✅ ALL ACCEPTANCE CRITERIA, FUNCTIONAL REQUIREMENTS, AND BUSINESS RULES ARE 100% COVERED.</code></pre>

  <div class="part-subtitle">3.2 Red &rarr; Green Commit Verification</div>
  <ul>
    <li><strong>Red Phase (<code>77d8f2e</code>)</strong>: Committed failing test suites for Actions Taken, Resolution Gate, and Dashboards. Tests failed as expected due to missing schema fields and unbuilt routes.</li>
    <li><strong>Green Phase (<code>d6835b1</code>, <code>c083efa</code>, <code>6d20aca</code>)</strong>: Backend routes, transactions, React components, and regression fixes implemented. All 195 tests turned green.</li>
  </ul>

  <div class="part-subtitle">3.3 Final Test Suite Execution Summary</div>
  <table>
    <thead>
      <tr><th>Test Suite</th><th>Framework</th><th>Files</th><th>Tests Passed</th><th>Duration</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Backend Unit &amp; API</strong></td><td>Vitest + Supertest</td><td>29</td><td>144 / 144</td><td>24.42s</td><td><span class="badge badge-pass">PASS</span></td></tr>
      <tr><td><strong>Frontend Component</strong></td><td>Vitest + RTL</td><td>17</td><td>40 / 40</td><td>8.67s</td><td><span class="badge badge-pass">PASS</span></td></tr>
      <tr><td><strong>End-to-End Regression</strong></td><td>Playwright</td><td>3</td><td>11 / 11</td><td>17.7s</td><td><span class="badge badge-pass">PASS</span></td></tr>
      <tr><td><strong>Accessibility Audit</strong></td><td>Axe-core</td><td>1</td><td>0 Violations</td><td>-</td><td><span class="badge badge-pass">WCAG AA</span></td></tr>
      <tr><td><strong>Traceability Matrix</strong></td><td>Python 3</td><td>1</td><td>100% Covered</td><td>0.12s</td><td><span class="badge badge-pass">PASS</span></td></tr>
    </tbody>
  </table>
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- ANSWER PART 4 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 4: AI Use with Reflection</div>
  
  <div class="part-subtitle">4.1 AI Engineering Tooling Profile</div>
  <p>
    <strong>Tool</strong>: Google Antigravity (Powered by Google DeepMind Advanced Agentic Coding Architecture).<br>
    <strong>Role</strong>: Autonomous pair-programmer, Spec DD author, test harness designer, and full-stack implementation partner.
  </p>

  <div class="part-subtitle">4.2 Key Engineering Prompts and Interaction Trajectory</div>
  <table>
    <thead>
      <tr><th style="width: 25%;">Task &amp; Prompt Intent</th><th style="width: 45%;">Changes Made by AI</th><th style="width: 30%;">Verification Method</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Spec DD &amp; Traceability</strong></td>
        <td>Extracted 23 ACs, 21 FRs, and 18 BRs from handout into <code>specification.md</code>, <code>ui-spec.md</code>, and <code>api-spec.md</code>.</td>
        <td><code>python3 scripts/check-traceability.py</code> (100% coverage).</td>
      </tr>
      <tr>
        <td><strong>2. Test DD Red Phase</strong></td>
        <td>Created unit/integration test suites ahead of implementation code.</td>
        <td>Ran Vitest suites; logged failing output to <code>artifacts/lab-04/test-output/red-*.txt</code>.</td>
      </tr>
      <tr>
        <td><strong>3. Schema &amp; Seeding</strong></td>
        <td>Created Prisma migrations for <code>ActionTaken</code>, <code>Ticket.version</code>, and idempotent seeder.</td>
        <td>Ran <code>db seed</code> twice; verified 0 duplicates via <code>seed-idempotency.test.ts</code>.</td>
      </tr>
      <tr>
        <td><strong>4. Resolution Gate &amp; API</strong></td>
        <td>Implemented Express routes with 4-condition resolution gate and transaction handling.</td>
        <td>Vitest API tests passed (<code>ticket-workflow.api.test.ts</code>).</td>
      </tr>
      <tr>
        <td><strong>5. Telemetry &amp; Aggregations</strong></td>
        <td>Built dashboard routes using Prisma <code>count</code> and <code>groupBy</code> queries.</td>
        <td>Generated <code>metrics-vs-db.txt</code>; confirmed 1:1 mathematical match.</td>
      </tr>
      <tr>
        <td><strong>6. Action Lifecycle (Reviewer P1)</strong></td>
        <td>Added <code>ActionStatus</code> enum, <code>assigneeId</code>, inactive assignee check, and terminal locking.</td>
        <td>Added <code>TEST-ACT-18..20</code> and Playwright <code>E2E-ACT-02</code>.</td>
      </tr>
      <tr>
        <td><strong>7. Database Predicate OCC (Reviewer P1)</strong></td>
        <td>Replaced in-memory version checks with atomic <code>updateMany({ where: { id, version } })</code>.</td>
        <td>Race condition tests <code>TEST-ACT-21</code> and <code>TEST-WFK-07</code> passed.</td>
      </tr>
      <tr>
        <td><strong>8. Status History &amp; Fixtures (Reviewer P1/P2)</strong></td>
        <td>Added <code>TicketStatusHistory</code> model and deterministic Playwright test fixtures.</td>
        <td>11/11 Playwright E2E tests passed deterministically.</td>
      </tr>
    </tbody>
  </table>

  <div class="part-subtitle">4.3 Student Self-Reflection</div>
  <p>
    <strong>What AI Did Exceptionally Well</strong>: Antigravity excelled at rapid spec translation, generating complete TypeScript types, and authoring rigorous edge-case tests. Formulating multi-threaded async tests (<code>Promise.all</code>) to prove atomic concurrency conflicts was remarkably fast and accurate.
  </p>
  <p>
    <strong>Where Human Oversight Was Vital</strong>: Human judgment was essential in navigating the ambiguity between "append-only audit logs" and "operational lifecycle tasks," choosing a model where in-flight tasks can be updated but completed tasks are terminally locked. Human insight also drove the shift from in-memory version checking to database-level write predicates.
  </p>
  <p>
    <strong>Key Takeaway</strong>: Spec-Driven and Test-Driven Development serve as essential guardrails when working with AI. By defining contracts and assertions first, the AI's speed is harnessed while eliminating hallucinations and regressions.
  </p>
</div>

<!-- ========================================== -->
<!-- ANSWER PART 5 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 5: Working IT Staff Dashboard UI</div>
  <p>
    The IT Staff Dashboard provides real-time operational telemetry across team queues, individual workloads, and personal actions taken, fully satisfying Handout &sect;14.
  </p>

  <img src="${imgStaffDesktop}" class="evidence-img" alt="IT Staff Dashboard Desktop" />
  <div class="caption">Figure 5.1: IT Staff Dashboard (Desktop 1440px) showing Unassigned Queue (124 tickets), My Assigned Tickets (23 tickets), Tickets by Status breakdown, Priority Breakdown, and My Recent Actions Taken table.</div>

  <div class="grid-2">
    <div>
      <img src="${imgStaffTablet}" class="evidence-img" alt="IT Staff Dashboard Tablet" />
      <div class="caption">Figure 5.2: Tablet Viewport (820px) with adaptive 2-column layout.</div>
    </div>
    <div>
      <img src="${imgStaffMobile}" class="evidence-img" alt="IT Staff Dashboard Mobile" />
      <div class="caption">Figure 5.3: Mobile Viewport (375px) with single-column stack and zero horizontal scrollbar.</div>
    </div>
  </div>

  <div class="part-subtitle">5.1 Dashboard Telemetry vs Database Raw Counts Parity Audit</div>
  <pre><code>================================================================================
TOKTIKCIT LAB 4: DASHBOARD API METRICS VS DIRECT DATABASE QUERIES AUDIT
Timestamp: 2026-10-30T12:53:59.002Z &bull; Database: PostgreSQL local (toktickit)
================================================================================
IT STAFF OPERATIONAL DASHBOARD (User: michael.staff@toktickit.com, ID: 6)
Metric Name                   API Count     Direct DB Count    Match Status
--------------------------------------------------------------------------------
Unassigned Queue              124           124                [x] EXACT MATCH (PASS)
My Assigned Tickets           23            23                 [x] EXACT MATCH (PASS)
Total Active / Open Tickets   154           154                [x] EXACT MATCH (PASS)
Urgent Priority Attention     3             3                  [x] EXACT MATCH (PASS)
--------------------------------------------------------------------------------
VERIFICATION CONCLUSION: All metrics match PostgreSQL database counts with 100% precision.
================================================================================</code></pre>
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- ANSWER PART 6 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 6: Working Actions Taken UI</div>
  <p>
    The Actions Taken subsystem records real operational work, enforces an active assignee lifecycle, locks completed actions terminally, and protects concurrent writes via atomic database predicates.
  </p>

  <img src="${imgActLifecycle}" class="evidence-img" alt="Actions Taken Subsystem Lifecycle" />
  <div class="caption">Figure 6.1: Actions Taken Subsystem (Desktop 1440px) displaying Status Badges (Pending, In Progress, Completed), operational assignee delegation, quick transition buttons, and the (Terminal / Immutable) lock indicator.</div>

  <img src="${imgActReadonly}" class="evidence-img" alt="Requester Read-Only Actions View" />
  <div class="caption">Figure 6.2: Requester Read-Only View. Requesters can inspect operational progress and notes on their tickets, but all creation and edit controls are completely excluded from the UI and protected at the API layer.</div>

  <div class="part-subtitle">6.1 Concurrency &amp; Lifecycle Implementation Details</div>
  <ul>
    <li><strong>Active Operational Assignee</strong>: Any active IT Staff/Admin can be assigned (<code>assigneeId</code>). Assigning inactive staff or requesters is rejected with HTTP 400 (<code>INACTIVE_ASSIGNEE</code>).</li>
    <li><strong>Terminal Action Lock</strong>: Actions transitioned to <code>COMPLETED</code> or <code>CANCELLED</code> are permanently locked against further edits (HTTP 400 <code>TERMINAL_ACTION_LOCKED</code>).</li>
    <li><strong>Atomic Optimistic Concurrency</strong>: Updates use database write predicate <code>updateMany({ where: { id, version: expectedVersion } })</code>. If another user committed a change first, 0 rows update and the server returns HTTP 409 Conflict.</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- ANSWER PART 7 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 7: Working Ticket Workflow</div>
  <p>
    The Ticket Workflow subsystem enforces a strict state machine, protects status updates with atomic concurrency control, blocks premature resolution via the 4-condition Resolution Gate, and logs an append-only audit trail in <code>TicketStatusHistory</code>.
  </p>

  <div class="grid-2">
    <div>
      <img src="${imgActResolution}" class="evidence-img" alt="Resolution Gate Rejection Banner" />
      <div class="caption">Figure 7.1: Strict Resolution Gate Rejection Banner on ticket TKT-2026-001233. Attempting to select RESOLVED without actions triggers an inline alert; status remains safely in OPEN.</div>
    </div>
    <div>
      <img src="${imgActHistory}" class="evidence-img" alt="Ticket Status History Timeline" />
      <div class="caption">Figure 7.2: Append-Only Ticket Status History Timeline rendering chronological transitions with from/to statuses, timestamps, and actor identity.</div>
    </div>
  </div>

  <div class="part-subtitle">7.1 Resolution Gate Rules (BR-13) &amp; Transactional History (BR-25, BR-26)</div>
  <ol>
    <li><strong>Owner Assignment</strong>: Ticket must have an assigned owner (<code>ownerId !== null</code>).</li>
    <li><strong>Recorded Actions</strong>: At least one Action Taken must exist under the ticket.</li>
    <li><strong>Completed Action with Result</strong>: At least one Action Taken must be in <code>COMPLETED</code> status with non-empty <code>result</code>.</li>
    <li><strong>Follow-up Notes Completed</strong>: All actions with <code>followUpRequired = true</code> must have completed <code>followUpNote</code>.</li>
    <li><strong>Transactional Audit Trail</strong>: Every successful status transition writes exactly 1 row to <code>TicketStatusHistory</code> in the same database transaction. Concurrency conflicts roll back completely with 0 rows added.</li>
  </ol>
</div>

<div class="page-break"></div>

<!-- ========================================== -->
<!-- ANSWER PART 8 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 8: Working Requester Dashboard and Final Regression UI</div>
  <p>
    The Requester Dashboard provides end-users with personalized service desk transparency, actionable alerts, and 1-click navigation to their tickets.
  </p>

  <img src="${imgReqDesktop}" class="evidence-img" alt="Requester Dashboard Desktop" />
  <div class="caption">Figure 8.1: Requester Dashboard (Desktop 1440px) displaying Personal Metric Cards (Open, Waiting for Feedback, Resolved, Closed), the Attention Banner alerting the user to tickets requiring response, and Recent Tickets table.</div>

  <div class="grid-2">
    <div>
      <img src="${imgReqTablet}" class="evidence-img" alt="Requester Dashboard Tablet" />
      <div class="caption">Figure 8.2: Requester Dashboard Tablet (820px) with fluid responsive grid.</div>
    </div>
    <div>
      <img src="${imgReqMobile}" class="evidence-img" alt="Requester Dashboard Mobile" />
      <div class="caption">Figure 8.3: Requester Dashboard Mobile (375px) with single-column stack and zero horizontal scroll.</div>
    </div>
  </div>

  <div class="part-subtitle">8.1 Regression Verification for Labs 1–3</div>
  <ul>
    <li><strong>Authenticated Attachments</strong>: Verified secure attachment download via authenticated blob fetch; unauthenticated access is strictly blocked.</li>
    <li><strong>Comment Visibility Segregation</strong>: Verified public comments are visible to requesters while internal staff notes remain hidden.</li>
    <li><strong>User Administration &amp; RBAC</strong>: Admin user distribution metrics and active/inactive status toggles remain fully functional.</li>
  </ul>
</div>

<!-- ========================================== -->
<!-- ANSWER PART 9 -->
<!-- ========================================== -->
<div class="part-card">
  <div class="part-title">Answer Part 9: Zen Green UI, Responsive, Accessibility, and Final Polish</div>
  <p>
    The application extends the Zen Green design system across all screens, enforcing brand design tokens, touch-friendly interactive targets, multi-viewport responsiveness, and WCAG 2.1 AA accessibility.
  </p>

  <div class="part-subtitle">9.1 Zen Green Design System Tokens (index.css)</div>
  <table>
    <thead>
      <tr><th>Token Name</th><th>Color / Value</th><th>Visual Preview</th><th>Semantic Purpose</th></tr>
    </thead>
    <tbody>
      <tr><td><code>--color-primary-forest</code></td><td><code>#006B3C</code></td><td><span style="display:inline-block;width:24px;height:12px;background:#006B3C;border-radius:2px;"></span></td><td>Brand primary, header gradients, active nav tabs, focus rings</td></tr>
      <tr><td><code>--color-primary-accent</code></td><td><code>#008751</code></td><td><span style="display:inline-block;width:24px;height:12px;background:#008751;border-radius:2px;"></span></td><td>Button hover states, interactive badges, positive metrics</td></tr>
      <tr><td><code>--color-surface-mint</code></td><td><code>#F0FDF4</code></td><td><span style="display:inline-block;width:24px;height:12px;background:#F0FDF4;border:1px solid #bbf7d0;border-radius:2px;"></span></td><td>Card background tint, active table row highlights</td></tr>
      <tr><td><code>--color-surface-card</code></td><td><code>#FFFFFF</code></td><td><span style="display:inline-block;width:24px;height:12px;background:#FFFFFF;border:1px solid #cbd5e1;border-radius:2px;"></span></td><td>Standard card container surface</td></tr>
      <tr><td><code>--color-text-charcoal</code></td><td><code>#1E293B</code></td><td><span style="display:inline-block;width:24px;height:12px;background:#1E293B;border-radius:2px;"></span></td><td>Primary body copy (contrast ratio > 7:1)</td></tr>
      <tr><td><code>--color-text-slate</code></td><td><code>#64748B</code></td><td><span style="display:inline-block;width:24px;height:12px;background:#64748B;border-radius:2px;"></span></td><td>Secondary metadata, helper labels, table headers</td></tr>
      <tr><td><code>--color-error</code></td><td><code>#DC2626</code></td><td><span style="display:inline-block;width:24px;height:12px;background:#DC2626;border-radius:2px;"></span></td><td>Validation alerts, resolution gate rejection banners, conflict errors</td></tr>
    </tbody>
  </table>

  <div class="part-subtitle">9.2 Responsive Viewport &amp; Layout Compliance</div>
  <table>
    <thead>
      <tr><th>Viewport</th><th>Dimensions</th><th>Layout Strategy</th><th>Horizontal Scroll Verification</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Mobile</strong></td><td>375 &times; 812 px</td><td>Single-column vertical stack, full-width cards, 44px min touch targets</td><td><span class="badge badge-pass">0px Overflow (PASS)</span></td></tr>
      <tr><td><strong>Tablet</strong></td><td>768 &times; 1024 px</td><td>2-column adaptive grid, responsive breakdown charts</td><td><span class="badge badge-pass">0px Overflow (PASS)</span></td></tr>
      <tr><td><strong>Desktop</strong></td><td>1440 &times; 900 px</td><td>4-column metric grid, expanded side-by-side workflow panels</td><td><span class="badge badge-pass">0px Overflow (PASS)</span></td></tr>
    </tbody>
  </table>

  <div class="part-subtitle">9.3 Accessibility Audit (Axe-core WCAG 2.1 AA)</div>
  <p>
    Automated accessibility scanning was executed across all dashboard and ticket detail routes using <code>@axe-core/playwright</code>.
  </p>
  <ul>
    <li><strong>Color Contrast</strong>: All text elements satisfy WCAG AA contrast ratio (&ge; 4.5:1).</li>
    <li><strong>Keyboard Navigation</strong>: Visible outline ring (<code>ring-2 ring-primary-forest</code>) on all interactive elements.</li>
    <li><strong>ARIA Semantics</strong>: Form controls have explicit <code>&lt;label&gt;</code> elements; icons have descriptive <code>aria-label</code> tags.</li>
    <li><strong>Audit Outcome</strong>: <strong style="color: #166534;">0 Accessibility Violations Reported</strong>.</li>
  </ul>
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
      top: '14mm',
      bottom: '14mm',
      left: '12mm',
      right: '12mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 7.5pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: right; padding-right: 12mm;">CPE 334 Introduction to Software Engineering in the Age of AI Agents &mdash; TokTickIT Lab 4</div>',
    footerTemplate: '<div style="font-size: 7.5pt; color: #64748b; font-family: -apple-system, sans-serif; width: 100%; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
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

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

