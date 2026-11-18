# Phase 3 Implementation Plan: Company Registration and Verification
**Date:** 2026-11-18  
**Branch:** `phase-3-company-registration-and-verification`  
**Status:** Completed & Verified  

---

## 1. Global Constraints & Operating Invariants
1. **Branch Isolation:** All changes committed strictly to `phase-3-company-registration-and-verification`.
2. **Mandatory Remarks Rule (Exit Gate / Flow F3):** `reject`, `need_info`, and `suspend` verification actions strictly require a non-empty `remark` string. If omitted, the request must fail with HTTP 422.
3. **Company Access Enforcement (Flow F1):** A company account with status `pending` can log in, but is strictly restricted to profile and document uploads; any attempt to post jobs or review candidates is blocked with HTTP 403.
4. **Re-verification Policy (Ruling 3.9):** If an already-approved company modifies its legal name, GST, or PAN, flag `needs_reverification = true` and notify staff without locking out current hiring.
5. **Private File Storage:** Files are stored in non-public directories (`uploads/`) with random UUID filenames and served exclusively via authenticated streaming endpoints.
6. **Notification Delivery:** Status changes trigger in-app notifications and email queue dispatches.

---

## 2. Review Focus
- Test `PATCH /companies/:id/verify` rejects without remark on `reject`, `need_info`, and `suspend` (HTTP 422).
- Test multi-step company registration creates user, company, documents, and verification log atomically.
- Test `GET /notifications` and `/notifications/unread-count`.
- Test authenticated document streaming rejects unauthorized cross-company requests.

---

## 3. Bite-Sized Task Breakdown

### Task 3.1: File Upload Engine & Private Storage
- **Files:** `server/src/middleware/upload.js`
- **Deliverables:** Multer storage configured for disk storage with UUID filenames, mime-type verification, and size caps.
- **Verification:** Unit test for allowed and disallowed extensions.

### Task 3.2: Company Module Backend
- **Files:**
  - `server/src/modules/companies/companies.routes.js`
  - `server/src/modules/companies/companies.controller.js`
  - `server/src/modules/companies/companies.service.js`
  - `server/src/modules/companies/companies.schema.js`
- **Deliverables:** Registration, company list, detail with logs and documents, verification action with remarks, re-verification trigger, document download.
- **Verification:** Integration tests covering registration, status changes, and remark validation.

### Task 3.3: Notifications Service & API
- **Files:**
  - `server/src/services/notify.service.js`
  - `server/src/modules/notifications/notifications.routes.js`
  - `server/src/modules/notifications/notifications.controller.js`
  - `server/src/modules/notifications/notifications.service.js`
- **Deliverables:** Create in-app notification records, unread counts, mark read, mark all read.
- **Verification:** Integration tests for notification triggers.

### Task 3.4: Frontend Multi-Step Registration & Verification Pages
- **Files:**
  - `client/src/app/(auth)/register/page.jsx` (5-step wizard)
  - `client/src/components/layout/NotificationBell.jsx`
  - `client/src/app/admin/companies/page.jsx`
  - `client/src/app/admin/companies/[id]/page.jsx`
  - `client/src/app/company/profile/page.jsx`
- **Deliverables:** Multi-step registration form, admin company review dashboard with action modals.
- **Verification:** UI component and page integration verification.

---

## 4. Phase 3 Exit Gate Checklist
- [x] Multi-step registration creates user, company, documents, and log entry.
- [x] Admin/staff can approve, reject, request info, or suspend companies.
- [x] Remark rules enforced: missing remark on reject/need_info/suspend returns 422 (proven by test).
- [x] In-app notifications and notification bell update when verification actions occur.
- [x] Documents can be previewed/downloaded through authenticated streaming.

### Proving Verification Output
```
PASS tests/integration/companies.test.js
  Phase 3: Company Registration and Verification
    Company Self-Registration (Flow F1 / REQ-CMP-01)
      ✓ successfully registers a company and sets status to pending (296 ms)
      ✓ rejects registration with duplicate email with 409 Conflict (28 ms)
      ✓ rejects registration with duplicate GST with 409 Conflict (12 ms)
      ✓ auto-approves company registration when auto_approve_company setting is true (266 ms)
    Company Verification Workflow & Exit Gate (REQ-CMP-03 / REQ-CMP-04)
      ✓ EXIT GATE: returns HTTP 422 if reject action has no remark or empty remark (22 ms)
      ✓ EXIT GATE: returns HTTP 422 if need_info action has no remark (10 ms)
      ✓ EXIT GATE: returns HTTP 422 if suspend action has no remark (10 ms)
      ✓ approves company without mandatory remark and notifies company user (12 ms)
      ✓ rejects company with descriptive remark and logs it (26 ms)
      ✓ suspends and reactivates company profile (19 ms)
    Company Profile Modification & Reverification (Ruling 3.9 / REQ-CMP-05)
      ✓ flags needs_reverification = true when approved company edits legal GST or PAN (11 ms)
      ✓ does NOT flag needs_reverification when updating non-legal fields like contact person (10 ms)
    Multi-Tenant Access Control & IDOR Protection (§8.2 / REQ-CMP-02)
      ✓ returns HTTP 404 when Company A attempts to view Company B profile (10 ms)
      ✓ returns HTTP 404 when Company A attempts to update Company B profile (9 ms)
      ✓ allows Admin to view any company profile (9 ms)
      ✓ allows Staff to view company directory and filter by status (20 ms)
    Company Document Management (REQ-CMP-06)
      ✓ uploads a document to company profile and downloads it (9 ms)
      ✓ returns HTTP 404 when downloading document belonging to another company (8 ms)
    Company Deletion (Admin Only)
      ✓ soft deletes company and deactivates associated user account (9 ms)
      ✓ forbids staff from deleting a company with 403 Forbidden (9 ms)

Test Suites: 8 passed, 8 total
Tests:       61 passed, 61 total
Snapshots:   0 total
Time:        8.342 s
```
