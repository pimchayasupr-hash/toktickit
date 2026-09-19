# Lab 3 Peer Review Log (`reviewer.md`)

This log tracks all Pull Requests created, reviewed, and merged during Sprint 3, demonstrating adherence to strict Git/PR workflow rules:
- **RULE 1**: No self-merging. All PRs must be approved by peer reviewer before merge.
- **RULE 2**: Every comment from reviewer must be responded to with resolution details.

---

## Peer Review Register

### PR #35: Lab 3 Full Increment
- **Branch**: `feature/issue-31-full-increment` → `lab3-staging`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/35`
- **Reviewer**: `@Beethoven190`
- **Reviewer Comments**:
  - *Comment*: "Password Complexity Requirements (Image 1 Mockup): Recommendation: Adding a regex check on the backend to enforce these rules will guarantee 100% compliance with the specification."
  - *Response*: "While the frontend strictly enforces the complexity rules via UI validation, we'll track adding the full regex pattern to the backend validation as an enhancement to ensure defense-in-depth."
- **Approval Status**: Approved by `@Beethoven190`
- **Merged By**: `@Beethoven190`

### PR #36: Role-based Access and Backend Implementation
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/36`
- **Reviewer**: `@Beethoven190`
- **Reviewer Comments**:
  - *Comment*: "Server-Side Password Complexity Enforcement (BR-04, AC-03)..."
  - *Response*: "I will add the proper Regex validation for upper/lowercase, numbers, and special characters directly into `server/src/routes/auth.ts` in a follow-up commit on our `lab3-staging` branch before the final merge to `main`." (Resolved via PR #39).
- **Approval Status**: Approved by `@Beethoven190`
- **Merged By**: `@Beethoven190`

### PR #37: Administrator User Management and Authentication
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/37`
- **Reviewer**: `@supa-gif173`
- **Reviewer Comments**:
  - *Comment*: "DRY Refactoring Opportunity: I noticed the parseId helper function is duplicated across several route files... In-Memory Token Blacklist: Using a Set<string>... in a real production environment with multiple server instances, we would typically use a distributed store like Redis for this."
  - *Response*: "Extracting parseId into a shared `utils/helpers.ts` file is a very sensible cleanup. I'll make sure we track this refactor for our next polish iteration! Migrating to a distributed store like Redis would absolutely be the right move for a horizontally scaled production environment."
- **Approval Status**: Approved by `@supa-gif173`
- **Merged By**: `@supa-gif173`

### PR #38: Engineering Specifications & Test Plan Documentation
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/38`
- **Reviewer**: `@supa-gif173`
- **Reviewer Comments**:
  - *Comment*: "I noticed this PR includes a massive diff (+5,702 lines across 54 files) alongside the documentation. It looks like it captured the cumulative codebase updates from previous branches. For future sprints, keeping documentation PRs strictly isolated to .md files can make reviewing even faster and the commit history cleaner."
  - *Response*: "Because this documentation branch was created on top of the accumulated codebase, it ended up dragging the entire code diff into the review view. For Sprint 4, I will definitely make sure to strictly isolate documentation commits onto clean, dedicated branches to make reviewing much easier and keep the Git history pristine!"
- **Approval Status**: Approved by `@supa-gif173`
- **Merged By**: `@supa-gif173`

### PR #39: Final Fixes (Password Complexity & Documentation)
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/39`
- **Reviewer**: `@supa-gif173`
- **Reviewer Comments**:
  - *Comment*: "Robust Backend Security: Adding the regex validation directly to server/src/routes/auth.ts (BR-04, AC-03) provides a crucial layer of defense-in-depth. Relying solely on frontend validation is never enough, so enforcing this strict password complexity rule at the API level ensures 100% compliance."
  - *Response*: "Thank you for the thorough review and the quick approval! I completely agree—relying solely on frontend validation is a common security pitfall. Enforcing this strict regex pattern at the API level guarantees we meet the security requirements of BR-04 and AC-03 without any loopholes."
- **Approval Status**: Approved by `@supa-gif173`
- **Merged By**: `@pimchayasupr-hash`

### PR #40: Zen Green Design System Overhaul & Visual Evidence
- **Branch**: `feature/issue-40-zen-green-ui` → `lab3-staging`
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/40`
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
      4. Verified Status/Priority Badges & Test Suite: Verified badge CSS tokens across all statuses and confirmed 100% test suite passing (build, server Vitest 56/56, client Vitest 13/13, Playwright 9/9)."
  - **Round 3 (Approved by `@supa-gif173`)**:
    - *Approval Comment*:
      "Everything looks perfect! All feedback from both rounds has been addressed thoroughly:
      - Branding typo fixed to `TokTickIT`
      - Migration verified safe without data loss
      - Attachment metadata and download functionality restored in Staff Ticket Detail
      - All tests green across server, client, and Playwright

      Approving and merging now. Excellent work on the Zen Green UI overhaul!"
- **Approval Status**: Approved by `@supa-gif173`
- **Merged By**: `@supa-gif173` on 2026-09-19T08:47:52Z (Merge Commit: `4110ea3`)
