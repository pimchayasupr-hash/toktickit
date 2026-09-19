# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Lab 3 replaces the temporary Lab 2 Development Requester selector with production-ready user authentication and server-side role-based authorization. It introduces operational workflows for IT Staff (shared Ticket Queue, ticket claiming/reassignment, IT Priority setting, permitted status transitions, Public Comments, and private Internal Notes) and minimalist User Management for Administrators (user listing with search/filtering, account creation with single-role assignment, account editing/activation state, and initial password management). All Lab 2 Requester functions continue to work seamlessly using the authenticated user identity.

---

## 2. Stakeholder Request Interpretation

The stakeholder requires replacing the temporary development requester dropdown with secure, real-user authentication and authorization.

1. **Authentication & First-Login Password Change**: Users authenticate using an email address and password. Any user signed in with an initial/temporary password must be forced to change their password on first login before accessing normal application features.
2. **Requester Workflow Continuity**: Requesters operate using their authenticated identity (rather than a client-supplied `requesterId`). They can view/create their own tickets and attachments, post Public Comments, and indicate that a problem "appears resolved", while formally setting Resolved/Closed status remains an IT Staff responsibility.
3. **IT Staff Workflow**: IT Staff access a shared Ticket Queue with search, status/priority filtering, sorting, and pagination. They can open ticket details, claim or reassign ticket ownership, adjust IT Priority, perform permitted status transitions, post Public Comments, and write private Internal Notes.
4. **Administrator User Management**: Administrators use a minimalist screen to list, search, and filter accounts; create new users with 1 permitted role (`REQUESTER`, `STAFF`, `ADMIN`) and an initial password; edit account info and activation state; and set new initial passwords. Safety rules prevent Administrators from deactivating their own account or deactivating the last active Administrator.
5. **Backend Security**: All authorization and ownership rules are enforced strictly by the backend API. Hidden UI controls are for UX only, not security.
6. **Design System**: The application strictly reuses and extends the established Zen Green design system tokens and reusable component conventions.

---

## 3. Scope

### 3.1 Included Work
- Authentication foundation: Email & password login, logout, current user retrieval (`/api/auth/me`), mandatory first-login password change.
- Server-side Role-Based Access Control (RBAC): Roles `REQUESTER`, `STAFF`, `ADMIN`.
- Data Model & Migration: Unified `User` model, updated `Ticket` model with `ownerId` and `itPriority`, new `PublicComment` and `InternalNote` models. Idempotent seeding.
- Requester Ticket Detail extensions: Public Comments section and "Problem Appears Resolved" indication.
- Removal of Development Requester selector and client-side selector state.
- IT Staff Ticket Queue: Shared queue with search by summary/description/ticket number, filters (status, category, related system, priority, owner), sorting, and pagination.
- IT Staff Ticket Operations: Claim ticket, reassign ownership, update IT Priority, execute permitted status transitions (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CLOSED, REOPENED, CANCELLED).
- Public Comments (visible to Requester, IT Staff, Admin) & Internal Notes (visible ONLY to IT Staff and Admin), both append-only.
- Administrator User Management: Minimalist screen showing user list, search by name/email, role filter, create user (with initial password), edit account details/activation, reset initial password.
- Admin safety rules: Prevent self-deactivation, prevent deactivating the last active Admin, prevent duplicate emails.
- Responsive Zen Green UI extensions across Desktop, Tablet, and Mobile.
- Automated API, UI component, and E2E test suites with AC traceability.

### 3.2 Explicitly Excluded Work
- Email invitations, password-reset emails via SMTP, MFA, social login, SSO.
- Self-registration / public sign-up.
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculation, automated escalation rules, email notifications.
- Advanced KPI analytics dashboards.
- Multi-tenant, multi-department, multi-role per user.
- User deletion, bulk operations, user import/export.
- Profile pictures, department/organization structures, audit history tables.
- Account unlocking workflows or approval workflows.
- Mandatory pagination or multi-column sorting in Admin User Management.

---

## 4. Functional Requirements

### 4.1 Authentication & Password Management
- **FR-01**: The backend MUST authenticate active users via email and password, returning an authenticated session token/cookie and user context.
- **FR-02**: The system MUST detect if a user has `mustChangePassword = true` and force the user to set a new valid password before accessing any main application routes.
- **FR-03**: The user MUST be able to log out, which invalidates the current session token/cookie server-side.
- **FR-04**: The backend MUST provide an endpoint (`GET /api/auth/me`) returning current authenticated user details and role.

### 4.2 Requester Regression & Ticket Continuity
- **FR-05**: The system MUST derive Requester identity solely from the authenticated session, rejecting client-supplied `requesterId` parameters.
- **FR-06**: Requesters MUST continue to create, list, view, search, filter, and add attachments to their owned tickets.
- **FR-07**: Requesters MUST be able to post Public Comments on their owned tickets.
- **FR-08**: Requesters MUST be able to click "Problem Appears Resolved", which adds a Public Comment or status request without directly overriding formal IT Staff status lifecycle.

### 4.3 IT Staff Ticket Queue & Ticket Operations
- **FR-09**: IT Staff MUST be able to view a shared Ticket Queue listing all tickets across all Requesters.
- **FR-10**: The Ticket Queue MUST support text search (ticket number, summary, description), filters (status, category, related system, priority, owner), sorting (created date, updated date, priority), and pagination.
- **FR-11**: IT Staff MUST be able to claim an unassigned ticket or reassign a ticket to any active IT Staff or Administrator user.
- **FR-12**: IT Staff MUST be able to update the IT Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) independently of Requested Priority.
- **FR-13**: IT Staff MUST be able to transition ticket status according to the approved status transition matrix.

### 4.4 Public Comments & Internal Notes
- **FR-14**: Authenticated users (Requester, IT Staff, Admin) MUST be able to view and create Public Comments on tickets they are authorized to access.
- **FR-15**: IT Staff and Administrators ONLY MUST be able to view and create Internal Notes on tickets. Requesters MUST be forbidden (403) from viewing or creating Internal Notes.
- **FR-16**: Both Public Comments and Internal Notes MUST be strictly append-only (no editing, no deletion). Empty or whitespace-only content MUST be rejected.

### 4.5 Administrator User Management
- **FR-17**: Administrators MUST be able to list all users, search by name or email, and filter by role (`REQUESTER`, `STAFF`, `ADMIN`).
- **FR-18**: Administrators MUST be able to create a new user account with Name, Email, exactly 1 Role, Activation status, and an Initial Password (with `mustChangePassword = true`).
- **FR-19**: Administrators MUST be able to edit a user's Name, Email, Role, and Active status.
- **FR-20**: Administrators MUST be able to set a new initial password for any user account, resetting `mustChangePassword` to `true`.
- **FR-21**: The backend MUST reject any attempt by an Administrator to deactivate their own account or deactivate the last remaining active Administrator.

---

## 5. Business Rules

| BR ID | Mandatory Business Rule Statement |
|---|---|
| **BR-01** | Only an active user account (`isActive = true`) with valid credentials may authenticate successfully. |
| **BR-02** | A user marked with `mustChangePassword = true` cannot access normal application screens or endpoints until a new valid password is saved. |
| **BR-03** | The authenticated user identity (derived from token/session), NOT a client-supplied `requesterId`, determines ownership of Requester operations. |
| **BR-04** | Public Comments are visible to Requester (owner), IT Staff, and Administrator. Internal Notes are visible ONLY to IT Staff and Administrator. |
| **BR-05** | A Requester may indicate that a problem "appears resolved", but cannot directly set the Ticket status to `RESOLVED` or `CLOSED`. |
| **BR-06** | Passwords must be hashed using a strong hashing algorithm (e.g. bcrypt/argon2) with minimum length of 8 characters. Passwords must never be stored as plaintext. |
| **BR-07** | Ticket ownership can only be assigned to an active IT Staff (`STAFF`) or Administrator (`ADMIN`) user. |
| **BR-08** | Requested Priority is set by the Requester at creation and is immutable. IT Priority initially equals Requested Priority and can subsequently be modified only by IT Staff or Admin. |
| **BR-09** | Permitted Ticket Statuses are: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`. |
| **BR-10** | Permitted Status Transitions: <br>- `NEW` → `OPEN`, `IN_PROGRESS`, `CANCELLED`<br>- `OPEN` / `IN_PROGRESS` → `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`<br>- `WAITING_FOR_REQUESTER` → `IN_PROGRESS`, `RESOLVED`, `CANCELLED`<br>- `RESOLVED` → `CLOSED`, `REOPENED`<br>- `CLOSED` → `REOPENED`<br>- `REOPENED` → `IN_PROGRESS`, `RESOLVED`, `CANCELLED`<br>- `CANCELLED` → (Terminal state). |
| **BR-11** | Public Comments and Internal Notes are append-only. Editing and deleting entries are forbidden. |
| **BR-12** | Comment/Note content must be non-empty string between 1 and 2000 characters after trimming whitespace. |
| **BR-13** | Administrators can manage user accounts but cannot perform IT Staff ticket operations unless explicit IT Staff permissions apply. |
| **BR-14** | Email addresses must be unique across all user accounts (case-insensitive). |
| **BR-15** | An Administrator cannot deactivate their own active account (`id === loggedInUserId`). |
| **BR-16** | The system must prevent deactivating or removing the last active Administrator account. |
| **BR-17** | User deletion is strictly forbidden; account disablement must use deactivation (`isActive = false`). |

---

## 6. Authorization Matrix (Role × Endpoint Permissions)

| Endpoint Path | Requester | IT Staff | Administrator |
|---|---|---|---|
| `POST /api/auth/login` | Public | Public | Public |
| `POST /api/auth/logout` | Authenticated | Authenticated | Authenticated |
| `GET /api/auth/me` | Authenticated | Authenticated | Authenticated |
| `POST /api/auth/change-password` | Authenticated | Authenticated | Authenticated |
| `GET /api/tickets` | 200 (Owned Only) | 200 (Owned Only) | 200 (Owned Only) |
| `POST /api/tickets` | 201 (Self Owner) | 201 (Self Owner) | 201 (Self Owner) |
| `GET /api/tickets/:id` | 200 (Owned Only, 404 else) | 200 (All) | 200 (All) |
| `POST /api/tickets/:id/attachments` | 201 (Owned Only) | 201 (All) | 201 (All) |
| `GET /api/attachments/:id/download` | 200 (Owned Only) | 200 (All) | 200 (All) |
| `POST /api/attachments/:id/remove` | 200 (Owned Only) | 200 (All) | 200 (All) |
| `GET /api/staff/tickets` | **403 Forbidden** | 200 OK | 200 OK |
| `GET /api/staff/tickets/:id` | **403 Forbidden** | 200 OK | 200 OK |
| `PATCH /api/staff/tickets/:id/claim` | **403 Forbidden** | 200 OK | 200 OK |
| `PATCH /api/staff/tickets/:id/assign` | **403 Forbidden** | 200 OK | 200 OK |
| `PATCH /api/staff/tickets/:id/priority` | **403 Forbidden** | 200 OK | 200 OK |
| `PATCH /api/staff/tickets/:id/status` | **403 Forbidden** | 200 OK | 200 OK |
| `GET /api/tickets/:id/comments` | 200 (Owned Only) | 200 OK | 200 OK |
| `POST /api/tickets/:id/comments` | 201 (Owned Only) | 201 OK | 201 OK |
| `GET /api/tickets/:id/notes` | **403 Forbidden** | 200 OK | 200 OK |
| `POST /api/tickets/:id/notes` | **403 Forbidden** | 201 OK | 201 OK |
| `GET /api/admin/users` | **403 Forbidden** | **403 Forbidden** | 200 OK |
| `POST /api/admin/users` | **403 Forbidden** | **403 Forbidden** | 201 OK |
| `PATCH /api/admin/users/:id` | **403 Forbidden** | **403 Forbidden** | 200 OK |
| `POST /api/admin/users/:id/reset-password` | **403 Forbidden** | **403 Forbidden** | 200 OK |

---

## 7. Acceptance Criteria (AC-01 .. AC-20)

- **AC-01**: Given an active user with valid credentials, when logging in, the backend returns authenticated session data and user role context.
- **AC-02**: Given a user with `mustChangePassword = true`, when login succeeds, normal application routes remain inaccessible until a new valid password is saved.
- **AC-03**: Given an inactive user (`isActive = false`), when trying to log in, authentication is rejected with a safe error message without leaking sensitive account metadata.
- **AC-04**: Given an authenticated Requester, when performing ticket operations, ownership is strictly derived from the session token, ignoring any client-supplied `requesterId`.
- **AC-05**: Given an IT Staff user, when searching/filtering the IT Queue, matching tickets are returned with correct pagination metadata.
- **AC-06**: Given an IT Staff user, when assigning or claiming a ticket, the `ownerId` updates in database and reflects on the UI.
- **AC-07**: Given an IT Staff user, when updating IT Priority or Ticket Status, valid transitions succeed while invalid transitions return a 400 Validation Error.
- **AC-08**: Given a Requester user, when attempting to access `/api/tickets/:id/notes` (Internal Notes), the server returns 403 Forbidden without exposing note content.
- **AC-09**: Given an Administrator user, when creating a user with an existing email address, the request is rejected with 409 Conflict.
- **AC-10**: Given an Administrator user, when attempting to deactivate their own account or the last active Administrator, the server rejects the request with a 400 Error.
- **AC-11**: Given a Requester user, when attempting to access `/api/staff/*` (Staff Queue & operations), the server returns 403 Forbidden.
- **AC-12**: Given an IT Staff user, when attempting to access `/api/admin/*` (User Management), the server returns 403 Forbidden.
- **AC-13**: Given an unauthenticated user, when requesting any protected endpoint without a valid Bearer token, the server returns 401 Unauthorized.
- **AC-14**: Given a Requester user, when accessing another Requester's ticket or attachment, the server returns 404 Not Found without leaking existence.
- **AC-15**: Given a Requester user, when posting a Public Comment on their owned ticket, the comment is recorded and visible to all roles.
- **AC-16**: Given an IT Staff or Admin user, when posting a private Internal Note, the note is saved and visible ONLY to Staff and Admin.
- **AC-17**: Given an Admin user, when searching users by name or email or filtering by role, matching accounts are returned.
- **AC-18**: Given an Admin user, when resetting an initial password for a user, `mustChangePassword` is set to `true` for that account.
- **AC-19**: Given a Requester user, when clicking "Problem Appears Resolved", a public resolution comment is posted without directly setting status to Resolved/Closed.
- **AC-20**: Given a logged-out user, when using a previously invalidated session, requests return 401 Unauthorized.

---

## 8. Definition of Done (DoD)

- [x] All 6 specification documents in `docs/lab-03/` created and accurate.
- [x] Prisma schema migrated and seeded with active/inactive Requester, IT Staff, and Admin accounts.
- [x] Authentication & authorization middleware enforced on all server routes.
- [x] Development Requester selector completely removed from client.
- [x] Requester Ticket creation, listing, detail, attachments, public comments, and "Problem Appears Resolved" working.
- [x] Shared IT Staff Queue with search, filters, sorting, and pagination implemented with Zen Green styling.
- [x] IT Staff Ticket Detail with claim/reassign, IT Priority, permitted status workflow, public comments, and distinct internal notes working.
- [x] Administrator User Management screen implemented with full search, role filter, create user, edit account, reset password, and safety rules.
- [x] Screenshots captured and stored in `artifacts/lab-03/screenshots/` (Desktop & responsive mobile).
- [ ] GitHub Issues, PR description `Closes #X`, reviewer comments & approval, and reviewer merge executed on GitHub.

---

## 9. Assumptions and Implementation Decisions

1. **Authentication Token Mechanism**: Session authentication uses JWT passed in HTTP `Authorization: Bearer <token>` header or `X-Auth-Token` for maximum flexibility in API tests and web UI.
2. **Password Hashing**: Passwords are hashed using `bcryptjs` with salt rounds = 10.
3. **Problem Appears Resolved**: Clicking "Problem Appears Resolved" as a Requester appends a structured Public Comment (`"[SYSTEM]: Requester indicated that the problem appears resolved."`) to inform IT Staff without violating BR-05.
