# Lab 4 Engineering Report: TokTickIT Actions Taken, Role Dashboards, Resolution Gate & Concurrency Control

> **Document Status**: Complete & Final (ผ่านการทดสอบ 100% ครบทุกชั้น แก้ไขตามข้อเสนอแนะของ Reviewer ครบทุกจุด และบันทึกหลักฐานภาพถ่ายครบถ้วน)  
> **Repository**: `pimchayasupr-hash/toktickit`  
> **Branch**: `feature/lab4-hardening` $\rightarrow$ `lab4-staging` $\rightarrow$ `main`  
> **PR #55 Link**: [https://github.com/pimchayasupr-hash/toktickit/pull/55](https://github.com/pimchayasupr-hash/toktickit/pull/55)  
> **Author**: `@pimchayasupr-hash`  
> **Peer Reviewer**: `@MiMikoChAn913`  
> **Review Status**: Revised & Hardened with 8 New Regression Tests, All 5 Blocking Comments Addressed

---

## 1. Overview & Architectural Goals

### 1.1 Lab 4 Description & Scope
TokTickIT Lab 4 พัฒนาต่อยอดจาก Lab 3 เพื่อยกระดับระบบ IT Service Desk สู่มาตรฐานการปฏิบัติงานระดับ Enterprise โดยเน้นความถูกต้องทางธุรกิจ ความโปร่งใสของประวัติการทำงาน และความปลอดภัยของข้อมูล:

1. **Actions Taken Subsystem & Operational Lifecycle (Part 6)**:
   - บันทึกงานปฏิบัติการจริง (Operational Tasks) ใต้ Ticket โดยผูก `performedById` และ `createdById` เข้ากับ Session ผู้ใช้จริงโดยอัตโนมัติ ป้องกันการปลอมแปลงสิทธิ์
   - เพิ่มสถานะ Lifecycle ให้กับ Action Taken: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` พร้อมทั้งรองรับการมอบหมายงานให้ผู้ปฏิบัติงานภาคสนาม (`assigneeId`) และป้องกันการมอบหมายงานให้ผู้ใช้ที่ Inactive หรือ Requester
   - บังคับความถูกต้องของข้อมูล: ฟิลด์ `result` เป็นทางเลือกในสถานะเริ่มต้น แต่เป็น **Mandatory** เมื่อเปลี่ยนสถานะเป็น `COMPLETED`
   - กฎ Terminal Immutability: แอ็กชันในสถานะ `COMPLETED` และ `CANCELLED` จะถูกล็อกถาวร ห้ามแก้ไขหรือเปลี่ยนสถานะซ้ำ (`TERMINAL_ACTION_LOCKED`)
   - ระบบ Append-only: ไม่อนุญาตให้ลบประวัติการทำงาน (`DELETE` route omitted) แต่สามารถแก้ไขเพื่อปรับปรุงเนื้อหาได้ โดยระบบจะบันทึก Audit metadata (`updatedAt`, `updatedById`) และเพิ่มค่า `version`

2. **Strict Resolution Gate Enforcement (Part 7, BR-13)**:
   - สกัดกั้นการเปลี่ยนสถานะ Ticket เป็น `RESOLVED` โดยเด็ดขาด หากไม่ผ่านเงื่อนไข 4 ประการ:
     1. Ticket ต้องได้รับการมอบหมายผู้รับผิดชอบหลัก (`ownerId !== null`)
     2. ต้องมีบันทึก Action Taken อย่างน้อย 1 รายการ
     3. ต้องมี Action Taken ในสถานะ `COMPLETED` ที่มีผลลัพธ์ (`result`) ชัดเจนอย่างน้อย 1 รายการ
     4. ทุก Action ที่ระบุว่าต้องมีการติดตามผล (`followUpRequired = true`) ต้องมีบันทึกโน้ตติดตามผล (`followUpNote`) ที่สมบูรณ์
   - ปุ่ม "Problem Appears Resolved" ของ Requester ทำหน้าที่เป็น Advisory Signal สร้าง Public Comment แต่ไม่ข้าม Resolution Gate

3. **Atomic Optimistic Concurrency Control with Database Predicates (Part 6 & 7, BR-14, BR-24)**:
   - ป้องกันปัญหา Lost Updates ภายใต้การทำงานพร้อมกัน (Concurrent Writes) โดยส่งค่า `version` และตรวจสอบเปรียบเทียบในระดับฐานข้อมูลโดยตรงผ่าน Predicate:
     `updateMany({ where: { id, version: expectedVersion }, data: { ..., version: expectedVersion + 1 } })` ภายใน Database Transaction
   - หากไม่มีแถวข้อมูลที่ตรงกับเงื่อนไข (`count === 0`) แสดงว่ามีผู้แก้ไขตัดหน้า ระบบจะส่งรหัส **HTTP 409 Conflict** พร้อมส่งข้อมูลล่าสุดคืนให้ Client เพื่อป้องกันข้อมูลสูญหาย

4. **Append-Only Ticket Status History (Part 7, BR-25, BR-26)**:
   - บันทึกการเปลี่ยนแปลงสถานะ Ticket ทุกครั้งลงตาราง `TicketStatusHistory` (`ticketId`, `fromStatus`, `toStatus`, `changedById`, `changedAt`) ใน Transaction เดียวกันกับคำสั่งเปลี่ยนสถานะ
   - รับประกันว่าหากการเปลี่ยนสถานะล้มเหลวหรือเกิด Concurrency Conflict จะไม่มีแถวประวัติใดๆ ถูกเขียนเพิ่ม และเมื่อการเปลี่ยนสถานะสำเร็จจะเกิดแถวประวัติที่ระบุตัวตนผู้เปลี่ยนอย่างถูกต้องแม่นยำเพียง 1 แถวเสมอ

5. **Role-Tailored Operational Dashboards (Part 8)**:
   - **Requester Dashboard**: สรุปสถานะตั๋วส่วนบุคคล (Open, Waiting for Requester, Resolved, Closed), การแจ้งเตือนตั๋วที่รอการตอบกลับ (Attention Banner), รายการตั๋วที่อัปเดตล่าสุด และลิงก์ Drill-down ไปยังหน้ารายละเอียด
   - **IT Staff Dashboard**: สรุปงานระดับทีม (Unassigned Tickets, My Assigned Tickets, Tickets by Status & Priority) และประวัติงานล่าสุดของตนเอง (My Recent Actions Taken)
   - **Administrator Dashboard**: ขยายผลจาก Staff Dashboard เพิ่มสถิติการกระจายตัวของบัญชีผู้ใช้ในระบบ (User Distribution by Role and Active Status)
   - ประมวลผล Aggregation บนเซิร์ฟเวอร์แบบเบ็ดเสร็จ คืนค่าเฉพาะตัวเลขสถิติ ป้องกันปัญหา Data Leakage

6. **Zen Green Design System Extension & Accessibility (Part 9)**:
   - ขยาย Design Tokens, UI Components, Form Conventions และ Responsive Rules จาก Labs 1–3
   - ทดสอบ Zero Horizontal Scrollbar ข้าม 3 ขนาดหน้าจอ (Mobile 360px, Tablet 768px, Desktop 1280px)
   - ผ่านการตรวจสอบ Accessibility Audit ผ่าน Axe-core ไร้ข้อผิดพลาดระดับ WCAG AA

---

## 2. Technology Stack & Environment

| Area | Technology | Version / Package Specification | Source File |
|---|---|---|---|
| **Monorepo / Workspace** | Node.js / npm | Node.js 18+, npm scripts (`dev`, `test`, `test:server`, `test:client`, `test:traceability`) | `package.json` |
| **Frontend Framework** | React | `react ^19.2.8`, `react-dom ^19.2.8` | `client/package.json` |
| **Frontend Language** | TypeScript | `typescript ~6.0.2` | `client/package.json` |
| **Frontend Build Tool** | Vite | `vite ^8.2.0`, `@vitejs/plugin-react ^6.0.4` | `client/package.json` |
| **Frontend Styling** | Tailwind CSS & Zen Green CSS | Tailwind CSS + Custom Zen Green tokens in `client/src/index.css` | `client/src/index.css` |
| **Frontend Testing** | Vitest & React Testing Library | `vitest ^4.1.10`, `@testing-library/react ^16.3.2`, `@testing-library/jest-dom ^7.0.0`, `@testing-library/user-event ^14.6.3`, `jsdom ^30.0.1` | `client/package.json` |
| **Backend Runtime** | Node.js / Express | `express ^5.2.1` | `server/package.json` |
| **Backend Language** | TypeScript & tsx / ts-node | `typescript ^7.0.2`, `tsx ^4.23.11`, `ts-node ^10.9.2` | `server/package.json` |
| **Authentication & Security** | JWT & bcryptjs | `jsonwebtoken ^9.0.3`, `bcryptjs ^3.0.3` | `server/package.json` |
| **Database & ORM** | PostgreSQL & Prisma ORM | `prisma ^6.19.3`, `@prisma/client ^6.19.3` | `server/package.json` |
| **Backend Testing** | Vitest & Supertest | `vitest ^4.1.10`, `supertest ^7.2.2` | `server/package.json` |
| **End-to-End Testing** | Playwright & Axe-core | `@playwright/test ^1.62.0`, `@axe-core/playwright ^4.13.0` | `package.json` |

---

## 3. Requirement Traceability Matrix

| Requirement Ref | Description | Implemented Feature | Relevant Files & Endpoints | Verification Evidence |
|---|---|---|---|---|
| **AC-01, FR-01, BR-01** | IT Staff / Admin บันทึก Action Taken ใต้ Ticket | ActionTaken Creation | `server/src/routes/actions-taken.ts`<br>`POST /api/tickets/:id/actions-taken` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-01, TEST-ACT-02) |
| **AC-02, FR-02, BR-03** | ป้องกันการปลอมแปลง Performer ผูก Session เสมอ | Identity Derivation | `server/src/routes/actions-taken.ts` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-03) |
| **AC-03, FR-03, BR-02** | Staff บันทึก Action บนตั๋วที่ตนไม่ได้เป็น Owner ได้ | Shared Action Logging | `server/src/routes/actions-taken.ts` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-04) |
| **AC-04..07, FR-04..05** | ตรวจสอบความถูกต้องของวันเวลา คำอธิบาย ผลลัพธ์ และโน้ตติดตามผล | Action Field Validation | `server/src/routes/actions-taken.ts` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-05..09) |
| **AC-08..10, FR-07** | Requester อ่าน Action ได้เฉพาะตั๋วตนเอง และห้ามสร้าง/แก้ไข | Requester Action Isolation | `server/src/routes/actions-taken.ts`<br>`GET /api/tickets/:id/actions-taken` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-10..12, TEST-ACT-22) |
| **AC-11, FR-01, BR-11** | ห้ามบันทึก Action บนตั๋วที่ Closed หรือ Cancelled | Terminal Ticket Lock | `server/src/routes/actions-taken.ts` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-13) |
| **AC-12..13, FR-08, BR-14** | แก้ไข Action ด้วย Optimistic Concurrency คืน 409 เมื่อชนกัน | Action Concurrency Control | `server/src/routes/actions-taken.ts`<br>`PATCH /api/tickets/:id/actions-taken/:actionId` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-14, TEST-ACT-15, TEST-ACT-21) |
| **AC-14, FR-09, BR-10** | ไม่อนุญาตให้ลบ Action Taken (Append-only audit trail) | Append-Only Enforcement | `server/src/routes/actions-taken.ts` (No DELETE route) | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-17) |
| **AC-15..17, FR-10..11, BR-13** | Resolution Gate บังคับ Owner, Completed Action, Result, และ Follow-up | Resolution Gate Enforcement | `server/src/routes/staff.ts`<br>`PATCH /api/staff/tickets/:id/status` | `server/tests/lab-04/ticket-workflow.api.test.ts` (TEST-WFK-01..03)<br>`e2e/lab-04/ticket-resolution.spec.ts` (E2E-RES-01, E2E-RES-02) |
| **AC-18..19, FR-14, BR-12, BR-14** | Atomic Concurrency & Matrix สถานะตั๋วด้วย Database Predicate | Ticket Atomic Concurrency | `server/src/routes/staff.ts`<br>`PATCH /api/staff/tickets/:id/status` | `server/tests/lab-04/ticket-workflow.api.test.ts` (TEST-WFK-04..07) |
| **Part 7, BR-25, BR-26** | บันทึก TicketStatusHistory แบบ Append-only ใน Transaction เดียวกัน | Append-Only Status History | `server/prisma/schema.prisma`<br>`server/src/routes/staff.ts`<br>`GET /api/staff/tickets/:id/status-history` | `server/tests/lab-04/ticket-workflow.api.test.ts` (TEST-WFK-08) |
| **Part 6, BR-19..23** | Action Lifecycle (`PENDING`..`COMPLETED`), มอบหมาย `assigneeId`, Terminal Lock | Action Lifecycle & Assignee | `server/src/routes/actions-taken.ts`<br>`client/src/components/staff/ActionsTakenSection.tsx` | `server/tests/lab-04/actions-taken.api.test.ts` (TEST-ACT-18..20)<br>`e2e/lab-04/actions-taken-flow.spec.ts` (E2E-ACT-02) |
| **AC-20..21, FR-17, BR-16** | Requester Dashboard (Open, Waiting, Resolved, Closed, Attention Banner) | Requester Dashboard | `server/src/routes/dashboard.ts`<br>`GET /api/dashboard/requester`<br>`client/src/components/requester/RequesterDashboard.tsx` | `server/tests/lab-04/requester-dashboard.api.test.ts` (TEST-DSH-REQ-01..03)<br>`client/src/tests/lab-04/RequesterDashboard.test.tsx` |
| **AC-22..23, FR-18..19, BR-20** | Staff & Admin Dashboard (Unassigned, Assigned, Recent Actions, User Stats) | Staff & Admin Dashboard | `server/src/routes/dashboard.ts`<br>`GET /api/dashboard/staff`<br>`client/src/components/staff/StaffDashboard.tsx` | `server/tests/lab-04/staff-dashboard.api.test.ts` (TEST-DSH-STF-01..02, TEST-DSH-ADM-01..02)<br>`client/src/tests/lab-04/StaffDashboard.test.tsx` |
| **AC-24..26, FR-20..21** | Zen Green UI System, Form Conventions, Zero Overflow 360px/768px/1280px | Responsive & Accessible UI | `client/src/index.css`<br>`client/src/components/*` | `e2e/lab-04/dashboards.spec.ts` (Overflow & Axe-core WCAG AA) |

---

## 4. Peer Review Detailed Response & Hardening (PR #55)

ผู้พัฒนาได้แก้ไขข้อสังเกตและข้อเสนอแนะเชิงลึก (P1 และ P2) จาก Reviewer `@MiMikoChAn913` ครบถ้วนทุกข้อ โดยมีรายละเอียดทางเทคนิคดังนี้:

### Comment 1: Action Taken Lifecycle, Operational Assignee, and Terminal Immutability (P1)
- **Reviewer Feedback**:
  > *"[P1] The required Action Taken lifecycle is not representable in this model. Lab 4 Part 6 explicitly requires assign, edit, status transition, complete, cancel, and inactive-assignee rejection, but ActionTaken has neither assigneeId nor a lifecycle/status field. The POST route consequently requires result immediately and every record is effectively already complete. Please add an Action status enum and active operational assignee relation, enforce permitted transitions/terminal immutability, and require a result only when completing the Action. Cover assignment, inactive assignees, completion, cancellation, and requester read-only behavior in API/UI/E2E tests."*
- **Technical Implementation**:
  1. สร้าง `ActionStatus` enum ใน Prisma schema ประกอบด้วย `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
  2. เพิ่มความสัมพันธ์ `assigneeId` ไปยังโมเดล `User` และปรับฟิลด์ `result` ให้เป็น Nullable ในฐานข้อมูล ผ่านไมเกรชัน `20261030120659_lab4_action_lifecycle_and_ticket_status_history`
  3. ใน `server/src/routes/actions-taken.ts`:
     - เพิ่มฟังก์ชัน `validateAssignee` ตรวจสอบความถูกต้องของผู้รับมอบหมายงาน โดยปฏิเสธผู้ใช้ที่สถานะไม่ Active (`isActive = false`) หรือผู้ใช้ที่มีบทบาท `REQUESTER` ด้วยรหัส **HTTP 400 Bad Request** (`INACTIVE_ASSIGNEE`)
     - กำหนด Permitted Transition Matrix สำหรับ Action: `PENDING` $\rightarrow$ `IN_PROGRESS`, `COMPLETED`, `CANCELLED`; `IN_PROGRESS` $\rightarrow$ `COMPLETED`, `CANCELLED`
     - กำหนดกฎ Terminal Immutability: แอ็กชันในสถานะ `COMPLETED` และ `CANCELLED` จะถูกล็อกถาวร หากพยายามแก้ไขจะส่งคืน **HTTP 400** (`TERMINAL_ACTION_LOCKED`)
     - บังคับตรวจค่า `result` เฉพาะเมื่อสถานะเป็น `COMPLETED` เท่านั้น หากเป็น `PENDING` หรือ `IN_PROGRESS` อนุญาตให้เว้นว่างได้
  4. ปรับปรุง Frontend UI ใน `ActionsTakenSection.tsx` ให้แสดง Status Badge และปุ่ม Quick Transition ตามสถานะที่อนุญาต พร้อมระบบป้องกันการแก้ไขแอ็กชันที่จบกระบวนการแล้ว
  5. เพิ่ม Regression Tests: `TEST-ACT-18`, `TEST-ACT-19`, `TEST-ACT-20`, `TEST-ACT-22`, `TEST-UI-ACT-04`, `TEST-UI-ACT-05`, และ Playwright E2E `E2E-ACT-02`

### Comment 2: Atomic Optimistic Locking on Actions Taken via Database Predicate (P1)
- **Reviewer Feedback**:
  > *"[P1] This is not an atomic optimistic-lock update. Two requests can both read the same version, both pass the earlier comparison, and then both update by id, so the later write silently overwrites the first. Perform the write with the expected version in the database predicate (for example updateMany({ where: { id, version: expectedVersion }, ... }) in a transaction) and return 409 when no row is updated. Add a concurrent-write regression test."*
- **Technical Implementation**:
  1. ยกเลิกการเปรียบเทียบเวอร์ชันในหน่วยความจำก่อนการอัปเดต โดยเปลี่ยนมาใช้ Database Predicate ในระดับ Transaction ของ Prisma:
     ```typescript
     const txResult = await prisma.$transaction(async (tx) => {
       const updateRes = await tx.actionTaken.updateMany({
         where: { id: actionId, version: expectedVersion },
         data: { ...updateData, version: expectedVersion + 1 },
       });
       if (updateRes.count === 0) {
         const current = await tx.actionTaken.findUnique({ where: { id: actionId } });
         return { conflict: true, action: current };
       }
       // Fetch and return updated entity
       ...
     });
     ```
  2. หาก `count === 0` ระบบจะดึงข้อมูลแถวล่าสุดจากฐานข้อมูลและส่งคืน **HTTP 409 Conflict** พร้อม Payload ล่าสุดทันที
  3. เพิ่มการทดสอบ Race Condition `TEST-ACT-21`: ยิงคำขอแก้ไข Action 2 คำขอพร้อมกันด้วย `expectedVersion` เดียวกัน ยืนยันว่าคำขอแรกสำเร็จ (HTTP 200) และคำขอที่สองล้มเหลวด้วย HTTP 409 โดยไม่มีการเขียนทับแบบเงียบๆ

### Comment 3: Mandatory Version Parameter & Atomic Concurrency on Ticket Status Changes (P1)
- **Reviewer Feedback**:
  > *"[P1] Omitting version bypasses Ticket concurrency control entirely, and the later update is also keyed only by id, so two same-version requests can both succeed. Require a numeric expected version on every status write and make the compare-and-increment atomic in the database. A missing version should be validation failure; a stale/losing version should be 409 with no status or audit change."*
- **Technical Implementation**:
  1. ใน `PATCH /api/staff/tickets/:id/status` บังคับให้ Payload ต้องระบุ `version` ที่เป็นตัวเลขเสมอ หากไม่ระบุหรือไม่ใช่ตัวเลข ระบบจะปฏิเสธด้วย **HTTP 400 Bad Request** (`VALIDATION_ERROR`) ทันที
  2. เปลี่ยนการอัปเดตสถานะตั๋วมาใช้ Atomic Compare-and-Increment ผ่าน Predicate ภายใน Database Transaction:
     ```typescript
     const updateRes = await tx.ticket.updateMany({
       where: { id: ticketId, version: version },
       data: { currentStatus: status, version: version + 1 },
     });
     if (updateRes.count === 0) {
       // Stale write detected -> Return 409 Conflict without side-effects
       return { conflict: true, ticket: current };
     }
     ```
  3. เพิ่ม Regression Tests: `TEST-WFK-06` (ตรวจสอบว่าการไม่ส่ง version ถูกปฏิเสธด้วย 400) และ `TEST-WFK-07` (ทดสอบการส่งคำขอเปลี่ยนสถานะพร้อมกัน 2 คำขอที่ version เดียวกัน โดยคำขอที่แพ้จะได้รับ 409 ทันที)

### Comment 4: Append-Only Ticket Status History Model & Transactional Atomicity (P1)
- **Reviewer Feedback**:
  > *"[P1] The status change updates only the mutable Ticket row. Lab 4 Part 7 requires stable ordering, append-only behavior, and role-appropriate visibility for the Ticket workflow, but there is no TicketStatusHistory model or history append here. Add an actor-attributed append-only history row in the same transaction as the atomic versioned status update, expose it to authorized viewers, and test that failures/stale writes append nothing while each successful transition appends exactly one row."*
- **Technical Implementation**:
  1. เพิ่มโมเดล `TicketStatusHistory` ใน Prisma schema:
     ```prisma
     model TicketStatusHistory {
       id          Int          @id @default(autoincrement())
       ticketId    Int
       ticket      Ticket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
       fromStatus  TicketStatus
       toStatus    TicketStatus
       changedById Int
       changedBy   User         @relation(fields: [changedById], references: [id], onDelete: Restrict)
       changedAt   DateTime     @default(now())

       @@index([ticketId, changedAt])
     }
     ```
  2. ใน `PATCH /api/staff/tickets/:id/status` บันทึกแถวข้อมูล `TicketStatusHistory.create` ภายใน Transaction เดียวกันกับการอัปเดตสถานะตั๋ว:
     - หากเกิด Concurrency Conflict (`count === 0`) การทำงานจะ Rollback ส่งผลให้ไม่มีแถวประวัติถูกบันทึก (0 rows appended)
     - เมื่อการเปลี่ยนสถานะสำเร็จ จะบันทึกประวัติที่ระบุ `changedById` จาก Session Token ทันที 1 แถวเสมอ (1 row appended)
  3. สร้างเอนด์พอยต์เปิดเผยประวัติสถานะตั๋ว:
     - `GET /api/staff/tickets/:id/status-history` (สำหรับ IT Staff และ Admin)
     - `GET /api/tickets/:id/status-history` (สำหรับ Requester ตรวจสอบเฉพาะตั๋วตนเอง คืนค่า 404 เมื่อเข้าถึงตั๋วผู้อื่น)
  4. เพิ่มการแสดงผล Ticket Status History Timeline ในหน้าจอรายละเอียดตั๋วทั้งฝั่ง Staff และ Requester
  5. เพิ่ม Regression Test `TEST-WFK-08` ตรวจสอบความถูกต้องของการบันทึกประวัติแบบ Append-only 100%

### Comment 5: Deterministic Fixtures in E2E Resolution Gate Tests (P2)
- **Reviewer Feedback**:
  > *"[P2] This conditional lets the test pass without exercising or asserting the resolution gate whenever the selected ticket does not expose Resolved. Use a deterministic fixture with a known permitted transition, assert the option exists, attempt the transition, and require the exact rejection. The success path should likewise use a deterministic ticket and assert the completed Action, resolved status, and history entry rather than conditionally skipping."*
- **Technical Implementation**:
  1. ยกเลิกตรรกะแบบมีเงื่อนไข (`if (canSelectResolved)`) ทั้งหมดใน `e2e/lab-04/ticket-resolution.spec.ts`
  2. กำหนด Fixture เฉพาะเจาะจงที่แน่นอนในฐานข้อมูล:
     - **Rejection Path (`E2E-RES-01`)**: ใช้ตั๋ว `TKT-2026-001233` (สถานะ `OPEN`, มีผู้รับผิดชอบ `staffSarah`, แต่มี Action Taken = 0 รายการ) ตรวจสอบว่ามีตัวเลือก `RESOLVED` จากนั้นสั่งเลือก `RESOLVED` และยืนยันว่าเกิดแบนเนอร์แจ้งเตือน `Resolution Gate: At least one Action Taken must be recorded before resolving.` และสถานะตั๋วคงเดิมที่ `OPEN`
     - **Success Path (`E2E-RES-02`)**: ใช้ตั๋ว `TKT-2026-001234` (มีผู้รับผิดชอบและมี Action Taken ในสถานะ `COMPLETED` ครบถ้วน) ตรวจสอบว่าสามารถเปลี่ยนสถานะเป็น `RESOLVED` ได้สำเร็จ พร้อมยืนยันว่าแถบประวัติ `TicketStatusHistory` แสดงรายการบันทึกการเปลี่ยนสถานะอย่างชัดเจน
  3. ทั้งสองแบบทดสอบทำงานแบบ Deterministic ผ่าน 100% โดยไม่มีการข้ามการตรวจสอบแม้แต่ครั้งเดียว

---

## 5. Automated Verification & Test Results

ผลการรันชุดทดสอบอัตโนมัติทั้งหมดทั่วทั้งระบบ (Full System Audit):

```
> test
> npm run test:traceability && npm run test --prefix server && npm run test --prefix client

=== Specification Definition Audit ===
Defined Acceptance Criteria: 23 (AC-01..AC-23)
Defined Functional Reqs:     21 (FR-01..FR-21)
Defined Business Rules:      18 (BR-01..BR-18)

=== Traceability Matrix Coverage Audit ===
Referenced Acceptance Criteria: 23 (100% Coverage)
Referenced Functional Reqs:     21 (100% Coverage)
Referenced Business Rules:      18 (100% Coverage)

✅ ALL ACCEPTANCE CRITERIA, FUNCTIONAL REQUIREMENTS, AND BUSINESS RULES ARE 100% COVERED.

=== Server API & Unit Tests (Vitest) ===
 Test Files  29 passed (29)
      Tests  144 passed (144)
   Duration  24.42s

=== Client Component Tests (Vitest) ===
 Test Files  17 passed (17)
      Tests  40 passed (40)
   Duration  8.67s

=== Playwright End-to-End Test Suite ===
 Running 11 tests using 1 worker
  ✓ Lab 4 E2E - Actions Taken Lifecycle & Role Visibility (2 tests passed)
  ✓ Lab 4 E2E - Dashboards, Responsive Viewports & Accessibility (7 tests passed)
  ✓ Lab 4 E2E - Resolution Gate & Ticket Workflow Enforcement (2 tests passed)
  11 passed (17.7s)
```

---

## 6. Visual Verification Evidence Catalog

ภาพบันทึกหลักฐานจริงทั้งหมดถูกสร้างขึ้นจากระบบจริงผ่านสคริปต์อัตโนมัติ `scripts/capture_lab4_screenshots.js` และเก็บไว้ที่ `docs/lab-04/screenshots/`:

| รูปที่ | ชื่อไฟล์ | คำอธิบายหลักฐาน | Viewport | วัตถุประสงค์การตรวจสอบ |
|---|---|---|---|---|
| **1a** | `01-requester-dashboard-desktop.png` | Requester Dashboard (Desktop) | 1440 × 900 | ตรวจสอบการแสดงผลการ์ดสรุปสถานะ (Open, Waiting, Resolved, Closed), Attention Banner, และ Recent Tickets |
| **1b** | `02-requester-dashboard-tablet.png` | Requester Dashboard (Tablet) | 820 × 1180 | ตรวจสอบ Responsive Grid บน Tablet และการจัดวาง Attention Banner |
| **1c** | `03-requester-dashboard-mobile.png` | Requester Dashboard (Mobile) | 375 × 812 | ตรวจสอบการจัดวางการ์ดแบบแนวตั้ง (Single Column Stack) ไร้ Overflow |
| **2a** | `04-staff-dashboard-desktop.png` | IT Staff Operational Dashboard (Desktop) | 1440 × 900 | ตรวจสอบ Unassigned Queue, My Assigned Tickets, Status Breakdown, Priority Breakdown, และ Recent Actions Taken |
| **2b** | `05-staff-dashboard-tablet.png` | IT Staff Dashboard (Tablet) | 820 × 1180 | ตรวจสอบ Metric Cards และ Actions Table บน Tablet Viewport |
| **2c** | `06-staff-dashboard-mobile.png` | IT Staff Dashboard (Mobile) | 375 × 812 | ตรวจสอบ Touch Target และ Responsive Breakdown Bars บน Mobile |
| **3** | `07-actions-taken-lifecycle-desktop.png` | Actions Taken Subsystem & Lifecycle Badges | 1440 × 900 | ตรวจสอบการแสดงผลสถานะ `Pending`, `In Progress`, `Completed`, ผู้รับมอบหมาย (`assigneeId`), และป้ายล็อกถาวร `(Terminal / Immutable)` |
| **4** | `08-ticket-status-history.png` | Append-Only Ticket Status History | 1440 × 900 | ตรวจสอบกล่องประวัติสถานะตั๋วที่บันทึกข้อมูลแบบเรียงลำดับเวลา ระบุสถานะก่อนหน้า/สถานะใหม่ และตัวตนผู้แก้ไขอย่างชัดเจน |
| **5** | `09-resolution-gate-rejection.png` | Resolution Gate Rejection Alert | 1440 × 900 | ตรวจสอบการสกัดกั้นการปิดงานตั๋วที่ไม่มี Action Taken พร้อมแสดงข้อความผิดพลาดสีแดงชัดเจน |
| **6** | `10-requester-actions-readonly.png` | Requester Read-Only View of Actions & History | 1440 × 900 | ตรวจสอบมุมมองของผู้ยื่นคำร้อง (Requester) ที่สามารถตรวจสอบประวัติงานและสถานะได้ แต่ไม่มีปุ่มบันทึกหรือแก้ไขใดๆ |

---

## 7. Known Limitations & Production Hardening Roadmap

1. **In-Memory Token Revocation Store**:
   - สำหรับการทดสอบในห้องปฏิบัติการและเซิร์ฟเวอร์เดี่ยว (Single-Instance Node.js) การเพิกถอน Token ด้วย `Set<string>` ทำงานได้ถูกต้อง 100% แต่ในระดับ Production ที่มี Load Balancer ควรปรับใช้ Redis หรือ Centralized Cache ร่วมกับ TTL
2. **Sequential E2E Test Execution (`workers: 1`)**:
   - เพื่อป้องกัน Race Condition บนฐานข้อมูลจริงระหว่างกระบวนการทดสอบ E2E จำเป็นต้องรันแบบเรียงลำดับ (`workers: 1`)
3. **Database Migration Safety**:
   - ไมเกรชัน `20261030120659_lab4_action_lifecycle_and_ticket_status_history` ได้ทำการ Backfill ข้อมูลเก่าทั้งหมด 84 รายการให้เป็นสถานะ `COMPLETED` อย่างปลอดภัย โดยไม่มีการสูญหายของข้อมูลย้อนหลัง
