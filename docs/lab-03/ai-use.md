# Lab 3 AI Usage Log & Reflection (`ai-use.md`)

## 1. AI Tooling Metadata
- **AI Model**: Antigravity (Google DeepMind Gemini 3.6 Flash High)
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
> "Generate Jest/Supertest API tests under server/tests/lab-03/, RTL component tests under client/src/tests/lab-03/, and Playwright E2E tests under e2e/lab-03/ achieving 100% AC traceability."

---

## 3. Reflection on AI Assistance

### Specification Agent Efficiency
The AI assistant rapidly translated ambiguous stakeholder needs and PDF handouts into structured, numbered Functional Requirements, Business Rules, and Acceptance Criteria. Having the spec created *before* coding prevented architectural debt and ensured client-server contract alignment.

### Coding & Refactoring Value
Using AI for pair programming accelerated repetitive boilerplate creation (such as Express routers, Prisma queries, and React form state handlers) while allowing human focus on critical business rules:
- **Server Authorization**: Rigorously enforcing RBAC at the Express middleware layer rather than trusting client state.
- **Data Integrity**: Ensuring idempotent database seeding and preserving foreign key references from Lab 2.
- **Safety Rule Enforcements**: Preventing admin self-lockout or last-admin deactivation.

Overall, leveraging the AI agent within a strict Spec DD and Test DD workflow resulted in high code quality, complete test coverage, and smooth incremental software engineering.
