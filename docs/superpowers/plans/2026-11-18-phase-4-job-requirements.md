# Phase 4 Implementation Plan: Job Requirements
**Date:** 2026-11-18  
**Branch:** `phase-4-job-requirements`  
**Status:** Completed & Verified  

---

## 1. Global Constraints & Operating Invariants
1. **Branch Isolation:** Work strictly on branch `phase-4-job-requirements`.
2. **Sequential Concurrency-Safe Job Code (Ruling 3.2):** `JOB-<YYYY>-XXXX` using atomic counter in `job_sequences` table with concurrency retry loop to eliminate duplicates under parallel requests.
3. **Approved Company Authorization Guard (Flow F1 / Ruling 3.1):** Company users can only create jobs if `company.status === 'approved'`. Pending, suspended, or rejected companies receive HTTP 403.
4. **Rich Text XSS Sanitization (Master §8.3):** `description`, `responsibilities`, and `benefits` must be sanitized through `sanitize-html` to strip dangerous HTML tags/attributes.
5. **Validation Invariants:**
   - `positions_required >= 1`
   - `experience_max >= experience_min`
   - `salary_max >= salary_min`
   - Cannot reduce `positions_required` below confirmed candidates count (HTTP 422).
6. **Multi-Tenant Ownership:** Company users can only inspect and edit jobs belonging to their own company.
7. **Staff Assignment (Flow F5):** Admin can assign staff members to jobs; sends `job_assigned_staff` notification.
8. **Dynamic Metric Aggregates:** Computed counts (`submitted`, `confirmed`, `remaining`) returned on job endpoints.

---

## 2. Bite-Sized Task Breakdown

### Task 4.1: Concurrency-Safe Job Code Generator
- **Files:** `server/src/modules/jobs/jobCode.service.js`
- **Deliverables:** Year-based sequence generator reading and updating `job_sequences` with process mutex and atomic transactions.
- **Verification:** Concurrency simulation test verifying uniqueness (10 parallel requests -> 10 unique sequential codes).

### Task 4.2: Jobs Backend Module
- **Files:**
  - `server/src/modules/jobs/jobs.schema.js` (Zod validations including rich text sanitization and numeric range constraints)
  - `server/src/modules/jobs/jobs.service.js` (Job CRUD, staff assignment, status changes, computed counts, notifications)
  - `server/src/modules/jobs/jobs.controller.js`
  - `server/src/modules/jobs/jobs.routes.js`
  - `server/src/utils/sanitize.js`
- **Deliverables:** Mount `/api/v1/jobs` in `server/src/routes.js`.
- **Verification:** Integration tests covering job creation, staff assignment, approval gate, and bounds validation.

### Task 4.3: Frontend Job Management Screens
- **Files:**
  - `client/src/app/company/jobs/page.jsx` (Company job list with status badges & remaining counts)
  - `client/src/app/company/jobs/create/page.jsx` (Job post form with skills multi-select)
  - `client/src/app/company/jobs/[id]/page.jsx` (Job details & progress cards)
  - `client/src/app/admin/jobs/page.jsx` (Admin/Staff job table with "Assign Staff" modal)
  - `client/src/app/admin/jobs/[id]/page.jsx` (Admin/Staff job view)
- **Deliverables:** Modern, accessible UI conforming to design tokens.

---

## 3. Phase 4 Exit Gate Checklist
- [x] Concurrency-safe job code sequence format `JOB-<YYYY>-XXXX` without race conditions.
- [x] Approved company rule strictly enforced: pending company receives HTTP 403 on job creation.
- [x] Admin & staff can assign staff to jobs, emitting notification.
- [x] Position reduction guard blocks reducing positions below confirmed count (HTTP 422).
- [x] XSS sanitization tested on HTML fields.
- [x] All 78 unit and integration tests passing.

### Proving Verification Output
```
PASS tests/integration/jobs.test.js
  Phase 4: Job Requirements Module
    Concurrency-Safe Job Code Generator (Ruling 3.2 / REQ-JOB-02)
      ✓ generates sequential job codes with format JOB-<YYYY>-XXXX (10 ms)
      ✓ handles parallel concurrent code requests without generating duplicates (4 ms)
    Company Authorization Guard & Approval Enforcement (Ruling 3.1 / Flow F1 / REQ-JOB-01)
      ✓ BLOCKS company with pending verification status from creating a job with HTTP 403 (28 ms)
      ✓ allows approved company to post a job and notifies admin & staff (24 ms)
      ✓ allows Admin to create job on behalf of approved company (21 ms)
    Validation & XSS Sanitization Rules (REQ-JOB-03, REQ-JOB-04)
      ✓ rejects job when experience_max is less than experience_min with HTTP 400 (11 ms)
      ✓ rejects job when salary_max is less than salary_min with HTTP 400 (12 ms)
      ✓ rejects positions_required less than 1 with HTTP 400 (10 ms)
      ✓ sanitizes dangerous XSS payloads in rich text description and responsibilities (12 ms)
    Staff Assignment Workflow (Flow F5 / REQ-JOB-05)
      ✓ allows Admin to assign a staff member and notifies staff with job_assigned_staff (28 ms)
      ✓ blocks company from assigning staff to job with HTTP 403 (10 ms)
      ✓ rejects assigning non-existent or non-staff user with HTTP 422 (10 ms)
    Position Reduction Guard & Status Lifecycle (REQ-JOB-06, REQ-JOB-07)
      ✓ CRITICAL GUARD: blocks reducing positions_required below confirmed candidate count (returns 422) (11 ms)
      ✓ allows reducing positions_required when equal or greater than confirmed count (16 ms)
      ✓ updates status to on_hold and closed (19 ms)
    Multi-Tenant Access Control & IDOR Boundary (§8.2)
      ✓ returns HTTP 404 when another company attempts to view or update Company A job (18 ms)
      ✓ allows Staff and Admin to view any company job (10 ms)

Test Suites: 9 passed, 9 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        9.086 s
```
