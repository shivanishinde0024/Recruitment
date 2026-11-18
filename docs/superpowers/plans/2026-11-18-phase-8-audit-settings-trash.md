# Phase 8 Plan: Audit, Settings, Trash

**Branch**: `phase-8-audit-settings-trash`  
**Goal**: Build enterprise compliance tools: centralized audit logging with diff viewer, soft-delete trash & restore manager with dependency guards, and system settings manager with SMTP test email trigger.

## Requirements Breakdown
- **REQ-AUD-01**: Centralized audit log tracking with JSON before/after snapshots (`old_values`, `new_values`).
- **REQ-AUD-02**: Admin audit log viewer API (`GET /api/v1/audit-logs`) with filtering and pagination.
- **REQ-AUD-03**: Trash and restore manager (`GET /api/v1/trash`, `PATCH /api/v1/trash/:module/:id/restore`, `DELETE /api/v1/trash/:module/:id/permanent`).
- **REQ-AUD-04**: System settings API (`GET /api/v1/settings`, `PUT /api/v1/settings`) and SMTP test email trigger (`POST /api/v1/settings/test-email`).

## Implementation Plan
1. Audit Module:
   - `server/src/modules/audit/audit.service.js`
   - `server/src/modules/audit/audit.controller.js`
   - `server/src/modules/audit/audit.routes.js`
2. Trash Module:
   - `server/src/modules/trash/trash.service.js`
   - `server/src/modules/trash/trash.controller.js`
   - `server/src/modules/trash/trash.routes.js`
3. Settings Module:
   - `server/src/modules/settings/settings.service.js`
   - `server/src/modules/settings/settings.controller.js`
   - `server/src/modules/settings/settings.routes.js`
4. Mount all in `server/src/routes.js`.
5. Write integration tests: `server/tests/integration/audit_settings_trash.test.js`.
6. Frontend screens:
   - `client/src/app/admin/audit/page.jsx`
   - `client/src/app/admin/trash/page.jsx`
   - `client/src/app/admin/settings/page.jsx`

