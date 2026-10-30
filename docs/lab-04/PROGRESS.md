# Lab 4 Autonomous Execution Progress Tracker

**Start Time**: 2026-10-30 19:46:00 (GMT+7)  
**Last Updated**: 2026-10-30 19:46:00 (GMT+7)  
**Status**: 🔄 IN PROGRESS  
**Last Command**: `mkdir -p artifacts/lab-04/backups && /Applications/Postgres.app/Contents/Versions/18/bin/pg_dump ...`

---

## Phase Checklist

- [x] **Safety Guardrails & Prerequisites**
  - [x] Check DATABASE_URL points to localhost
  - [x] Create safety git tag `pre-lab4-backup`
  - [x] Create `pg_dump` backup in `artifacts/lab-04/backups/local_toktickit_backup.sql`
  - [x] Update `.gitignore` for backups and raw test outputs

- [x] **PHASE 0: Baseline Verification**
  - [x] Run full baseline test suite (Server, Client, E2E, Traceability)
  - [x] Record baseline execution in `docs/lab-04/baseline.md`

- [x] **PHASE 1: Specification Engineering (Spec DD)**
  - [x] Verify/refine `docs/lab-04/specification.md` (FR-01..21, BR-01..26, AC-01..28, §11 Decisions)
  - [x] Verify/refine `docs/lab-04/ui-spec.md` (Screens, Viewports, Zen Green tokens, Accessibility)
  - [x] Verify/refine `docs/lab-04/api-spec.md` (Endpoints, Status Codes, Concurrency, Payloads)

- [x] **PHASE 2: Test Engineering & Red Phase (Test DD)**
  - [x] Verify/refine `docs/lab-04/tests.md` (Traceability matrix, planned tests)
  - [x] Save Red phase initial failing outputs to `artifacts/lab-04/test-output/red-*.txt`

- [🔄] **PHASE 3: GitHub Issues, Workflow & Staging Flow**
  - [ ] Maintain `docs/lab-04/github-issues.md` & `created-issues.json`
  - [ ] Verify `docs/lab-04/reviewer.md` template
  - [ ] Create/manage Git branch flow (`lab4-staging`, feature branches)

- [ ] **PHASE 4: Database Model, Migration & Idempotent Seed**
  - [ ] Prisma schema with `ActionTaken`, `Ticket.version`, `ActionStatus`, `TicketStatusHistory`
  - [ ] Non-destructive migration on real database
  - [ ] Idempotent seed test (run twice, zero duplicates/errors)

- [ ] **PHASE 5: Backend REST APIs & Workflow Enforcement (TDD Green)**
  - [ ] Actions Taken CRUD, session performer binding, active assignee, terminal immutability
  - [ ] Atomic optimistic concurrency with database predicates (409 Conflict)
  - [ ] Resolution Gate enforcement (Owner, Completed Action, Result, Follow-ups)
  - [ ] Append-only TicketStatusHistory within transaction
  - [ ] Role dashboards APIs (`GET /api/dashboard/requester`, `GET /api/dashboard/staff`)

- [ ] **PHASE 6: Frontend Zen Green UI & Component Engineering**
  - [ ] Staff Dashboard with metric cards & drill-downs
  - [ ] Requester Dashboard with status cards & attention banner
  - [ ] Actions Taken section with status badges, assignee selector, terminal lock
  - [ ] Ticket Status dropdown with permitted transition validation
  - [ ] Append-only Ticket Status History timeline display

- [ ] **PHASE 7: E2E, Full Regression, Hardening & Evidence Capture**
  - [ ] Playwright E2E suites passing 100%
  - [ ] Labs 1–3 full regression passing 100%
  - [ ] Zero horizontal overflow across 360px, 768px, 1280px viewports
  - [ ] Axe-core accessibility audit (0 WCAG AA violations)
  - [ ] Real screenshots captured in `artifacts/lab-04/screenshots/`
  - [ ] Metrics vs DB verification in `artifacts/lab-04/metrics-vs-db.txt`
  - [ ] Save full test logs from main to `artifacts/lab-04/test-output/final-*.txt`

- [ ] **PHASE 8: README & Documentation Alignment**
  - [ ] Update root `README.md` with Lab 4 setup, migrate, seed, test, and demo scripts

- [ ] **PHASE 9: Final Deliverable — Single Submission PDF**
  - [ ] Build `artifacts/lab-04/submission/Lab4_Submission.md` (Answer Part 1..Part 9)
  - [ ] Render to `artifacts/lab-04/submission/Lab4_Submission.pdf` and verify visual layout

- [ ] **PHASE 10: Morning Report**
  - [ ] Generate comprehensive `docs/lab-04/OVERNIGHT-REPORT.md` with all 7 required sections
  - [ ] Print final summary
