# Phase 2 Implementation Plan: Masters and Users Management
**Date:** 2026-11-18  
**Branch:** `phase-2-masters-and-users`  
**Status:** In Progress  

---

## 1. Global Constraints & Operating Invariants
1. **Branch Isolation:** Committed strictly to `phase-2-masters-and-users`.
2. **Delete-Blocked-When-In-Use (Exit Gate Guard):** Attempting to delete any master entity (skill, industry, company type, qualification, country, state, city) referenced by an active job, company, or candidate must be rejected with HTTP 422.
3. **Last Admin Protection:** The system must never permit deactivation, status change, or soft deletion of the final remaining active administrator account.
4. **Self-Deactivation Guard:** Administrators cannot deactivate or delete their own currently authenticated user account.
5. **Soft Delete Policy:** All deletes set `deleted_at = NOW()`.
6. **Uniform Envelopes:** Standard `{ success, message, data, meta }` response envelope and `{ success: false, message, errors }` on failure.

---

## 2. Review Focus
- Test `DELETE /masters/:type/:id` returns 422 when referenced by existing job/candidate/company.
- Test `PATCH /users/:id/status` returns 422 when targeting last active admin or self.
- Test cascading location queries (country -> states -> cities).
- Test staff user creation with role enforcement.

---

## 3. Bite-Sized Task Breakdown

### Task 2.1: Generic Masters Engine (Backend)
- **Files:**
  - `server/src/modules/masters/masters.config.js` (entity mapping, prisma models, relation guards)
  - `server/src/modules/masters/masters.service.js`
  - `server/src/modules/masters/masters.controller.js`
  - `server/src/modules/masters/masters.routes.js`
  - `server/src/modules/masters/masters.schema.js`
- **Verification:** Unit & integration tests for all 12 master entities, toggle status, and delete blocker.

### Task 2.2: Staff & Admin User Management (Backend)
- **Files:**
  - `server/src/modules/users/users.service.js`
  - `server/src/modules/users/users.controller.js`
  - `server/src/modules/users/users.routes.js`
  - `server/src/modules/users/users.schema.js`
- **Verification:** Integration tests for staff CRUD, last admin guard, and self-deactivation blocker.

### Task 2.3: Reusable Frontend Component Library
- **Files:**
  - `client/src/components/tables/DataTable.jsx`
  - `client/src/components/forms/FilterBar.jsx`
  - `client/src/components/modals/ConfirmModal.jsx`
  - `client/src/components/modals/RemarkModal.jsx`
  - `client/src/components/forms/LocationCascade.jsx`
- **Verification:** UI rendering and interaction checks.

### Task 2.4: Masters & Staff Admin Pages
- **Files:**
  - `client/src/app/admin/masters/[type]/page.jsx`
  - `client/src/app/admin/staff/page.jsx`
- **Verification:** Page navigation, modal forms, status toggle, and delete flow.

---

## 4. Phase 2 Exit Gate Checklist
- [x] All 12 master types support list, create, update, toggle, and soft-delete.
- [x] Deletion of in-use master records is strictly blocked with HTTP 422 (proven by test).
- [x] Cascading dropdowns (Country -> State -> City) return hierarchical data.
- [x] Staff and admin CRUD works with password generation and status management.
- [x] Last-admin protection and self-deactivation guard verified by automated tests.

---

## 5. Verification Block
- **Test Command:** `cd server && npm test`
- **Results:** 7 test suites passed, 41 tests passed, 0 failed.
- **Coverage:**
  - `masters.test.js`: 10 passed (list, cascading, CRUD, in-use delete guard HTTP 422, soft-delete)
  - `users.test.js`: 7 passed (RBAC 403, list, create with temp password, update, self-deactivation 422, self-delete 422, last active admin 422)
  - All Phase 1 test suites (24 tests) remain 100% green.
