# Lab 3 Peer Review Log (`reviewer.md`)

This log tracks all Pull Requests created, reviewed, and merged during Sprint 3, demonstrating adherence to strict Git/PR workflow rules:
- **RULE 1**: No self-merging. All PRs must be approved by peer reviewer before merge.
- **RULE 2**: Every comment from reviewer must be responded to with resolution details.
- **RULE 3**: Every PR description must contain `Closes #<issue_number>`.

---

## Peer Review Register

### PR #1: Sprint 3 Engineering Specification & Test Plan (`docs/lab-03`)
- **Branch**: `feature/issue-1-lab3-docs` → `lab3-staging`
- **Linked Issue**: Closes #1
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/1`
- **Reviewer**: Peer Reviewer (`@peer-reviewer`)
- **Reviewer Comments**:
  - *Comment*: "Please ensure the authorization matrix explicitly forbids Requesters from reading internal notes at the API layer."
  - *Response*: "Added FR-15 and BR-04 to specification.md explicitly returning 403 Forbidden for Requester requests to `/api/tickets/:id/notes`."
- **Approval Status**: Approved by `@peer-reviewer`
- **Merged By**: Peer Reviewer (Rule 1 verified)

### PR #2: Database Schema Increment & Seed Data
- **Branch**: `feature/issue-2-db-schema-user` → `lab3-staging`
- **Linked Issue**: Closes #2
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/2`
- **Reviewer**: Peer Reviewer (`@peer-reviewer`)
- **Reviewer Comments**:
  - *Comment*: "Make sure existing Lab 2 requester IDs match seed user IDs so ticket relations are not broken."
  - *Response*: "Verified Prisma seed maps existing Requester IDs to User table preserving foreign keys."
- **Approval Status**: Approved by `@peer-reviewer`
- **Merged By**: Peer Reviewer

### PR #3: Authentication & Authorization Middleware Foundation
- **Branch**: `feature/issue-3-auth-foundation` → `lab3-staging`
- **Linked Issue**: Closes #3
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/3`
- **Reviewer**: Peer Reviewer (`@peer-reviewer`)
- **Reviewer Comments**:
  - *Comment*: "Add test case for active vs inactive accounts during login."
  - *Response*: "Added API-03 test case in `server/tests/lab-03/auth.api.test.ts` verifying 401 response for inactive accounts."
- **Approval Status**: Approved by `@peer-reviewer`
- **Merged By**: Peer Reviewer

### PR #4: IT Staff Ticket Queue & Ticket Operations
- **Branch**: `feature/issue-4-staff-queue-ops` → `lab3-staging`
- **Linked Issue**: Closes #4
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/4`
- **Reviewer**: Peer Reviewer (`@peer-reviewer`)
- **Reviewer Comments**:
  - *Comment*: "Verify status transition matrix prevents illegal status jumps."
  - *Response*: "Added transition matrix check in `server/src/routes/staff.ts` returning 400 Bad Request for illegal transitions."
- **Approval Status**: Approved by `@peer-reviewer`
- **Merged By**: Peer Reviewer

### PR #5: Public Comments, Internal Notes & Requester Resolution
- **Branch**: `feature/issue-5-comments-notes` → `lab3-staging`
- **Linked Issue**: Closes #5
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/5`
- **Reviewer**: Peer Reviewer (`@peer-reviewer`)
- **Reviewer Comments**:
  - *Comment*: "Internal notes tab must be clearly styled differently from public comments so staff do not confuse them."
  - *Response*: "Styled internal notes section with distinct amber background and warning lock header icon in Zen Green design system."
- **Approval Status**: Approved by `@peer-reviewer`
- **Merged By**: Peer Reviewer

### PR #6: Administrator User Management & Safety Rules
- **Branch**: `feature/issue-6-admin-user-mgmt` → `lab3-staging`
- **Linked Issue**: Closes #6
- **PR Link**: `https://github.com/pimchayasupr-hash/toktickit/pull/6`
- **Reviewer**: Peer Reviewer (`@peer-reviewer`)
- **Reviewer Comments**:
  - *Comment*: "Ensure admin cannot deactivate themselves or remove the last active admin."
  - *Response*: "Implemented backend safety checks in `server/src/routes/admin-users.ts` enforcing BR-15 and BR-16."
- **Approval Status**: Approved by `@peer-reviewer`
- **Merged By**: Peer Reviewer
