# Lab 3 Fix Report — `fix/lab3-review-fixes`

> Branch: `fix/lab3-review-fixes` (from `lab3-staging`)  
> Author: pimchayasupr-hash  
> Date: 2026-10-01

---

## Summary

This branch fixes all defects identified during post-submission review of Lab 3 (TokTickIT, CPE 334). No Git history was rewritten; no Lab 2 endpoints were broken.

---

## Defects Fixed

### 1. Responsive Horizontal Overflow (Critical — Handout §10, AC-19)

**Problem:** Pages overflowed horizontally on mobile viewports (375px, 390px) on: IT Staff Queue, Ticket Detail, and Admin User Management.

**Root Cause:** `html, body` had `overflow-x: auto`; `.tkt-table-container` lacked `max-width: 100%`.

**Fix:** `client/src/index.css`:
- `html, body { overflow-x: hidden; }`
- `.tkt-table-container { overflow-x: auto; max-width: 100%; }`

**Verification:** `e2e/lab-03/responsive-overflow.spec.ts` — 27/27 passing in Chromium.

---

### 2. Missing Mobile Card Layout (High — AC-19)

**Problem:** Staff Queue and Admin User Management showed a raw table at 375px.

**Fix:** Added `data-testid="mobile-ticket-cards"` and `data-testid="mobile-user-cards"` stacked card layouts using Bootstrap `d-md-none` / `d-none d-md-block` toggles.

---

### 3. Role-Based Navigation (High — AC-04, AC-05, AC-08)

**Problem:** Navbar did not filter links by role.

**Fix:** `client/src/components/layout/Navbar.tsx` conditionally renders links per role: REQUESTER sees "My IT Support Tickets"; STAFF/ADMIN see "IT Staff Ticket Queue"; ADMIN sees "User Management".

---

### 4. Enum Status Labels (Medium — FR-13)

**Problem:** Raw enum values (`NEW`, `IN_PROGRESS`) shown in UI.

**Fix:** `statusLabel()` helper maps enums to human-readable strings across Staff Queue and Ticket Detail components.

---

### 5. Inactive Account Login Bypass (Critical — AC-03, BR-01)

**Problem:** Inactive account check returned 401 before password verification, leaking account existence.

**Fix:** `server/src/routes/auth.ts` — verifies password first, then checks `isActive`, returning identical 401 error in both cases.

---

### 6. Seed Idempotency (Medium — BR-05)

**Problem:** Re-running `prisma db seed` threw unique constraint violations.

**Fix:** `server/prisma/seed.ts` uses `upsert` patterns for all entities.

---

### 7. Test Suite Gaps (Medium — Part C)

New tests added:

| Layer | Before | After | Delta |
|-------|--------|-------|-------|
| Server (Vitest) | 56 / 18 files | 90 / 21 files | +34 tests |
| Client (Vitest) | 13 / 11 files | 28 / 11 files | +15 tests |
| E2E Chromium (Playwright) | 9 tests | 27 tests | +18 tests |
| **Grand Total** | **78** | **145** | **+67** |

New files: `unit.test.ts`, `migration-regression.test.ts`, `seed-idempotency.test.ts`, `responsive-overflow.spec.ts`

---

### 8. Documentation Updates

| File | Change |
|------|--------|
| `docs/lab-03/tests.md` | Updated traceability matrix (UT, MT, E2E-04..E2E-13); updated execution logs |
| `docs/lab-03/specification.md` | Completed 11 sections |
| `docs/lab-03/ui-spec.md` | Updated responsive breakpoints and mobile card descriptions |
| `docs/lab-03/api-spec.md` | Added `/api/staff/tickets/assignees` documentation |

---

## Final Test Evidence

```
npm --prefix server test  →  Test Files 21 passed | Tests 90 passed
npm --prefix client test  →  Test Files 11 passed | Tests 28 passed
npx playwright test --project=chromium  →  27 passed (24.8s)
```

**Grand Total: 145 / 145 PASS (100% Green)**

---

## NEEDS HUMAN

None — all items verified programmatically.
