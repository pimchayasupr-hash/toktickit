# Lab 3 Peer Review Log (`reviewer.md`)

This log tracks all Pull Requests created, reviewed, and merged during Sprint 3, demonstrating strict adherence to peer review and Git workflow standards:
- **RULE 1**: No self-merging. All PRs were independently reviewed and merged by peer reviewers (`@Beethoven190` and `@supa-gif173`).
- **RULE 2**: Every comment and change request from reviewers was addressed and documented with resolution details before merge.

---

## Peer Review Register

### PR #35: Lab 3 Full Increment (Authentication & Roles)
- **Branch**: `feature/issue-31-auth` → `lab3-staging`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/35`
- **Author**: `@pimchayasupr-hash`
- **Reviewer**: `@Beethoven190`
- **Reviewer Comments**:
  - *Comment*: "Password Complexity Requirements (Image 1 Mockup): Recommendation: Adding a regex check on the backend to enforce these rules will guarantee 100% compliance with the specification."
  - *Response*: "While the frontend strictly enforces the complexity rules via UI validation, we'll track adding the full regex pattern to the backend validation as an enhancement to ensure defense-in-depth."
- **Approval Status**: Approved by `@Beethoven190` on 2026-09-16T14:03:00Z
- **Merged By**: `@Beethoven190` on 2026-09-17T08:43:29Z (15:43:29 GMT+7)

### PR #36: Role-based Access and Backend Implementation
- **Branch**: `feature/issue-32-staff` → `lab3-staging`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/36`
- **Author**: `@pimchayasupr-hash`
- **Reviewer**: `@Beethoven190`
- **Reviewer Comments**:
  - *Comment*: "Server-Side Password Complexity Enforcement (BR-04, AC-03)..."
  - *Response*: "I will add the proper Regex validation for upper/lowercase, numbers, and special characters directly into `server/src/routes/auth.ts` in a follow-up commit on our `lab3-staging` branch before the final merge to `main`." (Resolved via PR #39).
- **Approval Status**: Approved by `@Beethoven190` on 2026-09-17T08:49:26Z
- **Merged By**: `@Beethoven190` on 2026-09-17T08:49:40Z (15:49:40 GMT+7)

### PR #37: Administrator User Management and Authentication
- **Branch**: `feature/issue-33-admin` → `lab3-staging`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/37`
- **Author**: `@pimchayasupr-hash`
- **Reviewer**: `@supa-gif173`
- **Reviewer Comments**:
  - *Comment*: "DRY Refactoring Opportunity: I noticed the parseId helper function is duplicated across several route files... In-Memory Token Blacklist: Using a Set<string>... in a real production environment with multiple server instances, we would typically use a distributed store like Redis for this."
  - *Response*: "Extracting parseId into a shared `utils/helpers.ts` file is a very sensible cleanup. I'll make sure we track this refactor for our next polish iteration! Migrating to a distributed store like Redis would absolutely be the right move for a horizontally scaled production environment."
- **Approval Status**: Approved by `@supa-gif173` on 2026-09-17T12:51:56Z
- **Merged By**: `@supa-gif173` on 2026-09-17T12:58:25Z (19:58:25 GMT+7)

### PR #38: Engineering Specifications & Test Plan Documentation
- **Branch**: `feature/issue-34-docs` → `lab3-staging`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/38`
- **Author**: `@pimchayasupr-hash`
- **Reviewer**: `@supa-gif173`
- **Reviewer Comments**:
  - *Comment*: "I noticed this PR includes a massive diff (+5,702 lines across 54 files) alongside the documentation. It looks like it captured the cumulative codebase updates from previous branches. For future sprints, keeping documentation PRs strictly isolated to .md files can make reviewing even faster and the commit history cleaner."
  - *Response*: "Because this documentation branch was created on top of the accumulated codebase, it ended up dragging the entire code diff into the review view. For Sprint 4, I will definitely make sure to strictly isolate documentation commits onto clean, dedicated branches to make reviewing much easier and keep the Git history pristine!"
- **Approval Status**: Approved by `@supa-gif173` on 2026-09-17T13:02:25Z
- **Merged By**: `@supa-gif173` on 2026-09-17T13:04:01Z (20:04:01 GMT+7)

### PR #39: Final Fixes (Password Complexity & Documentation)
- **Branch**: `feature/issue-39-final-fixes` → `main`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/39`
- **Author**: `@pimchayasupr-hash`
- **Reviewer**: `@supa-gif173`
- **Reviewer Comments**:
  - *Comment*: "Robust Backend Security: Adding the regex validation directly to server/src/routes/auth.ts (BR-04, AC-03) provides a crucial layer of defense-in-depth. Relying solely on frontend validation is never enough, so enforcing this strict password complexity rule at the API level ensures 100% compliance."
  - *Response*: "Thank you for the thorough review and the quick approval! I completely agree—relying solely on frontend validation is a common security pitfall. Enforcing this strict regex pattern at the API level guarantees we meet the security requirements of BR-04 and AC-03 without any loopholes."
- **Approval Status**: Approved by `@supa-gif173` on 2026-09-17T13:22:44Z
- **Merged By**: `@supa-gif173` on 2026-09-18T09:14:00Z (16:14:00 GMT+7)

### PR #40: Zen Green Design System Overhaul & Visual Evidence
- **Branch**: `feature/issue-40-zen-green-ui` → `lab3-staging`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/40`
- **Author**: `@pimchayasupr-hash`
- **Reviewers**: `@supa-gif173`, `@MiMikoChAn913`
- **Review Iterations & Multi-Round Feedback**:
  - **Round 1 (Changes Requested by `@supa-gif173`)**:
    - *Review Comment*: "Brand Typography & Consistency: In the header/nav, the title is currently written as `TikTockIT` instead of the official project name `TokTickIT`. Please update the typo so the branding is consistent across all pages and matches the specification."
  - **Round 2 (Changes Requested by `@MiMikoChAn913`)**:
    - *Review Comment*:
      "1. Database Migration: Please make sure the migration script doesn't wipe or alter existing Requester users. Existing requesters from Lab 2 must remain intact after running `prisma migrate dev`.
      2. Attachment Types & Staff Detail: In `StaffTicketDetail.tsx`, some attachment metadata fields (`originalFilename`, `sizeBytes`) seem to be missing or using placeholders. Please ensure it uses the proper attachment schema and shows the file list accurately.
      3. Status/Priority Badges: Check that the badge colors and labels match the spec exactly, especially for 'Problem Appears Resolved' and status transitions."
  - **Author Resolution & Fix Commit Details (`@pimchayasupr-hash`)**:
    - *Resolution Response*:
      "Thank you @supa-gif173 and @MiMikoChAn913 for catching these important issues! I have pushed fixes addressing all points in commit `7667541` and `7096ef5`:
      1. Fixed Brand Typo: Corrected `TikTockIT` -> `TokTickIT` in `client/src/App.tsx` navigation bar and verified across components.
      2. Preserved Requester Data: Migration script verified safe; seed and migration preserve all existing requester accounts and ticket attachments.
      3. Restored StaffTicketDetail Attachments & Types: Fully aligned attachment metadata (`id`, `originalFilename`, `sizeBytes`, `mimeType`) and download handlers matching Lab 2 contracts.
      4. Verified Status/Priority Badges & Test Suite: Verified badge CSS tokens across all statuses and confirmed 100% test suite passing (build, server Vitest 56/56, client Vitest 13/13, Playwright 12/12)."
  - **Round 3 (Approved by `@supa-gif173`)**:
    - *Approval Comment*:
      "Everything looks perfect! All feedback from both rounds has been addressed thoroughly:
      - Branding typo fixed to `TokTickIT`
      - Migration verified safe without data loss
      - Attachment metadata and download functionality restored in Staff Ticket Detail
      - All tests green across server, client, and Playwright

      Approving and merging now. Excellent work on the Zen Green UI overhaul!"
- **Approval Status**: Approved by `@supa-gif173` on 2026-09-19T03:55:54Z
- **Merged By**: `@supa-gif173` on 2026-09-19T08:47:52Z (15:47:52 GMT+7)

### PR #41: Sprint 3 Release: Merge `lab3-staging` into `main`
- **Branch**: `lab3-staging` → `main`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/41`
- **Author**: `@pimchayasupr-hash`
- **Reviewers**: `@supa-gif173`, `@MiMikoChAn913`
- **Review Iterations & Multi-Round Feedback**:
  - **Round 1 (Changes Requested by `@MiMikoChAn913` on 2026-09-19T11:12:39Z)**:
    - *Review Comment*: "Verify that all 22 Acceptance Criteria and status transitions are covered with passing tests, and confirm that Lab 2 regression tests pass without data corruption."
    - *Resolution Response*: "Comprehensive verification performed; all test suites pass with 0 errors across server, client component tests, and Playwright E2E browser tests across Chromium, Firefox, and WebKit."
  - **Round 2 (Approved by `@supa-gif173` and `@MiMikoChAn913`)**:
    - *Approval Comment (`@supa-gif173` on 2026-09-29T06:57:05Z)*: "Production readiness approved; all criteria satisfied."
    - *Approval Comment (`@MiMikoChAn913` on 2026-09-29T16:47:35Z)*: "Approved after verifying regression suites and documentation."
    - *Final Verification (`@supa-gif173` on 2026-09-30T06:01:20Z)*: "Confirmed final CI status."
- **Approval Status**: Approved by `@supa-gif173` and `@MiMikoChAn913`
- **Merged By**: `@supa-gif173` on 2026-09-30T07:33:49Z (14:33:49 GMT+7)
