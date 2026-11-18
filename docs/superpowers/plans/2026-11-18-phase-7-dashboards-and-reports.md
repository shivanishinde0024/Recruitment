# Phase 7 Plan: Dashboards, Notifications, and Reports

**Branch**: `phase-7-dashboards-and-reports`  
**Goal**: Build high-performance aggregated dashboards (Admin Company-Wise, Staff, Company), exportable reports with anti-formula injection, and automated requisition deadline notifications.

## Requirements Breakdown
- **REQ-DSH-01**: Admin Company-Wise dashboard with decoupled queries for summary metrics, company table, and urgent worklist (Ruling 3.1).
- **REQ-DSH-02**: Admin company drill-down endpoint (`GET /api/v1/reports/company/:id`).
- **REQ-DSH-03**: Staff personal dashboard (`GET /api/v1/reports/staff-dashboard`).
- **REQ-DSH-04**: Company employer dashboard (`GET /api/v1/reports/company-dashboard`).
- **REQ-DSH-05**: Exportable reports supporting CSV and Excel formats.
- **REQ-DSH-06**: Strict anti-formula injection sanitization on all exports (prefixing `=`, `+`, `-`, `@` with `'`).
- **REQ-DSH-07**: Deadline reminder cron service flagging jobs approaching `last_date`.

## Implementation Tasks
1. `server/src/utils/csvExport.js` & anti-formula injection sanitizer.
2. `server/src/modules/reports/reports.service.js`:
   - `getAdminCompanyWise()` (decoupled aggregation).
   - `getCompanyDrillDown(companyId)`.
   - `getStaffDashboard(staffUserId)`.
   - `getCompanyDashboard(companyId)`.
   - `exportReport({ type, format, query })`.
3. `server/src/modules/reports/reports.controller.js` & `reports.routes.js`.
4. `server/src/cron/deadlineReminder.js` (cron service and on-demand trigger).
5. Integration test: `server/tests/integration/reports.test.js`.
6. Frontend screens:
   - `client/src/app/admin/dashboard/page.jsx` (Company-Wise summary, charts, urgent worklist).
   - `client/src/app/admin/reports/page.jsx` (Reports table & CSV/Excel export triggers).
   - `client/src/app/staff/dashboard/page.jsx` (Staff assigned tasks & pipeline).
   - `client/src/app/company/dashboard/page.jsx` (Company overview & active job cards).

