# Lab 3 AI Usage Log & Reflection (`ai-use.md`)

## 1. AI Tooling Metadata
- **AI Model**: Antigravity (Google DeepMind Gemini 3.6 Flash High & Gemini 3.8 Flash)
- **Role & Usage Mode**: Pair-Programming Assistant, Spec-Driven Development Agent, Test Generation & Refactoring Assistant.

---

## 2. Selected Key Prompts (6–10 Selected Prompts)

### Prompt 1: Engineering Contract & Spec Generation
> "Analyze Lab_3_sheet.pdf and create the complete Sprint 3 engineering specification files under docs/lab-03/ ensuring all FRs, BRs, data models, API endpoints, and acceptance criteria are covered."

### Prompt 2: Prisma Schema Evolving & Migration Strategy
> "Update server/prisma/schema.prisma to introduce the unified User model with roles (REQUESTER, STAFF, ADMIN), mustChangePassword, PublicComment, InternalNote, and update Ticket model for ownerId and IT Priority while keeping Lab 2 requester IDs compatible."

### Prompt 3: Server Authentication & Password Hashing Foundation
> "Implement server/src/routes/auth.ts and server/src/middleware/authMiddleware.ts for email/password login using bcryptjs, JWT session token generation, logout, me endpoint, and mandatory password change enforcement."

### Prompt 4: IT Staff Queue & Operational Endpoints
> "Build IT Staff shared ticket queue endpoint GET /api/staff/tickets supporting search, filtering by status/priority/owner, sorting, and pagination, along with ticket claim, reassign, IT priority, and status transition endpoints."

### Prompt 5: Public Comments & Private Internal Notes API
> "Implement GET and POST endpoints for Public Comments and Internal Notes, ensuring Internal Notes return 403 Forbidden for Requester role and enforcing append-only behavior."

### Prompt 6: Administrator User Management & Backend Safety Rules
> "Implement GET, POST, PATCH endpoints for /api/admin/users and password resets. Enforce backend safety rules BR-14 (unique email), BR-15 (prevent admin self-deactivation), and BR-16 (prevent deactivating last active admin)."

### Prompt 7: Zen Green React Components Integration
> "Create client components for Login, ChangePasswordModal, Navbar with user/role badge, StaffTicketQueue, StaffTicketDetail with tabbed comments/notes, and UserManagement, ensuring removal of the legacy Development Requester selector."

### Prompt 8: Comprehensive Automated Test Suite Generation
> "Generate Vitest/Supertest API tests under server/tests/lab-03/, RTL component tests under client/src/tests/lab-03/, and Playwright E2E tests under e2e/lab-03/ achieving 100% AC traceability."

---

## 3. Reflection on AI Assistance

### Living Specification & Iteration Evolution
Initial exploratory scaffolding and API route prototyping were created alongside contract drafting during sprint setup. The formal 11-section engineering specification was anchored in PR #43. As implementation progressed and peer reviews were conducted, the specification was actively maintained as a living engineering contract rather than a static document: Acceptance Criteria (AC-21, AC-22 for Admin deactivation guards, and AC-23 / BR-18 for password complexity) and test cases (API-21 to API-24) were systematically appended in response to review discoveries.

### Critical AI Limitations, Errors, and Review Discoveries
While AI dramatically accelerated route scaffolding, Prisma queries, and React UI layout, independent peer reviews exposed multiple critical omissions and false positives where AI code fell short:

- **Premature Claim of Security Enforcement:** The AI initially implemented client-only password complexity validation and erroneously claimed compliance, leaving the backend open. Peer review on PR #36 flagged this gap, which was remediated in commit `ee630ab` and PR #39 by adding server-side regex validation and automated tests.
- **Environment Initialization Race Condition:** The AI structured `server/src/index.ts` to import `app` before invoking `dotenv.config()`, causing `authMiddleware.ts` to evaluate `JWT_SECRET` prematurely. This was caught during PR #42 review, resolved via `server/src/loadEnv.ts`, and protected by a startup-level regression test (`jwt-secret-guard.test.ts`).
- **Insecure Query-Token Downloads:** The AI initially generated attachment download links passing bearer tokens in query parameters (`?token=...`). Reviewers correctly identified log and browser history leakage risks, prompting refactoring to authenticated `fetch()` with `Authorization: Bearer` headers and Blob URLs with user-facing failure alerts.

These experiences demonstrated that AI assistance accelerates authoring but requires rigorous human peer review, contract verification, and automated regression testing to achieve true production reliability.
