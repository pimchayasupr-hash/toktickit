# Lab 4 Baseline Test Execution Report (`baseline.md`)

**Date**: 2026-10-30 19:47:30 (GMT+7)  
**Branch**: `feature/lab4-hardening`  
**Database**: PostgreSQL Local (`localhost:5432/toktickit`)  
**Safety Backup Tag**: `pre-lab4-backup`  
**Database Backup**: `artifacts/lab-04/backups/local_toktickit_backup.sql`  

---

## 1. Executive Summary

A comprehensive baseline test audit was performed across all test layers prior to staging consolidation. All test suites—including requirements traceability, backend API and unit tests, frontend component tests, and multi-browser Playwright end-to-end tests—passed with a **100% pass rate** and zero failures across all labs (Labs 1 through 4).

---

## 2. Test Execution Breakdown

### 2.1 Traceability Verification (`python3 scripts/check-traceability.py`)
- **Defined Acceptance Criteria**: 23 (AC-01 through AC-23)
- **Defined Functional Requirements**: 21 (FR-01 through FR-21)
- **Defined Business Rules**: 18 (BR-01 through BR-18)
- **Coverage**: 100% referenced without any orphan identifiers.
- **Status**: ✅ PASS

### 2.2 Server Unit & API Test Suite (`npm run test:server`)
- **Framework**: Vitest v4.1.10 + Supertest v7.2.2
- **Test Files**: 29 passed (29 total)
- **Tests**: 144 passed (144 total)
- **Duration**: 25.28s
- **Coverage**:
  - Lab 1 Health & Category APIs: 2 tests passed
  - Lab 2 Requester Ticket Flow & Attachments: 20 tests passed
  - Lab 3 Authentication, RBAC, Shared Queue, Notes & Admin Users: 78 tests passed
  - Lab 4 Actions Taken, Resolution Gate, Concurrency & Dashboards: 44 tests passed (including 8 new regression tests `TEST-ACT-18` to `TEST-ACT-22` and `TEST-WFK-06` to `TEST-WFK-08`)
- **Status**: ✅ PASS

### 2.3 Client Component & UI Test Suite (`npm run test:client`)
- **Framework**: Vitest v4.1.10 + React Testing Library v16.3.2 + jsdom
- **Test Files**: 17 passed (17 total)
- **Tests**: 40 passed (40 total)
- **Duration**: 8.27s
- **Coverage**:
  - Lab 2 CreateTicket, MyTickets, AttachmentSection, RequesterTicketDetail: 6 tests passed
  - Lab 3 Login, ChangePasswordModal, StaffTicketQueue, StaffTicketDetail, UserManagement: 26 tests passed
  - Lab 4 ActionsTakenSection, StaffDashboard, RequesterDashboard, TicketWorkflow: 8 tests passed (including `TEST-UI-ACT-04` and `TEST-UI-ACT-05`)
- **Status**: ✅ PASS

### 2.4 Playwright End-to-End Suite (`npx playwright test e2e/lab-04/`)
- **Framework**: Playwright v1.62.0 (Chromium) + Axe-core v4.13.0
- **Test Files**: 3 passed (3 total)
- **Tests**: 11 passed (11 total)
- **Duration**: 14.8s
- **Coverage**:
  - `actions-taken-flow.spec.ts`: 2 passed (CRUD, requester read-only mode, lifecycle transitions, operational assignee, and terminal immutability)
  - `dashboards.spec.ts`: 7 passed (Responsive zero overflow at 360px, 768px, 1280px + Axe-core zero WCAG AA accessibility violations)
  - `ticket-resolution.spec.ts`: 2 passed (Deterministic rejection on `TKT-2026-001233` + deterministic success with history entry on `TKT-2026-001234`)
- **Status**: ✅ PASS

---

## 3. Earlier Labs Regression Status

No failures from earlier labs (Labs 1–3) were detected. Backward compatibility across authentication, password complexity rules, file attachments, soft removals, public comments, internal notes, and administrative safety guards is verified 100% intact.
