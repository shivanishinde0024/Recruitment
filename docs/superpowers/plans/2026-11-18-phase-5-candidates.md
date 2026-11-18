# Phase 5 Implementation Plan: Candidates
**Date:** 2026-11-18  
**Branch:** `phase-5-candidates`  
**Status:** Completed & Verified  

---

## 1. Global Constraints & Operating Invariants
1. **Branch Isolation:** Work strictly on branch `phase-5-candidates`.
2. **Duplicate Detection (Ruling 3.4 / REQ-CND-02):** Email OR mobile collision among non-deleted candidates returns HTTP 409 Conflict.
3. **Staff Ownership Boundary (Ruling 3.8 / REQ-CND-06):** Staff members can only edit or delete candidates where `uploaded_by === currentUser.id`. Admins have universal edit access.
4. **Search Fallback (Ruling 3.6 / REQ-CND-03):** Support search across name, email, skills, and current company with parameterized LIKE fallback when query token length < 3.
5. **Private Resume Streaming (REQ-CND-04):** Resumes served via `GET /candidates/:id/resume` with role-based authorization (Admin/Staff universal; Company only if mapped to active job).
6. **Bulk Upload Engine (Ruling 3.7 / REQ-CND-05):** Batch processing via `exceljs` + `adm-zip` with row-by-row error reporting.

---

## 2. Bite-Sized Task Breakdown

### Task 5.1: Bulk Upload & Resume Parser Engine
- **Files:** `server/src/modules/candidates/candidateBulk.service.js`
- **Deliverables:** Excel parser with 200-row batching, zip extractor matching resume filenames to rows, detailed per-row error summary.
- **Verification:** Unit and integration tests for spreadsheet parsing and error reporting.

### Task 5.2: Candidates Backend Module
- **Files:**
  - `server/src/modules/candidates/candidates.schema.js` (Single and bulk Zod schemas)
  - `server/src/modules/candidates/candidates.service.js` (CRUD, duplicate check, search fallback, resume streaming, staff ownership check)
  - `server/src/modules/candidates/candidates.controller.js`
  - `server/src/modules/candidates/candidates.routes.js`
- **Deliverables:** Mount `/api/v1/candidates` in `server/src/routes.js`.
- **Verification:** Integration tests covering duplicate 409, staff edit ownership 403, and resume streaming.

### Task 5.3: Frontend Candidate Management Screens
- **Files:**
  - `client/src/app/admin/candidates/page.jsx` (Directory with search and filters)
  - `client/src/app/admin/candidates/create/page.jsx` (Candidate profile creation form)
  - `client/src/app/admin/candidates/bulk/page.jsx` (Bulk upload dropzone with row error table)
  - `client/src/app/admin/candidates/[id]/page.jsx` (Candidate detail profile view)
- **Deliverables:** Responsive, accessible UI conforming to design tokens.

---

## 3. Phase 5 Exit Gate Checklist
- [x] Duplicate candidate by email or mobile returns HTTP 409.
- [x] Staff ownership constraint enforced: staff can only edit candidates they uploaded (403 otherwise).
- [x] Resume upload and authenticated streaming functional.
- [x] Bulk upload parses Excel + Zip with row-by-row error report.
- [x] Search functions correctly with parameterized fallback.
- [x] All 90 unit and integration tests passing.

### Proving Verification Output
```
PASS tests/integration/candidates.test.js
  Phase 5: Candidates Module
    Candidate Profile CRUD (REQ-CND-01)
      ✓ creates candidate with skills and resume attachment (22 ms)
      ✓ lists candidates with search filter and pagination (12 ms)
    Duplicate Detection Constraint (Ruling 3.4 / REQ-CND-02)
      ✓ rejects candidate with duplicate email with HTTP 409 Conflict (14 ms)
      ✓ rejects candidate with duplicate mobile with HTTP 409 Conflict (12 ms)
    Staff Upload Ownership Boundary (Ruling 3.8 / REQ-CND-06)
      ✓ allows Staff 1 to update candidate they personally uploaded (12 ms)
      ✓ CRITICAL GUARD: blocks Staff 2 from updating candidate uploaded by Staff 1 (returns 403) (11 ms)
      ✓ CRITICAL GUARD: blocks Staff 2 from deleting candidate uploaded by Staff 1 (returns 403) (34 ms)
      ✓ allows Admin to update or delete any candidate regardless of uploader (21 ms)
    Resume Streaming Authorization (REQ-CND-04)
      ✓ allows Staff and Admin to download candidate resume (10 ms)
      ✓ blocks company user from downloading resume if candidate is NOT mapped to company job (returns 404) (12 ms)
      ✓ allows company user to download resume if candidate IS mapped to their job (11 ms)
    Bulk Candidate Upload Engine (Ruling 3.7 / REQ-CND-05)
      ✓ processes spreadsheet import and provides row-by-row error report (144 ms)

Test Suites: 10 passed, 10 total
Tests:       90 passed, 90 total
Snapshots:   0 total
Time:        11.758 s
```
