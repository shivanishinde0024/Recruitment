# Requirements Traceability Matrix (TRACEABILITY.md)

This matrix maps every functional, technical, security, and interface requirement from `Recruitment_Portal_Specification.pdf` and `RECRUITMENT_PORTAL_DEVELOPMENT_GUIDE.md` across all 10 build phases.
Status values: `Planned` | `In Progress` | `Verified` | `Not met` (with reason).

| Req ID | Description | Source (file + section) | Phase | Task | Test(s) | Status |
|---|---|---|---|---|---|---|
| **REQ-FND-01** | Monorepo layout (server + client), tooling, ESLint, Prettier, git hooks, environment configurations | Guide §3, §4; PDF §8 | Phase 1 | P1-T1 | `npm run lint`, `npm test` | Verified |
| **REQ-FND-02** | MySQL 8 schema with InnoDB, utf8mb4, soft delete (`deleted_at`), and foreign keys | Guide §7; PDF §5 | Phase 1 | P1-T2 | Schema migration & seed test | Verified |
| **REQ-FND-03** | Prisma ORM setup, models generation, and seed script (admin, masters, settings, templates) | Guide §4.2, §7.1 | Phase 1 | P1-T3 | Seed verification test | Verified |
| **REQ-FND-04** | Express server core with Helmet, CORS, HPP, RateLimit, Morgan, Winston, and uniform error envelope | Guide §8, §9.1, §9.2 | Phase 1 | P1-T4 | App boot & middleware integration tests | Verified |
| **REQ-FND-05** | Next.js 14 App Router client with customized Bootstrap 5 tokens, responsive layout & theme tokens | Master §7; Guide §12.4 | Phase 1 | P1-T5 | Client build & render check | Verified |
| **REQ-AUT-01** | User authentication: login with email and password, bcrypt cost 12, issue access & refresh tokens | Guide §9.4, §10.1; PDF §4 | Phase 1 | P1-T6 | `auth.login.spec.ts` | Verified |
| **REQ-AUT-02** | Account lockout after 5 consecutive failed attempts for 15 minutes (HTTP 423) | Master §9.15; Guide §9.4 | Phase 1 | P1-T6 | `auth.lockout.spec.ts` (F12) | Verified |
| **REQ-AUT-03** | Rotating refresh tokens with reuse detection (revokes entire token family upon replay) | Master §9.5; Guide §10.1 | Phase 1 | P1-T7 | `auth.refresh.spec.ts` | Verified |
| **REQ-AUT-04** | Logout revoking refresh token and clearing httpOnly cookies | Guide §10.1; PDF §4 | Phase 1 | P1-T7 | `auth.logout.spec.ts` | Verified |
| **REQ-AUT-05** | Password reset flow: forgot password with anti-enumeration (always 200), single-use token valid 30m | Guide §10.1; Master §8 | Phase 1 | P1-T8 | `auth.reset.spec.ts` (F12) | Verified |
| **REQ-AUT-06** | Change password and update profile (`/auth/me`, `/auth/change-password`) | Guide §10.1; PDF §4 | Phase 1 | P1-T8 | `auth.profile.spec.ts` | Verified |
| **REQ-AUT-07** | Frontend AuthContext, `useAuth` hook, role-based route guard in Next.js `middleware.js` | Guide §12.1, §12.3 | Phase 1 | P1-T9 | Client auth guard integration test | Verified |
| **REQ-MST-01** | Generic Masters REST API (`/masters/:type`) supporting 12 master entities with parent relations | Guide §7, §10.6; PDF §2 | Phase 2 | P2-T1 | `masters.api.spec.ts` (F10) | Verified |
| **REQ-MST-02** | Master delete prevention: reject deletion (422) if record is referenced by active records | Master §10; Guide §10.6 | Phase 2 | P2-T1 | `masters.guard.spec.ts` (F10) | Verified |
| **REQ-MST-03** | Cascading location endpoints and frontend selectors (Country -> State -> City) | Guide §10.6, §13.5 | Phase 2 | P2-T2 | `location.cascade.spec.ts` | Verified |
| **REQ-MST-04** | Staff & Admin User management (CRUD, status toggle, reset password, last-admin protection) | Guide §10.7, §11.18; PDF §2 | Phase 2 | P2-T3 | `users.admin.spec.ts` | Verified |
| **REQ-MST-05** | Reusable frontend components: `DataTable`, `FilterBar`, `ConfirmModal`, `StatusBadge` | Master §7; Guide §12.4, §13.5 | Phase 2 | P2-T4 | UI component test suite | Verified |
| **REQ-CMP-01** | Multi-step Company Registration with document uploads (GST, PAN, Incorporation, Logo) | Guide §10.1, §13.1; PDF §4 | Phase 3 | P3-T1 | `companies.test.js` (F1) | Verified |
| **REQ-CMP-02** | Pending verification state enforcement: company can only view pending status & edit profile/docs | Master §4; Guide §11.1 | Phase 3 | P3-T2 | `companies.test.js` (F1) | Verified |
| **REQ-CMP-03** | Company verification workflows by Admin/Staff (Approve, Reject, Need Info, Suspend) with mandatory remarks | Guide §6.1, §10.2; PDF §4 | Phase 3 | P3-T3 | `companies.test.js` (F2, F3) | Verified |
| **REQ-CMP-04** | Company verification logs audit trail (`company_verification_logs`) recording verifier & remarks | Guide §6.1, §7; PDF §4 | Phase 3 | P3-T3 | `companies.test.js` (F2) | Verified |
| **REQ-CMP-05** | Re-verification flag triggered when approved company modifies name, GST, or PAN | Master §9.9; Guide §10.2 | Phase 3 | P3-T4 | `companies.test.js` | Verified |
| **REQ-CMP-06** | In-app and Email notifications for company verification lifecycle events | Guide §15.2; PDF §4 | Phase 3 | P3-T5 | `companies.test.js` (F2) | Verified |
| **REQ-JOB-01** | Job creation by approved Company, Admin, or Staff with auto-generated sequential `job_code` | Master §9.2; Guide §9.6, §10.3 | Phase 4 | P4-T1 | `jobs.test.js` (F4) | Verified |
| **REQ-JOB-02** | Concurrency-safe job code generation using sequence lock table | Master §9.2 | Phase 4 | P4-T1 | `jobs.test.js` (F4) | Verified |
| **REQ-JOB-03** | Rich text sanitization (`sanitize-html`) on job description and responsibilities | Master §8.3; Guide §10.3 | Phase 4 | P4-T2 | `jobs.test.js` | Verified |
| **REQ-JOB-04** | Job validation rules (`positions_required >= 1`, `exp_max >= exp_min`, `salary_max >= salary_min`) | Guide §11.6 | Phase 4 | P4-T2 | `jobs.test.js` | Verified |
| **REQ-JOB-05** | Staff assignment to job by Admin (`PATCH /jobs/:id/assign-staff`) with staff notification | Guide §10.3, §11.9; PDF §4 | Phase 4 | P4-T3 | `jobs.test.js` (F5) | Verified |
| **REQ-JOB-06** | Manual job status transitions (`open`, `on_hold`, `closed`) and position reduction guard | Guide §10.3, §11.8 | Phase 4 | P4-T3 | `jobs.test.js` | Verified |
| **REQ-JOB-07** | Job detail computed metrics (positions, submitted, confirmed, pending, remaining) | Guide §10.3.1; PDF §4 | Phase 4 | P4-T4 | `jobs.test.js` | Verified |
| **REQ-CND-01** | Candidate profile management (CRUD) with single resume file upload | Guide §10.4; PDF §4 | Phase 5 | P5-T1 | `candidates.test.js` (F5) | Verified |
| **REQ-CND-02** | Candidate duplicate detection by email OR mobile returning HTTP 409 conflict | Guide §10.4, §11.11 | Phase 5 | P5-T1 | `candidates.test.js` (F5) | Verified |
| **REQ-CND-03** | FULLTEXT candidate search with graceful parameterized LIKE fallback for short tokens | Master §9.6; Guide §7, §10.4 | Phase 5 | P5-T2 | `candidates.test.js` | Verified |
| **REQ-CND-04** | Authenticated private resume file streaming endpoint (`GET /candidates/:id/resume`) | Guide §8.6, §10.4, §11.16 | Phase 5 | P5-T3 | `candidates.test.js` | Verified |
| **REQ-CND-05** | Bulk candidate upload via Excel spreadsheet + Zip archive of resumes with detailed row-by-row error report | Guide §10.4.1; Master §6 | Phase 5 | P5-T4 | `candidates.test.js` (F5) | Verified |
| **REQ-CND-06** | Staff edit boundary: Staff can only edit candidates they personally uploaded | Master §9.8; Guide §11.19 | Phase 5 | P5-T5 | `candidates.test.js` | Verified |
| **REQ-MAP-01** | Candidate matching score algorithm (skills 50, experience 25, location 15, qualification 10) | Guide §9.8; PDF §4 | Phase 6 | P6-T1 | `mappings.test.js` (F6) | Verified |
| **REQ-MAP-02** | Suggested candidates endpoint (`GET /jobs/:id/suggested-candidates`) with top 50 match scores | Guide §9.8, §10.3 | Phase 6 | P6-T1 | `mappings.test.js` (F6) | Verified |
| **REQ-MAP-03** | Candidate to job mapping (single & multi) with duplicate skip and notification dispatch | Guide §10.5; PDF §3 | Phase 6 | P6-T2 | `mappings.test.js` (F6) | Verified |
| **REQ-MAP-04** | Auto job status recomputation (`open` -> `in_progress` -> `fulfilled` -> `in_progress`) | Guide §9.7, §11.7; Master §6 | Phase 6 | P6-T2 | `mappings.test.js` (F6, F8, F9) | Verified |
| **REQ-MAP-05** | Company candidate review interface with actions (`viewed`, `shortlisted`, `confirmed`, `rejected`, `hold`) | Guide §6.3, §10.5; PDF §4 | Phase 6 | P6-T3 | `mappings.test.js` (F7) | Verified |
| **REQ-MAP-06** | Race-safe candidate confirmation using row locking (`FOR UPDATE`) inside transaction | Master §9.11; Guide §10.5 | Phase 6 | P6-T4 | `mappings.test.js` (F8) | Verified |
| **REQ-MAP-07** | Strict candidate contact masking before confirmation (`hide_candidate_contact_until_confirmed`) | Master §9.7; Guide §11.15 | Phase 6 | P6-T5 | `mappings.test.js` (F7) | Verified |
| **REQ-MAP-08** | Withdrawal of submitted candidate by staff (only allowed while status is `submitted`) | Guide §6.3, §10.5, §11.17 | Phase 6 | P6-T6 | `mappings.test.js` | Verified |
| **REQ-DSH-01** | Admin Company-Wise dashboard with cards, charts, urgent worklists, and decoupled SQL aggregation | Master §9.1; Guide §14.1, §14.2 | Phase 7 | P7-T1 | `dashboard.admin.spec.ts` | Planned |
| **REQ-DSH-02** | Admin company drill-down view showing company's jobs and mapped candidates | Guide §10.8, §14.1; PDF §6 | Phase 7 | P7-T1 | `dashboard.drilldown.spec.ts` | Planned |
| **REQ-DSH-03** | Staff dashboard (assigned jobs, pending verifications, submission & conversion stats) | Guide §14.3; PDF §6 | Phase 7 | P7-T2 | `dashboard.staff.spec.ts` | Planned |
| **REQ-DSH-04** | Company dashboard (positions vs confirmed, pending review candidates, recent activity) | Guide §14.4; PDF §6 | Phase 7 | P7-T2 | `dashboard.company.spec.ts` | Planned |
| **REQ-DSH-05** | Exportable reports (Company-wise, Staff performance, Candidate pipeline, Time to fill) | Guide §10.9, §16.1; PDF §6 | Phase 7 | P7-T3 | `reports.export.spec.ts` (F13) | Planned |
| **REQ-DSH-06** | Anti-formula injection on CSV/Excel exports (sanitize cells starting with `=`, `+`, `-`, `@`) | Master §8.4 | Phase 7 | P7-T3 | `reports.formula.injection.spec.ts` (F13) | Planned |
| **REQ-DSH-07** | Daily deadline reminder cron for jobs approaching `last_date` | Guide §15.4; Master §10 | Phase 7 | P7-T4 | `cron.deadline.spec.ts` (F14) | Planned |
| **REQ-AUD-01** | Centralized audit log middleware tracking create, update, delete, status_change, login, export | Guide §7, §8.8, §16.2 | Phase 8 | P8-T1 | `audit.middleware.spec.ts` (F10) | Planned |
| **REQ-AUD-02** | Audit log viewer in Admin with JSON before/after diff inspector | Guide §13.2, §16.2 | Phase 8 | P8-T1 | `audit.ui.spec.ts` | Planned |
| **REQ-AUD-03** | Trash and restore manager for soft-deleted companies, jobs, and candidates | Master §9.4; Guide §8.5, §13.2 | Phase 8 | P8-T2 | `trash.restore.spec.ts` (F10) | Planned |
| **REQ-AUD-04** | System settings management with dynamic SMTP configuration and test email trigger | Guide §7, §16.3; PDF §4 | Phase 8 | P8-T3 | `settings.smtp.spec.ts` | Planned |
| **REQ-SEC-01** | OWASP A01: Automated exhaustive RBAC matrix test across all endpoints and roles | Master §8.2 | Phase 9 | P9-T1 | `security.rbac.matrix.spec.ts` | Planned |
| **REQ-SEC-02** | IDOR testing on every parameterized `:id` route ensuring 404 for cross-tenant access | Master §8.2; Guide §11.13 | Phase 9 | P9-T1 | `security.idor.spec.ts` (F11) | Planned |
| **REQ-SEC-03** | Injection & XSS tests (SQL injection, stored/reflected XSS, header injection, NoSQL queries) | Master §8.3 | Phase 9 | P9-T2 | `security.injection.spec.ts` | Planned |
| **REQ-SEC-04** | File handling security (Zip slip, Zip bomb, double extension, MIME spoofing, traversal) | Master §8.4 | Phase 9 | P9-T3 | `security.files.spec.ts` | Planned |
| **REQ-SEC-05** | Business logic abuse audit (concurrent confirms, status jump exploits, negative positions) | Master §8.5 | Phase 9 | P9-T4 | `security.logic.spec.ts` | Planned |
| **REQ-SEC-06** | Supply chain, secret scanning & client bundle audit (no leaked secrets in `NEXT_PUBLIC_*`) | Master §8.6, §8.7 | Phase 9 | P9-T5 | `security.secrets.spec.ts` | Planned |
| **REQ-SEC-07** | Privacy & PII redaction in logs and audit tables | Master §8.9 | Phase 9 | P9-T6 | `security.privacy.spec.ts` | Planned |
| **REQ-REL-01** | Full E2E Playwright verification suite for flows F1 through F14 | Master §10 | Phase 10 | P10-T1 | `e2e.flows.spec.ts` | Planned |
| **REQ-REL-02** | Accessibility automated WCAG AA audit on key screens | Master §7, §10 | Phase 10 | P10-T2 | `a11y.audit.spec.ts` | Planned |
| **REQ-REL-03** | Load smoke test (k6 or autocannon) validating p95 query response target | Master §10 | Phase 10 | P10-T3 | `load.smoke.spec.ts` | Planned |
| **REQ-REL-04** | Deliverables & documentation package (README, ARCHITECTURE, API, SECURITY, Handover PDF) | Master §12 | Phase 10 | P10-T4 | Documentation check | Planned |
