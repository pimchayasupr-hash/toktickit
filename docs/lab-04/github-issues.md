# Lab 4 GitHub Issues Register
## TokTickIT: Actions Taken, Dashboards, and Concurrency Control

This document contains ready-to-paste GitHub Issue templates for Sprint 4. Each issue is pre-configured with title, labels, target branch, user story, linked Acceptance Criteria (AC), Business Rules (BR), Planned Test IDs, and acceptance checklist for your GitHub Project Board.

---

### Issue 1: Sprint 4 Engineering Contract & Specification Baseline
- **Title**: `docs: Sprint 4 engineering contract, UI/API specs, and traceability register`
- **Labels**: `documentation`, `spec-dd`, `sprint-4`
- **Target Branch**: `lab4/spec`
- **Kanban Status**: **Done**
- **Linked Requirements**: `AC-01..AC-28`, `FR-01..FR-22`, `BR-01..BR-26`
- **Body**:
  ```markdown
  ### Description
  Establish the formal specification foundation for Lab 4 adhering to Spec-Driven Development:
  1. `specification.md`: 11 required sections, scope, business rules, transition matrix, and ambiguity resolutions.
  2. `ui-spec.md`: Zen Green layout designs for Requester/Staff dashboards, Actions Taken cards/forms, and workflow states.
  3. `api-spec.md`: REST endpoints contracts, error envelope, and traceability matrix.

  ### Acceptance Criteria
  - [x] All 3 specification documents created in `docs/lab-04/`.
  - [x] Handout §Answer Part 6 ambiguities resolved (Assignee vs Performer).
  - [x] 100% of requirements mapped to ACs and BRs.
  - [x] Spec committed to `lab4/spec` before code implementation.
  ```

---

### Issue 2: Database Migration, Schema Models (`ActionTaken`, `version`), and Idempotent Seed
- **Title**: `feat(db): add ActionTaken model, Ticket version field, non-destructive migration, and idempotent seed`
- **Labels**: `database`, `prisma`, `tdd`, `sprint-4`
- **Target Branch**: `feature/lab4-db-schema`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-01`, `AC-12`, `AC-14`, `AC-27`, `FR-01`, `FR-08`, `FR-15`, `BR-01`, `BR-10`, `BR-14`, `BR-26`
- **Linked Tests**: `TEST-ACT-01`, `TEST-ACT-14`, `TEST-MIG-SEED-01`
- **Body**:
  ```markdown
  ### Description
  Update Prisma schema to support Actions Taken and optimistic concurrency:
  - Add `ActionTaken` model with fields: `id`, `ticketId`, `actionDateTime`, `description`, `result`, `performedById`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `version`, `createdAt`, `createdById`, `updatedAt`, `updatedById`.
  - Add `version Int @default(1)` to `Ticket` model.
  - Establish indexes on `(ticketId, actionDateTime)` and `(performedById, createdAt)`.
  - Generate non-destructive Prisma migration.
  - Update `server/prisma/seed.ts` with 18 realistic tickets, 0/1/many actions, multiple performers, and guaranteed idempotency.

  ### Acceptance Criteria
  - [ ] Migration applies cleanly on existing database without data loss.
  - [ ] Running seed twice yields identical row counts and zero constraint violations.
  - [ ] Legacy tickets with zero actions function normally.
  ```

---

### Issue 3: Actions Taken Backend REST APIs
- **Title**: `feat(api): Actions Taken CRUD endpoints with session binding, validation, and optimistic concurrency`
- **Labels**: `backend`, `api`, `security`, `sprint-4`
- **Target Branch**: `feature/lab4-actions-backend`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-01..AC-14`, `FR-01..FR-09`, `BR-01..BR-11`, `BR-14`
- **Linked Tests**: `TEST-ACT-01` through `TEST-ACT-17`
- **Body**:
  ```markdown
  ### Description
  Implement backend endpoints under `/api/tickets/:ticketId/actions-taken`:
  - `GET /api/tickets/:ticketId/actions-taken`: Chronological order (`actionDateTime ASC, createdAt ASC, id ASC`).
  - `POST /api/tickets/:ticketId/actions-taken`: IT Staff/Admin only; session performer binding; validation bounds; terminal status block.
  - `PATCH /api/tickets/:ticketId/actions-taken/:actionId`: Optimistic concurrency check (`version`); returns 409 on mismatch.
  - Role-based authorization: Requesters can only read their own tickets (other tickets return 404); write attempts return 403.
  - No `DELETE` endpoint (append-only audit trail).

  ### Acceptance Criteria
  - [ ] `performedById` is automatically bound from authenticated session user.
  - [ ] Missing required fields, future dates (>5 min), or backdated dates return 400 `VALIDATION_ERROR`.
  - [ ] Concurrency conflict returns 409 `CONCURRENCY_CONFLICT` with current database entity.
  - [ ] All 17 API tests in `server/tests/lab-04/actions-taken.api.test.ts` pass.
  ```

---

### Issue 4: Actions Taken Frontend Subsystem on Ticket Detail
- **Title**: `feat(ui): Actions Taken section on Ticket Detail with create/edit modes, conflict handling, and Requester view`
- **Labels**: `frontend`, `ui`, `accessibility`, `sprint-4`
- **Target Branch**: `feature/lab4-actions-frontend`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-01`, `AC-10`, `AC-12`, `AC-13`, `AC-25`, `FR-01`, `FR-05`, `FR-07`, `FR-08`, `BR-06`, `BR-10`, `BR-14`
- **Linked Tests**: `TEST-UI-ACT-01`, `TEST-UI-ACT-02`, `TEST-UI-ACT-03`, `TEST-E2E-01`
- **Body**:
  ```markdown
  ### Description
  Build `ActionsTakenSection.tsx` component inside Ticket Detail:
  - Chronological card/table listing with action datetime, performer, description, result, follow-up badge, and attachment notes.
  - "+ Add Action" create mode with inline validation and dynamic follow-up note visibility.
  - Edit mode with dirty-state checking and disabled submit while in-flight.
  - 409 Conflict banner with "Reload Latest Data" action, preserving entered form data.
  - Pure read-only view for Requesters (hide create/edit controls).

  ### Acceptance Criteria
  - [ ] Toggling Follow-up Required reveals mandatory Follow-up Note input.
  - [ ] Conflict detection preserves input fields and displays correction banner.
  - [ ] Requesters see read-only action cards without edit/add buttons.
  - [ ] Client component tests in `ActionsTaken.test.tsx` pass.
  ```

---

### Issue 5: Ticket Workflow, Status Transition Matrix & Backend Resolution Gate
- **Title**: `feat(workflow): Status transition engine with backend Resolution Gate and optimistic concurrency`
- **Labels**: `backend`, `workflow`, `security`, `sprint-4`
- **Target Branch**: `feature/lab4-workflow-gate`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-15..AC-19`, `FR-10..FR-13`, `BR-12`, `BR-13`, `BR-14`
- **Linked Tests**: `TEST-WFK-01` through `TEST-WFK-06`, `TEST-UI-WFK-01`, `TEST-E2E-02`
- **Body**:
  ```markdown
  ### Description
  Enforce the formal 8-status transition matrix and Resolution Gate in backend and UI:
  - Transition engine validating permitted target statuses.
  - **Resolution Gate**: Transitioning to `RESOLVED` requires:
    1. Assigned ticket owner (`ownerId != null`).
    2. At least one Action Taken record on the ticket.
    3. At least one Action Taken has non-empty `result`.
    4. Follow-up notes documented if follow-up required.
  - Optimistic concurrency check on `Ticket.version` (returns 409 Conflict).
  - UI dropdown renders only permitted next transitions.
  - Requester "Problem Appears Resolved" button remains advisory without mutating status.

  ### Acceptance Criteria
  - [ ] Moving unassigned ticket to `RESOLVED` returns 422 `RESOLUTION_GATE_FAILED` (`OWNER_REQUIRED`).
  - [ ] Moving ticket with zero actions to `RESOLVED` returns 422 (`ACTION_TAKEN_REQUIRED`).
  - [ ] Stale ticket version returns 409 `CONCURRENCY_CONFLICT`.
  - [ ] All tests in `ticket-workflow.api.test.ts` pass.
  ```

---

### Issue 6: Requester Dashboard Backend API & Responsive Frontend
- **Title**: `feat(dashboard): Requester dashboard with backend-computed metrics, attention banner, and filter drill-down`
- **Labels**: `frontend`, `backend`, `dashboard`, `sprint-4`
- **Target Branch**: `feature/lab4-requester-dashboard`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-20`, `AC-21`, `AC-24`, `FR-17`, `FR-20`, `BR-16..BR-19`
- **Linked Tests**: `TEST-DSH-REQ-01`, `TEST-DSH-REQ-02`, `TEST-DSH-REQ-03`, `TEST-UI-DSH-02`, `TEST-E2E-03`
- **Body**:
  ```markdown
  ### Description
  Implement personal dashboard for authenticated Requesters:
  - `GET /api/dashboard/requester`: Backend aggregates Open tickets, Waiting for Requester, Recently Resolved, Closed.
  - `RequesterDashboard.tsx`: Zen Green metric cards, attention alert for tickets in `WAITING_FOR_REQUESTER`, recent tickets table, and quick actions ("+ Create Ticket").
  - Clickable metric cards drill down to `/requester/tickets` with URL query filters.
  - Zero-ticket requester gets zeroed counts and friendly onboarding empty state.

  ### Acceptance Criteria
  - [ ] Personal data isolation: Requesters cannot see other users' metrics.
  - [ ] New user with zero tickets returns 200 with 0s and empty lists (no 500 error).
  - [ ] Attention banner displays whenever tickets are awaiting requester response.
  ```

---

### Issue 7: IT Staff & Administrator Dashboard Backend API & Responsive Frontend
- **Title**: `feat(dashboard): IT Staff & Admin operational dashboard with queue metrics, personal actions, and admin overview`
- **Labels**: `frontend`, `backend`, `dashboard`, `sprint-4`
- **Target Branch**: `feature/lab4-staff-dashboard`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-22`, `AC-23`, `AC-24`, `FR-18`, `FR-19`, `FR-20`, `BR-20..BR-25`
- **Linked Tests**: `TEST-DSH-STF-01`, `TEST-DSH-STF-02`, `TEST-DSH-ADM-01`, `TEST-DSH-ADM-02`, `TEST-UI-DSH-01`
- **Body**:
  ```markdown
  ### Description
  Implement operational dashboard for IT Staff and Administrators:
  - `GET /api/dashboard/staff`: Backend aggregates Unassigned queue, My Assigned tickets, Open total, Urgent items, Status breakdown, Priority breakdown, and "My Recent Actions Taken".
  - If authenticated user has role `ADMIN`, returns `adminMetrics` (total, active, role distribution).
  - `StaffDashboard.tsx`: 4 metric cards, status/priority pills with direct drill-down links to `/staff/queue`, Urgent Attention queue, and My Recent Actions widget.
  - Requesters receive 403 Forbidden.

  ### Acceptance Criteria
  - [ ] "My Recent Actions Taken" returns the logged-in user's latest 5 actions.
  - [ ] Clicking metric cards navigates to `/staff/queue` with corresponding query params.
  - [ ] Admin user sees user account distribution panel.
  - [ ] All tests in `staff-dashboard.api.test.ts` pass.
  ```

---

### Issue 8: Automated Regression Suite & Legacy Ticket Compatibility Verification
- **Title**: `test(regression): comprehensive regression verification across Labs 1-3 test suites`
- **Labels**: `testing`, `regression`, `ci`, `sprint-4`
- **Target Branch**: `feature/lab4-regression`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-27`, `AC-28`, `FR-15`, `BR-26`
- **Linked Tests**: `TEST-MIG-SEED-01`, `TEST-REGR-ALL`
- **Body**:
  ```markdown
  ### Description
  Execute full regression testing to guarantee zero regressions against earlier deliverables:
  - Server test suite: 104 tests across Labs 1, 2, and 3.
  - Client component test suite: 28+ tests across Labs 2 and 3.
  - Verify legacy tickets created without Actions Taken render cleanly in all views.
  - Verify seed script idempotency across repeated runs.

  ### Acceptance Criteria
  - [ ] 100% of Lab 1–3 server and client tests pass without modifications.
  - [ ] Zero unhandled errors on legacy tickets.
  ```

---

### Issue 9: WCAG 2.1 AA Accessibility & Keyboard Navigation Hardening
- **Title**: `fix(a11y): WCAG 2.1 AA accessibility audit, focus rings, modal focus traps, and screen reader labels`
- **Labels**: `accessibility`, `a11y`, `hardening`, `sprint-4`
- **Target Branch**: `feature/lab4-a11y`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-26`, `FR-21`, `FR-22`
- **Linked Tests**: `TEST-E2E-04`
- **Body**:
  ```markdown
  ### Description
  Harden TokTickIT UI against WCAG 2.1 AA accessibility standards:
  - Visible focus rings (`2px solid #006B3C`) on all interactive controls.
  - Modal focus traps (traps Tab navigation, closes on Escape, restores focus).
  - Explicit `<label>` elements for all form inputs with `aria-describedby` for validation errors.
  - Text-based and icon-based status indicators (non-color cues).
  - Axe-core automated accessibility audit yielding 0 critical violations.

  ### Acceptance Criteria
  - [ ] Automated axe scan produces 0 critical/serious violations.
  - [ ] All modal dialogs trap focus and close gracefully with Escape key.
  ```

---

### Issue 10: Multi-viewport Responsive Layout & Zero-Overflow Visual Inspection
- **Title**: `fix(responsive): responsive layout verification at 360px, 768px, and 1280px viewports`
- **Labels**: `responsive`, `css`, `ui`, `sprint-4`
- **Target Branch**: `feature/lab4-responsive`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-26`, `FR-21`
- **Linked Tests**: `TEST-UI-RESP-01`
- **Body**:
  ```markdown
  ### Description
  Verify responsive layouts and prevent horizontal scrolling across all screens:
  - Mobile (360px–375px): Stacked metric cards, stacked action cards, minimum 44px tap targets.
  - Tablet (768px–820px): 2-column metric cards, responsive tables.
  - Desktop (1024px–1280px): Full multi-column dashboard and ticket detail layout.
  - Automated assertion: `scrollWidth <= clientWidth` on all screens and viewports.

  ### Acceptance Criteria
  - [ ] Zero page-level horizontal overflow at 360px width.
  - [ ] Minimum 44px touch targets on mobile interactive controls.
  ```

---

### Issue 11: Production Hardening, Code Quality, Logging & Security Audit
- **Title**: `chore(hardening): clean console logs, error handling sanitization, and dependency audit`
- **Labels**: `hardening`, `security`, `quality`, `sprint-4`
- **Target Branch**: `feature/lab4-hardening`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `FR-21`, `FR-22`, `BR-05`
- **Linked Tests**: `TEST-ACT-16`
- **Body**:
  ```markdown
  ### Description
  Perform final production hardening:
  - Remove all debugging `console.log` statements and placeholder comments.
  - Verify zero runtime console warnings or errors during browser execution.
  - Verify error handling sanitization: no stack traces or database errors leaked to clients.
  - Run linter (`npm run lint`) and typecheck (`npm run typecheck`) with 0 errors.

  ### Acceptance Criteria
  - [ ] Linter and typechecker pass with 0 errors.
  - [ ] Zero unhandled errors in server and client console logs.
  ```

---

### Issue 12: Lab 4 Release Integration & Peer Review Submission Pack
- **Title**: `release: integrate Sprint 4 increment, human peer review, and submission bundle`
- **Labels**: `release`, `review`, `sprint-4`
- **Target Branch**: `lab4-staging` $\rightarrow$ `main`
- **Kanban Status**: **Done (Closed on GitHub)**
- **Linked Requirements**: `AC-01..AC-28`
- **Body**:
  ```markdown
  ### Description
  Final integration of Sprint 4:
  - Merge feature increments into `lab4-staging`.
  - Conduct human peer review with teammates (@Beethoven190, @supa-gif173).
  - Document review comments, resolutions, approval, and merge SHAs in `reviewer.md`.
  - Generate final PDF submission package mapping to Answer Parts 1–9.

  ### Acceptance Criteria
  - [ ] PR peer reviewed and approved by human teammate (no self-merge).
  - [ ] All automated tests green on `main`.
  - [ ] Submission bundle assembled with evidence and checklist.
  ```
