# Lab 4 Test Engineering & Traceability Plan
## TokTickIT: Actions Taken, Dashboards, and Concurrency Control

---

## 1. Test Strategy & Coverage Scope

The Lab 4 test engineering suite establishes strict test-driven development (TDD) coverage across all Functional Requirements (`FR-01`..`FR-22`), Business Rules (`BR-01`..`BR-26`), Acceptance Criteria (`AC-01`..`AC-28`), and the full permission and status transition matrices.

### 1.1 Test Layers
1. **Server Unit & API Tests (`server/tests/lab-04/`)**: Supertest + Vitest testing backend endpoints, input validations, session bindings, resolution gate conditions, optimistic concurrency conflicts (HTTP 409), and database aggregations for dashboards.
2. **Client Component Tests (`client/src/tests/lab-04/`)**: React Testing Library + Vitest validating dashboard metric cards, drill-downs, attention banners, Actions Taken create/edit modes, inline validation, and ticket workflow controls.
3. **End-to-End Tests (`e2e/lab-04/`)**: Playwright multi-role browser test suite verifying real user workflows (Requester $\rightarrow$ Staff $\rightarrow$ Admin), resolution gate blocks, responsive overflow checks, and accessibility audits.
4. **Regression & Idempotency Tests**: Ensuring legacy tickets with 0 actions are handled gracefully, migrations are non-destructive, seed scripts run repeatedly with zero errors, and all 136 tests from Labs 1–3 pass.

---

## 2. Requirement Traceability Matrix & Test Register

| Test ID | Type | Requirement / AC | What it tests | Expected result | Automated test file | Final status |
|---|---|---|---|---|---|---|
| **TEST-ACT-01** | API/Integration | AC-01, FR-01, BR-01 | Create valid Action Taken under active ticket by IT Staff | HTTP 201 Created, `performedById` bound to session user, `version = 1`, record persisted | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-02** | API/Integration | AC-01, FR-01, BR-02 | Create valid Action Taken by Administrator | HTTP 201 Created with Admin performer binding | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-03** | Authorization | AC-02, FR-02, BR-03 | Request body contains spoofed `performedById` | Client-provided performer ID ignored; server enforces authenticated user ID | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-04** | API/Integration | AC-03, FR-03, BR-02 | Staff member logs action on ticket owned by different staff member | HTTP 201 Created; action performer recorded independently from ticket owner | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-05** | API/Validation | AC-04, FR-04, BR-04 | Missing, invalid, or future (>5m) `actionDateTime` | HTTP 400 Bad Request with `VALIDATION_ERROR` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-06** | API/Validation | AC-04, FR-04, BR-04 | `actionDateTime` earlier than `Ticket.createdAt` | HTTP 400 Bad Request with `VALIDATION_ERROR` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-07** | API/Validation | AC-05, FR-04, BR-05 | Missing, whitespace-only, or oversized `description` / `result` | HTTP 400 Bad Request with `VALIDATION_ERROR` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-08** | API/Validation | AC-06, FR-05, BR-06 | `followUpRequired = true` without `followUpNote` | HTTP 400 Bad Request with `VALIDATION_ERROR` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-09** | API/Validation | AC-07, FR-05, BR-06 | `followUpRequired = false` with non-empty `followUpNote` | HTTP 201 Created with `followUpNote` set to `null` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-10** | Authorization | AC-08, FR-07, BR-09 | Requester attempts `POST` to create Action Taken | HTTP 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-11** | Authorization | AC-09, FR-07, BR-08 | Requester requests actions on another user's ticket | HTTP 404 Not Found (prevents ticket enumeration) | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-12** | API/Integration | AC-10, FR-07, BR-08 | Requester requests actions on own ticket | HTTP 200 OK with chronological actions list | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-13** | Workflow | AC-11, FR-01, BR-11 | Attempt to create action on `CLOSED` or `CANCELLED` ticket | HTTP 400 Bad Request with `TERMINAL_STATE_LOCKED` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-14** | API/Integration | AC-12, FR-08, BR-10 | Edit action with matching `version` | HTTP 200 OK, `version` incremented to 2, `updatedById` set | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-15** | API/Integration | AC-13, FR-08, BR-14 | Edit action with stale `version` | HTTP 409 Conflict returning current database entity | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-16** | Unit | FR-04, BR-05 | Input sanitization escapes XSS tags in `description` and `result` | Script tags escaped, stored safely without raw executable HTML | `server/tests/lab-04/actions-taken.api.test.ts` | Planned (Red) |
| **TEST-ACT-17** | Authorization | AC-14, FR-09, BR-10 | Client sends `DELETE /api/tickets/:ticketId/actions-taken/:actionId` | HTTP 404/405 (endpoint not allowed/append-only) | `server/tests/lab-04/actions-taken.api.test.ts` | Passed (Green) |
| **TEST-ACT-18** | Regression | Part 6, BR-19, BR-20 | Lifecycle status transitions and result requirement enforcement | Valid transitions pass; result mandatory only upon completion; invalid transitions rejected | `server/tests/lab-04/actions-taken.api.test.ts` | Passed (Green) |
| **TEST-ACT-19** | Regression | Part 6, BR-21 | Operational assignee delegation and inactive assignee rejection | Assigning to active staff/admin succeeds; assigning to inactive user or requester returns 400 | `server/tests/lab-04/actions-taken.api.test.ts` | Passed (Green) |
| **TEST-ACT-20** | Regression | Part 6, BR-20 | Terminal status immutability enforcement | Modifying COMPLETED or CANCELLED action returns 400 `TERMINAL_ACTION_LOCKED` | `server/tests/lab-04/actions-taken.api.test.ts` | Passed (Green) |
| **TEST-ACT-21** | Concurrency | Part 6, BR-14, BR-24 | Concurrent write race condition on ActionTaken | Two same-version writes: first succeeds, second gets 409 Conflict via DB predicate | `server/tests/lab-04/actions-taken.api.test.ts` | Passed (Green) |
| **TEST-ACT-22** | Authorization | Part 6, BR-08, BR-09 | Requester read-only actions and isolation | Requester views actions on own ticket; attempting write operations is blocked | `server/tests/lab-04/actions-taken.api.test.ts` | Passed (Green) |
| **TEST-WFK-01** | Workflow | AC-15, FR-10, FR-11, BR-12, BR-13 | Transition to `RESOLVED` with owner and completed action | HTTP 200 OK, status updated to `RESOLVED`, `version` incremented | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-WFK-02** | Workflow | AC-16, FR-11, BR-13 | Transition to `RESOLVED` on unassigned ticket (`ownerId = null`) | HTTP 422 Unprocessable Entity with `RESOLUTION_GATE_FAILED` (`OWNER_REQUIRED`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-WFK-03** | Workflow | AC-17, FR-11, BR-13 | Transition to `RESOLVED` with zero actions or empty action result | HTTP 422 Unprocessable Entity with `RESOLUTION_GATE_FAILED` (`ACTION_TAKEN_REQUIRED`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-WFK-04** | Workflow | AC-18, FR-14, BR-14 | Status transition with stale ticket `version` | HTTP 409 Conflict with current server ticket | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-WFK-05** | Workflow | AC-19, FR-10, BR-12 | Disallowed status transition (e.g. `NEW` directly to `RESOLVED`) | HTTP 400 Bad Request with `INVALID_STATUS_TRANSITION` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-WFK-06** | Validation | Part 7, BR-14 | Status write without expected numeric version | HTTP 400 Bad Request with `VALIDATION_ERROR` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-WFK-07** | Concurrency | Part 7, BR-14, BR-24 | Concurrent ticket status writes with identical expected version | First write succeeds and increments version; second write gets 409 Conflict via atomic DB predicate | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-WFK-08** | Audit/History | Part 7, BR-25, BR-26 | Append-only TicketStatusHistory recording and stale-write isolation | Successful transition appends 1 actor-attributed history row; stale write appends 0 rows | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed (Green) |
| **TEST-DSH-REQ-01** | API/Integration | AC-20, FR-17, BR-16..BR-19 | Requester queries `GET /api/dashboard/requester` | HTTP 200 OK with accurate counts (Open, Waiting, Resolved, Closed) and recent lists | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned (Red) |
| **TEST-DSH-REQ-02** | API/Integration | AC-21, FR-17, BR-16, BR-26 | New requester with 0 tickets queries dashboard | HTTP 200 OK with all counts = 0, empty lists (no errors) | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned (Red) |
| **TEST-DSH-REQ-03** | Authorization | FR-17, BR-08, BR-16 | Requester metrics isolate other users' ticket data | Counts reflect only `requesterId = user.id` | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned (Red) |
| **TEST-DSH-STF-01** | API/Integration | AC-22, FR-18, BR-20..BR-24 | IT Staff queries `GET /api/dashboard/staff` | HTTP 200 OK with Unassigned, My Assigned, Status/Priority breakdown, and My Recent Actions | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned (Red) |
| **TEST-DSH-STF-02** | API/Integration | AC-22, FR-18, BR-23 | IT Staff dashboard "My Recent Actions Taken" | Returns up to 5 actions where `performedById = user.id`, ordered by date DESC | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned (Red) |
| **TEST-DSH-ADM-01** | API/Integration | AC-23, FR-19, BR-25 | Administrator queries `GET /api/dashboard/staff` | HTTP 200 OK containing staff metrics plus `adminMetrics` (user distribution by role and active status) | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned (Red) |
| **TEST-DSH-ADM-02** | Authorization | FR-18, BR-09 | Requester attempts to query `GET /api/dashboard/staff` | HTTP 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned (Red) |
| **TEST-UI-DSH-01** | UI Component | AC-24, FR-20, BR-16, BR-20 | Staff dashboard metric cards render and contain drill-down links | Metric cards present correct counts and valid filter navigation links | `client/src/tests/lab-04/StaffDashboard.test.tsx` | Planned (Red) |
| **TEST-UI-DSH-02** | UI Component | AC-20, AC-24, FR-17, FR-20 | Requester dashboard renders cards and attention banner | Renders Open/Waiting/Resolved cards, attention banner when waiting > 0 | `client/src/tests/lab-04/RequesterDashboard.test.tsx` | Planned (Red) |
| **TEST-UI-ACT-01** | UI Component | AC-25, FR-05, FR-22, BR-06 | Action Taken form toggles follow-up note field dynamically | Checking "Follow-up Required" reveals required note textarea | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Planned (Red) |
| **TEST-UI-ACT-02** | UI Component | AC-13, FR-14, BR-14 | Action Taken edit handles 409 conflict gracefully | Displays conflict banner and "Reload Latest Data" button, preserving inputs | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Planned (Red) |
| **TEST-UI-ACT-03** | UI Component | AC-10, FR-07, BR-08, BR-09 | Requester viewing ticket detail sees read-only Actions Taken | Renders actions list; "+ Add Action" and Edit buttons are not rendered | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Passed (Green) |
| **TEST-UI-ACT-04** | UI Component | Part 6, BR-19, BR-20 | Lifecycle status badges and quick transition buttons | Renders status badges (Pending, In Progress, Completed, Cancelled) and transition buttons | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Passed (Green) |
| **TEST-UI-ACT-05** | UI Component | Part 6, BR-22 | Client-side validation requires action result only when completing | Form validates result when status is COMPLETED; permits empty result in PENDING | `client/src/tests/lab-04/ActionsTaken.test.tsx` | Passed (Green) |
| **TEST-UI-WFK-01** | UI Component | AC-15..AC-19, FR-10, FR-12 | Ticket status selector shows only permitted transitions | Only allowed next statuses appear in dropdown; displays gate warning on RESOLVED | `client/src/tests/lab-04/TicketWorkflow.test.tsx` | Planned (Red) |
| **TEST-UI-RESP-01** | Responsive | AC-26, FR-21 | Dashboard and Ticket Detail at 360px, 768px, 1280px | `scrollWidth <= clientWidth` verified across all viewports | `e2e/lab-04/dashboards.spec.ts` | Planned (Red) |
| **TEST-E2E-01** | E2E | AC-01..AC-07, FR-01..FR-06 | Full Actions Taken creation, display, and edit lifecycle | IT Staff logs in, adds action with follow-up, verifies display, edits action | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned (Red) |
| **TEST-E2E-02** | E2E | AC-15..AC-19, FR-10..FR-13 | Resolution Gate enforcement and ticket lifecycle | Unassigned ticket blocked $\rightarrow$ assigned $\rightarrow$ blocked without action $\rightarrow$ action added $\rightarrow$ resolved $\rightarrow$ closed | `e2e/lab-04/ticket-resolution.spec.ts` | Planned (Red) |
| **TEST-E2E-03** | E2E | AC-20..AC-24, FR-17..FR-20 | Role-based Dashboard navigation and drill-down | Requester views personal dashboard $\rightarrow$ clicks drill-down; Staff views operational dashboard | `e2e/lab-04/dashboards.spec.ts` | Planned (Red) |
| **TEST-E2E-04** | Accessibility | UI-Spec §6, FR-21 | Axe-core accessibility audit on Dashboards and Ticket Detail | Zero WCAG AA violations; visible focus rings; keyboard navigable | `e2e/lab-04/dashboards.spec.ts` | Planned (Red) |
| **TEST-MIG-SEED-01** | Migration/Regression| AC-27, FR-15, BR-26 | Idempotent seed execution and legacy ticket stability | Seed runs repeatedly with identical counts; zero-action tickets render without errors | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned (Red) |
| **TEST-REGR-ALL** | Full Regression | AC-28, FR-21 | Labs 1–3 regression test suites | All 104 server tests, 32 client tests, and E2E specs pass | All existing test files | Planned (Green) |

---

## 3. Test Execution Commands

```bash
# Run Server API test suites
cd server && npm test

# Run Lab 4 specific server API tests
cd server && npx vitest run tests/lab-04/

# Run Client component test suites
cd client && npm test

# Run Lab 4 specific client component tests
cd client && npx vitest run src/tests/lab-04/

# Run Playwright E2E suites
npx playwright test e2e/lab-04/
```
