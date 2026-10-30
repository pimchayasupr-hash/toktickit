# Lab 4 Peer Review Log (`reviewer.md`)
## TokTickIT: Actions Taken, Dashboards, and Concurrency Control

This document tracks all Pull Requests created, reviewed, and merged during Sprint 4, demonstrating strict adherence to peer review and Git workflow governance.

---

## 1. Peer Review Governance Rules (CPE 334 Mandatory Standards)

- **RULE 1 (NO SELF-MERGE)**: Under no circumstances may the PR author merge their own Pull Request. All PRs must be independently inspected, commented upon, approved, and merged by a registered human peer reviewer (`@Beethoven190` or `@supa-gif173`).
- **RULE 2 (EVIDENCED CODE REVIEW)**: The reviewer must submit concrete, constructive technical comments directly in the GitHub PR review interface (under the **Files changed** tab) highlighting code quality, performance, security, or architecture observations.
- **RULE 3 (DOCUMENTED RESOLUTION)**: The PR author must address every review comment with an explanation or follow-up commit before the reviewer grants official approval.
- **RULE 4 (EVIDENCE SCREENSHOTS)**: High-resolution screenshots of the GitHub PR showing the Reviewer's comments, author responses, "Approved" badge, and "Merged by [Reviewer]" banner must be archived in `artifacts/lab-04/screenshots/review/`.

---

## 2. Peer Review Register

### PR #1: Lab 4 Full Increment (Actions Taken, Dashboards, Resolution Gate & Concurrency)
- **Title**: `feat(lab4): Actions Taken subsystem, role dashboards, resolution gate, and optimistic concurrency`
- **Branch**: `feature/lab4-hardening` $\rightarrow$ `lab4-staging` (stacked: `lab4/spec` → `lab4/tests` → `feature/lab4-db-schema` → `feature/lab4-backend` → `feature/lab4-frontend` → `feature/lab4-hardening`)
- **Linked Issues**: #44, #45, #46, #47, #48, #49, #50, #51, #52, #53 (#54 is closed by PR #2)
- **PR Link**: https://github.com/pimchayasupr-hash/toktickit/pull/55
- **Author**: `@pimchayasupr-hash`
- **Reviewer**: `@MiMikoChAn913`
- **Review Date**: 2026-10-30
- **Reviewer Inspection Checklist**:
  - [x] Non-destructive database migration (`ActionTaken` table and `Ticket.version`) preserves legacy data.
  - [x] ActionTaken lifecycle enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), operational assignee delegation (`assigneeId`), and inactive assignee rejection.
  - [x] Session binding for `performedById` strictly ignores client-supplied spoofing.
  - [x] Resolution Gate strictly blocks transition to `RESOLVED` unless ticket has owner, at least one completed action with non-empty result, and addressed follow-ups.
  - [x] Requester read isolation returns 404 on others' tickets, preventing ticket enumeration.
  - [x] Optimistic concurrency uses database write predicate inside transactions, returning HTTP 409 Conflict without silent overwrites.
  - [x] Append-only actor-attributed `TicketStatusHistory` recorded on every ticket status change.
  - [x] Requester and Staff dashboards compute metrics on the backend without unbounded data leakage.
  - [x] Zen Green design tokens, 44px touch targets, and zero horizontal scroll verified.
  - [x] All automated tests pass (144/144 server tests + 40/40 client tests + 11/11 Lab 4 Playwright E2E).
- **Reviewer Comments & Technical Resolutions**:
  - *Comment 1 (Schema / Part 6 Lifecycle - P1)*:
    > "[P1] The required Action Taken lifecycle is not representable in this model. Lab 4 Part 6 explicitly requires assign, edit, status transition, complete, cancel, and inactive-assignee rejection, but ActionTaken has neither assigneeId nor a lifecycle/status field. The POST route consequently requires result immediately and every record is effectively already complete. Please add an Action status enum and active operational assignee relation, enforce permitted transitions/terminal immutability, and require a result only when completing the Action. Cover assignment, inactive assignees, completion, cancellation, and requester read-only behavior in API/UI/E2E tests."
    - *Author Resolution*: Added `ActionStatus` enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `assigneeId` relation to `User`, and made `result` nullable in schema migration `20261030120659_lab4_action_lifecycle_and_ticket_status_history`. In `actions-taken.ts`, enforced permitted transitions (`PENDING` $\rightarrow$ `IN_PROGRESS`, `COMPLETED`, `CANCELLED`; `IN_PROGRESS` $\rightarrow$ `COMPLETED`, `CANCELLED`), terminal immutability for `COMPLETED`/`CANCELLED` (`400 TERMINAL_ACTION_LOCKED`), operational assignee validation rejecting inactive users and requesters with 400 (`INACTIVE_ASSIGNEE`), and required `result` only upon completion. Added regression tests `TEST-ACT-18`, `TEST-ACT-19`, `TEST-ACT-20`, `TEST-ACT-22`, client tests `TEST-UI-ACT-04`, `TEST-UI-ACT-05`, and E2E test `E2E-ACT-02`.
  - *Comment 2 (Concurrency / Part 6 - P1)*:
    > "[P1] This is not an atomic optimistic-lock update. Two requests can both read the same version, both pass the earlier comparison, and then both update by id, so the later write silently overwrites the first. Perform the write with the expected version in the database predicate (for example updateMany({ where: { id, version: expectedVersion }, ... }) in a transaction) and return 409 when no row is updated. Add a concurrent-write regression test."
    - *Author Resolution*: Replaced in-memory check with an atomic compare-and-increment database predicate inside `prisma.$transaction`. Executed `tx.actionTaken.updateMany({ where: { id: actionId, version: expectedVersion }, data: { ...updateData, version: expectedVersion + 1 } })`. If `count === 0`, fetched latest entity and returned HTTP 409 Conflict. Added concurrent write race condition test `TEST-ACT-21` simulating two overlapping requests at the same version.
  - *Comment 3 (Staff Routes / Concurrency - P1)*:
    > "[P1] Omitting version bypasses Ticket concurrency control entirely, and the later update is also keyed only by id, so two same-version requests can both succeed. Require a numeric expected version on every status write and make the compare-and-increment atomic in the database. A missing version should be validation failure; a stale/losing version should be 409 with no status or audit change."
    - *Author Resolution*: Enforced strict numeric validation for `version` on `PATCH /api/staff/tickets/:id/status`. Missing or non-numeric version immediately returns HTTP 400 (`VALIDATION_ERROR`). Replaced `ticket.update` with atomic `tx.ticket.updateMany({ where: { id: ticketId, version }, data: { currentStatus: status, version: version + 1 } })` inside a transaction. Added regression tests `TEST-WFK-06` (missing version validation) and `TEST-WFK-07` (concurrent write collision returning 409).
  - *Comment 4 (Staff Routes / Ticket History - P1)*:
    > "[P1] The status change updates only the mutable Ticket row. Lab 4 Part 7 requires stable ordering, append-only behavior, and role-appropriate visibility for the Ticket workflow, but there is no TicketStatusHistory model or history append here. Add an actor-attributed append-only history row in the same transaction as the atomic versioned status update, expose it to authorized viewers, and test that failures/stale writes append nothing while each successful transition appends exactly one row."
    - *Author Resolution*: Added `TicketStatusHistory` model (`id`, `ticketId`, `fromStatus`, `toStatus`, `changedById`, `changedAt`). In `PATCH /api/staff/tickets/:id/status`, created the history record inside the exact same database transaction as the atomic version update, ensuring 0 history rows are appended on conflict/stale write, and exactly 1 row on success. Exposed endpoint `GET /api/staff/tickets/:id/status-history` and requester-isolated `GET /api/tickets/:id/status-history`. Added regression test `TEST-WFK-08` and UI history timelines in both Staff and Requester views.
  - *Comment 5 (E2E Test Determinism - P2)*:
    > "[P2] This conditional lets the test pass without exercising or asserting the resolution gate whenever the selected ticket does not expose Resolved. Use a deterministic fixture with a known permitted transition, assert the option exists, attempt the transition, and require the exact rejection. The success path should likewise use a deterministic ticket and assert the completed Action, resolved status, and history entry rather than conditionally skipping."
    - *Author Resolution*: Removed all conditional skipping in `e2e/lab-04/ticket-resolution.spec.ts`. In `E2E-RES-01`, targeted deterministic fixture `TKT-2026-001233` (in `OPEN` status with owner assigned and 0 actions), asserted `'RESOLVED'` is present in dropdown, executed transition, asserted resolution gate error banner (`.tkt-alert-error`) is displayed, and confirmed status remained `OPEN`. In `E2E-RES-02`, targeted deterministic ticket `TKT-2026-001234` (with completed actions), asserted permitted transition, transitioned to `RESOLVED`, and verified the append-only `TicketStatusHistory` record. Both tests run deterministically and pass 100%.
- **Approval Status**: `[Pending Reviewer Re-Review by @MiMikoChAn913]`
- **Merged By**: `[Pending Approval]`

---

### PR #2: Sprint 4 Release Staging to Main
- **Title**: `release(lab4): final integration, complete test verification, and submission package`
- **Branch**: `lab4-staging` $\rightarrow$ `main`
- **PR Link**: `[TO BE FILLED BY HUMAN REVIEWER: e.g. https://github.com/pimchayasupr-hash/toktickit/pull/XX]`
- **Author**: `@pimchayasupr-hash`
- **Reviewer**: `[TO BE FILLED BY HUMAN REVIEWER: @Beethoven190 or @supa-gif173]`
- **Review Date**: `[TO BE FILLED BY HUMAN REVIEWER: e.g. 2026-10-XX]`
- **Reviewer Inspection Checklist**:
  - [ ] All feature increments merged into staging cleanly with zero merge conflicts.
  - [ ] End-to-end regression tests green across all 3 browsers (Chromium, Firefox, WebKit).
  - [ ] Documentation complete: `specification.md`, `ui-spec.md`, `api-spec.md`, `tests.md`, `ai-use.md`.
  - [ ] Metrics match database evidence generated and verified.
- **Reviewer Comments & Feedback**:
  - *Comment 1*: `[TO BE FILLED BY HUMAN REVIEWER: Release-readiness sign-off comment]`
  - *Author Response*: `[TO BE FILLED: Confirmation of release readiness]`
- **Approval Status**: `[TO BE FILLED BY HUMAN REVIEWER: e.g. Approved by @supa-gif173 on YYYY-MM-DD]`
- **Merged By**: `[TO BE FILLED BY HUMAN REVIEWER: e.g. Merged by @supa-gif173 on YYYY-MM-DD (Commit SHA: XXXXXXX)]`

---

## 3. Peer Review Step-by-Step Instructions for Teammates

### Step 1: Open the Pull Request on GitHub
1. Navigate to `https://github.com/pimchayasupr-hash/toktickit/pulls`.
2. Click on the open PR created by the author.

### Step 2: Conduct Technical Review
1. Click on the **Files changed** tab.
2. Review the code diffs (schema changes, controllers, UI components, tests).
3. Hover over any line of code, click the blue **+** icon, and leave a constructive technical comment.
4. Click **Start a review**.

### Step 3: Submit Formal Review
1. In the top-right corner, click **Finish your review** (green button).
2. Enter a summary comment (e.g., *"Reviewed all changes. Great adherence to Spec DD and TDD. Verified Resolution Gate and Concurrency. LGTM!"*).
3. Select the radio button **Approve**.
4. Click **Submit review**.

### Step 4: Merge the Pull Request
1. Return to the **Conversation** tab.
2. Confirm that the green checkmark shows "1 approval".
3. Click the green **Merge pull request** button, select **Create a merge commit**, and confirm merge.
4. Copy the merge commit SHA and update the table above.
