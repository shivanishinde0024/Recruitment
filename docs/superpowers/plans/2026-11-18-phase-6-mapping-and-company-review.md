# Phase 6 Implementation Plan: Candidate Mapping and Company Review
**Date:** 2026-11-18  
**Branch:** `phase-6-mapping-and-company-review`  
**Status:** In Progress  

---

## 1. Global Constraints & Operating Invariants
1. **Branch Isolation:** Work strictly on branch `phase-6-mapping-and-company-review`.
2. **Weighted Match Algorithm (Guide §9.8 / REQ-MAP-01):** Weighted score out of 100: Skills 50, Experience 25, Location 15, Qualification 10.
3. **Auto Job Status Recomputation (Guide §9.7 / REQ-MAP-04):**
   - When candidate is submitted to an `open` job -> auto transition to `in_progress`.
   - When confirmed count reaches `positions_required` -> auto transition to `fulfilled`.
   - If confirmed count drops below `positions_required` -> auto revert to `in_progress`.
4. **Race-Safe Candidate Confirmation (Ruling 3.11 / REQ-MAP-06):** Atomic transaction with row locking (`FOR UPDATE`) preventing over-fulfillment when concurrent confirmations happen.
5. **Strict Contact Masking (Ruling 3.3 / Master §9.7 / REQ-MAP-07):** Company cannot view candidate email/mobile until candidate is confirmed.
6. **Withdrawal Guard (REQ-MAP-08):** Staff can only withdraw candidates whose status is still `submitted`.

---

## 2. Bite-Sized Task Breakdown

### Task 6.1: Matching Score Engine
- **Files:** `server/src/modules/mappings/matching.service.js`
- **Deliverables:** Composite scoring algorithm computing skills, experience, location, and qualification breakdown scores.
- **Verification:** Unit tests verifying score weights and edge cases.

### Task 6.2: Mappings Backend Module
- **Files:**
  - `server/src/modules/mappings/mappings.schema.js` (Mapping creation, company review actions, withdrawal schemas)
  - `server/src/modules/mappings/mappings.service.js` (Mapping creation with duplicate skip, suggested candidates, review actions with race-safe confirmation, auto job status recomputation, contact masking)
  - `server/src/modules/mappings/mappings.controller.js`
  - `server/src/modules/mappings/mappings.routes.js`
- **Deliverables:** Mount `/api/v1/mappings` in `server/src/routes.js`.
- **Verification:** Integration tests for matching, race-safe confirmation, auto-fulfillment, contact masking, and withdrawal.

### Task 6.3: Frontend Candidate Mapping & Company Review Screens
- **Files:**
  - `client/src/app/admin/jobs/[id]/candidates/page.jsx` (Staff candidate mapping console with suggested candidates)
  - `client/src/app/company/jobs/[id]/candidates/page.jsx` (Company candidate review board with confirm/reject actions)
- **Deliverables:** Interactive, accessible UI conforming to design tokens.

---

## 3. Phase 6 Exit Gate Checklist
- [ ] Match score calculation conforms to 50/25/15/10 weighting.
- [ ] Suggested candidates returns top-ranked profiles.
- [ ] Mapping candidate updates job status from `open` to `in_progress`.
- [ ] Confirming candidate increments confirmed count and marks job `fulfilled` when quota is met.
- [ ] Race-safe confirmation blocks over-fulfilling job positions.
- [ ] Contact details masked for company until candidate is confirmed.
- [ ] All unit and integration tests passing.
