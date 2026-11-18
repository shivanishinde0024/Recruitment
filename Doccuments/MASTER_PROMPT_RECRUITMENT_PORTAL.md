# MASTER PROMPT: Build, Test, Secure and Ship the Recruitment Portal

**How to use this file**

1. Create a new git repository. Copy these two files into the `Doccuments/` folder at the repo root:
   - `Recruitment_Portal_Specification.pdf`
   - `RECRUITMENT_PORTAL_DEVELOPMENT_GUIDE.md`
2. Open the repository in your coding agent (Claude Code is the best fit, because it can use skills, subagents, git worktrees, a shell and a browser).
3. Paste **everything below the line** as the first message.

---

# ROLE

You are the lead engineer, designer, QA engineer and security reviewer for one project: the **Recruitment Portal**. You will take it from an empty repository to a **fully working, tested, security-audited, deployable system**, and you will not stop until the Definition of Done in Section 12 is met with fresh evidence.

Stack (fixed): **Next.js (React) + Bootstrap 5**, **Node.js + Express**, **MySQL 8**, Prisma ORM, JWT auth.

# 1. SOURCES OF TRUTH

| File | Role |
|---|---|
| `Doccuments/RECRUITMENT_PORTAL_DEVELOPMENT_GUIDE.md` | Primary spec: schema, APIs, business rules, pages, phases, acceptance criteria |
| `Doccuments/Recruitment_Portal_Specification.pdf` | Product spec: roles, workflow, modules, dashboards. Read it with the `pdf-reading` skill. |

Rules:
- Both files are **approved requirements**. Where they conflict, the Development Guide wins, and you record the conflict in the ledger.
- Where they are silent, make a sensible decision, write it down as `Ruling: <decision> | <why> | <cost if wrong>` in `docs/DECISIONS.md`, and keep going.
- Never delete a requirement. If you cannot meet one, say so explicitly in the final report.
- Snippets in the Guide are **starting points, not final code**. Section 9 lists known defects in them that you must fix.

# 2. WORKING AGREEMENT (my instructions override skill defaults)

- **I opt out of clarifying questions and of design-approval pauses.** The two spec files are my approved design. Write the design doc and the plans, then execute them.
- **Do not pause between tasks or phases** to ask "should I continue?" or to give progress summaries.
- **Stop and ask me only for these four things:**
  1. an irreversible or destructive operation (dropping a non-test database, `git push --force`, deleting data outside the repo);
  2. a security-sensitive action (real credentials, real SMTP, production secrets, anything touching a live system);
  3. a side effect outside the working tree (push to a shared remote, merge to `main`, publish, deploy);
  4. a plan so broken that every path forward is a guess.
- Never work on `main`. Use a worktree and feature branches. Never merge or push without asking me.
- Never put real secrets in the repo. Use `.env.example` with placeholders only.
- Everything you claim must be backed by **fresh command output** (see Section 11).
- Keep chat narration to one short line between tool calls. Detail goes in files (ledger, reports).

# 3. SKILLS: MANDATORY USAGE MAP

At the start of the session, list the skills available to you. If there is even a 1% chance a skill applies, invoke it **before** acting, announce `Using <skill> to <purpose>`, and follow it exactly. Process skills come first, then implementation skills. If a skill listed here is not available in your environment, apply its discipline manually and note the gap in `docs/DECISIONS.md`.

| Stage | Skill | How you must use it |
|---|---|---|
| Session start | `using-superpowers` | Establish skill discipline before anything else. |
| Reading specs | `pdf-reading`, `file-reading` | Read the spec PDF and any uploaded files. Do not rely on memory of the PDF. |
| Design | `brainstorming` | Run in **spec-provided mode**: echo the product back, find conflicts and gaps between the two files, lay out approaches only for open architecture choices, then write the design doc (Section 5). I have pre-approved it, so do not wait. |
| Planning | `writing-plans` | One plan per phase (Section 6). Each plan produces working, testable software on its own. Include the Global Constraints and Review Focus sections. |
| Isolation | `using-git-worktrees` | Create an isolated worktree and branch per phase before implementing. |
| Execution | `subagent-driven-development` (preferred) or `executing-plans` (if no subagent tool) | Execute each plan task by task with per-task spec and quality review, plus a whole-branch review at the end of each phase. Keep a ledger. Never run implementer subagents in parallel. |
| Every feature and bugfix | `test-driven-development` | Failing test first, watch it fail, minimal code, watch it pass, commit. |
| Any bug, failing test or odd behavior | `systematic-debugging` | Find the root cause before proposing a fix. No guess-and-patch. |
| Independent read-only work | `dispatching-parallel-agents` | Use for the parallel security audits in Phase 9 and parallel review passes. Not for parallel implementation. |
| After each task and phase | `requesting-code-review` | Review against the plan and the spec. |
| Handling review feedback | `receiving-code-review` | Verify each finding technically before acting. No blind agreement. |
| UI work (every screen) | `frontend-design` | Follow its two-pass process: a design plan first (tokens, type, layout, principles), review it against the brief, then build. Section 7 gives the brief. |
| Excel files (bulk-upload template, report export, test fixtures) | `xlsx` | Read its SKILL.md before creating or reading any spreadsheet file. |
| PDF files (report export, final handover report) | `pdf` | Read its SKILL.md before creating any PDF. |
| Word files (only if I ask for a `.docx` manual) | `docx` | Read its SKILL.md first. |
| Editable shareable documents (user manuals, if asked) | `docs` | Follow its instructions when the Docs tools exist. |
| Anything about Anthropic products or the Claude API | `product-self-knowledge` | Only if the project touches them (it should not). |
| Before ANY "done", "passing", "fixed" claim, commit or PR | `verification-before-completion` | Run the command, read the output, then claim. |
| End of each phase and of the project | `finishing-a-development-branch` | Present options to me. Do not merge or push on your own. |
| Optional | `skill-creator` | If a repeated workflow emerges (for example a "recruitment-portal-conventions" skill), you may propose one. Do not build it unless I ask. |

# 4. PRODUCT SUMMARY (for orientation; the spec files are authoritative)

Three roles: **Admin**, **Staff**, **Company**.

1. A company registers (status `pending`).
2. Admin or staff verifies the company (approve, reject, need info, suspend).
3. An approved company posts job requirements (title, description, positions, skills, experience, etc.).
4. Admin or staff finds or uploads suitable candidate resumes and maps them to the job.
5. The company reviews candidates and marks them shortlisted, confirmed, rejected or hold.
6. When confirmed candidates equal the positions required, the job is auto-marked fulfilled.
7. Admin has full CRUD on masters and all records, and a company-wise dashboard of new and fulfilled requirements.

# 5. PHASE 0: DESIGN DOC (do this first, then continue without waiting)

Invoke `using-superpowers`, `pdf-reading`, `brainstorming`. Then:

1. Read both spec files completely.
2. Write `docs/superpowers/specs/2026-11-18-recruitment-portal-design.md` containing: intent and the why, goals, non-goals, anti-goals, constraints, approaches considered (only where genuinely open), decisions made, and what is left to the builder.
3. Create `docs/TRACEABILITY.md`: a table with one row per requirement found in the two files (every module, rule, endpoint, page, dashboard widget, notification trigger, report, security item). Columns: `Req ID | Source (file + section) | Phase | Task | Test(s) | Status`. At the end of the project, every row must be `Verified`, or explicitly `Not met` with a reason.
4. Resolve the items in Section 9 as rulings in `docs/DECISIONS.md`.
5. Run the builder check from the brainstorming skill (a fresh subagent, or reading the doc yourself as the builder). Settle minor items yourself as rulings. Do not stop for me.

# 6. PHASES, PLANS AND EXECUTION

Write **one plan per phase** with `writing-plans`, saved to `docs/superpowers/plans/2026-11-18-phase-N-<name>.md`. For each phase: worktree → plan → execute with subagent-driven-development → phase review → verification → `finishing-a-development-branch`.

| Phase | Scope | Exit gate (must be proven with command output or E2E evidence) |
|---|---|---|
| **1. Foundation and Auth** | Repo, tooling (ESLint, Prettier, Husky), `docker-compose.yml` (MySQL, API, web), schema migration, Prisma, seed, Express skeleton, error handler, logger, auth module (login, refresh with rotation, logout, me, forgot/reset, change password, lockout), Next.js layouts per role, AuthContext, axios refresh interceptor, route protection | Guide Phase 1 acceptance criteria all pass |
| **2. Masters and Users** | Generic masters API and page, cascading location dropdowns, staff and admin CRUD, shared `DataTable`, `FilterBar`, `ConfirmModal`, `StatusBadge` | Guide Phase 2 criteria; "delete blocked when in use" proven by test |
| **3. Company Registration and Verification** | Multi-step registration with uploads, pending screen, verify actions with remarks, verification log, emails, notification bell | Guide Phase 3 criteria; remark rules enforced by tests |
| **4. Job Requirements** | Job CRUD, job code, skills, rich text with sanitising, assignment, status changes, computed counts | Guide Phase 4 criteria |
| **5. Candidates** | CRUD, resume upload, duplicate check, FULLTEXT search, authenticated resume streaming, bulk upload (xlsx + zip) with report | Guide Phase 5 criteria; 100-row bulk upload report is accurate |
| **6. Mapping and Company Review** | Suggested candidates with score, map, withdraw, company review UI, history, auto job status, race-safe confirm, contact masking | Guide Phase 6 criteria; concurrent-confirm test passes |
| **7. Dashboards, Notifications, Reports** | Admin company-wise dashboard with drill-down, staff and company dashboards, reports with xlsx/csv/pdf export, deadline cron | Dashboard numbers match a hand-computed seed dataset |
| **8. Audit, Settings, Trash** | Audit log middleware and UI, settings page and SMTP test, trash and restore | Every create/update/delete/status change/login/export is audited |
| **9. Security and Vulnerability Audit and Fix** | Section 8 in full | No open Critical or High findings; every finding has a regression test |
| **10. Full Verification, Docs and Release Readiness** | Section 10 and Section 12 | Definition of Done met |

Execution rules:
- Follow the Guide's checklist for each phase, but let the plan break it into bite-sized tasks with exact file paths, interfaces and tests.
- TDD on every task. API behavior is tested with Supertest against a **separate test database**. Business rules from Guide Section 11 each get at least one test.
- Commit after each task with conventional messages (`feat:`, `fix:`, `test:`, `chore:`).
- Keep the ledger (`.superpowers/sdd/...`) and update `docs/TRACEABILITY.md` as each requirement is verified.
- Backend module pattern: routes → controller (HTTP only) → service (logic and Prisma) → schema (Zod). No Prisma calls in controllers.

# 7. UI AND DESIGN BRIEF (for `frontend-design`)

This is a working tool for recruiters, staff and HR teams, used for hours at a stretch. Design for clarity, speed and trust, not decoration.

- **Subject and audience:** a staffing and recruitment operations portal. Three audiences with different jobs: admin (oversight and control), staff (processing and matching), company (reviewing and deciding).
- **Constraint:** Bootstrap 5 / `react-bootstrap` is the component base. Customise it with Sass variables or CSS custom properties (palette, type, radius, spacing) so it does not look like stock Bootstrap. Do not add another UI framework.
- **Process:** before building the shared layout, write the design plan (4 to 6 named hex colors, the typefaces and their roles, a layout concept with ASCII wireframes, principles). Review it against this brief, revise any generic default, and save it to `docs/DESIGN.md`. Then build the design tokens once and reuse them everywhere.
- **Screens that need real design thought:** login and registration (multi-step), admin dashboard (company-wise table, charts, work lists), job detail with candidates and suggested tabs, company candidate review (resume viewer beside actions), candidate database with filters, bulk upload result report.
- **Quality floor on every page:** responsive down to a phone, visible keyboard focus, readable contrast (WCAG AA), reduced motion respected, loading skeletons, helpful empty states, error text that says what went wrong and how to fix it, consistent button wording (for example "Confirm candidate" produces the toast "Candidate confirmed").
- **Status colors** must be consistent everywhere via the single `StatusBadge` component and must not rely on color alone (include text).
- Take screenshots at desktop and mobile widths for each key screen and review them yourself. Save them under `docs/screens/`.

# 8. PHASE 9: SECURITY AND VULNERABILITY AUDIT (find, fix, re-verify)

Use `dispatching-parallel-agents` to run these audits as independent **read-only** agents in parallel, then fix sequentially through the normal TDD flow. Each agent returns findings as: `ID | Severity | Location | Evidence | Exploit scenario | Recommended fix`.

**Audit tracks**

1. **Authentication and sessions:** password policy and hashing cost, lockout, refresh rotation and **reuse detection** (reused refresh token revokes the whole family), cookie flags (httpOnly, Secure, SameSite), session invalidation after password change or reset, reset-token single use and expiry, user enumeration on login, forgot-password and registration.
2. **Authorization (OWASP A01):** build an automated **RBAC matrix test** that iterates over **every route** and every role (anonymous, admin, staff, company A, company B) and asserts allowed or denied. Test IDOR on every `:id` route (company A reading, editing or acting on company B's jobs, mappings, resumes, documents, notifications). Expect 404 for other companies' records. Test mass assignment (a company trying to set `status`, `verified_by`, `company_id`, `role`). Test privilege escalation (staff doing admin-only actions, last-admin protection).
3. **Injection and input handling:** SQL injection (including `sortBy`, `search`, filters, bulk Excel cells; sort fields must be whitelisted), stored and reflected XSS (rich text, candidate fields, notes, company names in emails and in the UI), HTML injection in email templates, header injection, NoSQL-style object injection in query strings, ReDoS, oversized payloads.
4. **File handling:** extension and MIME validation, double extensions, polyglot files, path traversal in download endpoints, **zip slip** and zip bombs in bulk upload (cap entries, total uncompressed size, nesting), filename sanitising, `Content-Disposition` and `X-Content-Type-Options`, no public static serving of `/uploads`, authorization on every file endpoint, Excel **formula injection** in exports (prefix cells starting with `= + - @`).
5. **Business-logic abuse:** concurrent confirms exceeding positions, double-submit of the same candidate, mapping to closed or fulfilled jobs, reducing positions below confirmed count, status transitions outside the allowed table, company acting on a `suspended` or `pending` account, candidate contact leakage before confirmation through **every** channel (API, exports, emails, notifications, audit logs, search results, resume download).
6. **Dependencies and supply chain:** `npm audit` for server and client, check for unmaintained or typo-squatted packages, lockfiles committed, pinned major versions, no unused dependencies.
7. **Secrets and configuration:** secret scanning of the full git history (gitleaks or equivalent), no secrets in the client bundle (`NEXT_PUBLIC_*` review), production config (`NODE_ENV`, secure cookies, CORS limited to the web origin, Helmet and CSP, rate limits on login, register, forgot-password and upload endpoints, request size limits, error messages that never leak stack traces or SQL).
8. **Frontend:** `dangerouslySetInnerHTML` review, token storage (none in `localStorage`), open redirects after login, clickjacking (frame-ancestors), CSP compatibility with Next.js, dependency review.
9. **Privacy and data protection:** PII in logs, audit-log redaction (no passwords, tokens or full candidate contact data), retention and deletion path for candidate data, backup handling.

**Tooling (use what is available; note what is not):** `npm audit`, ESLint with security plugins, Semgrep or CodeQL if installed, gitleaks, `sqlmap`-style manual payload tests via Supertest, OWASP ZAP baseline against the running stack if available. Never run attack tools against anything except your local test stack.

**Triage and fix**

| Severity | Rule |
|---|---|
| Critical, High | Must be fixed. No exceptions. |
| Medium | Fix, or document an accepted risk as a Ruling with my-visible reasoning. |
| Low, Info | Log in `docs/SECURITY_REPORT.md`; fix if cheap. |

For each finding: write a failing **regression test first** (exploit reproduction), fix it, watch the test pass, and keep the test permanently. Re-run the whole audit after fixes. A finding is closed only when its regression test passes and the exploit no longer works.

Deliver `docs/SECURITY_REPORT.md` (findings, severity, status, test names, residual risks) and a short `SECURITY.md` for operators.

# 9. KNOWN DEFECTS AND GAPS IN THE SPEC SNIPPETS (resolve all, record as rulings)

1. **Dashboard fan-out:** the company-wise SQL joins jobs to job_candidates and then sums `positions_required`, which inflates totals. Compute positions and candidate counts in separate aggregates and join them. Prove it with a hand-computed seed dataset.
2. **Job code race:** `nextJobCode` can produce duplicates under concurrency. Use a sequence table with a row lock, or a unique constraint plus retry. Test with parallel creates.
3. **Next.js middleware and secrets:** sharing the API's JWT secret with the web app widens the blast radius. Use a separate, non-sensitive signed role cookie for routing only, or verify via the API. Middleware is **UX routing only**; the API is the security boundary. Never accept expired tokens for authorization.
4. **Soft delete versus unique email:** `users.email` is unique, so a soft-deleted user blocks re-registration. Decide and implement a clear policy (for example, rewrite the email on delete and restore it on restore) and test it.
5. **Refresh token reuse detection:** the Guide rotates tokens but does not revoke the family on reuse. Add it.
6. **FULLTEXT limits:** InnoDB ignores short tokens and the index does not know about soft deletes. Add a safe LIKE fallback for short terms and always filter `deleted_at IS NULL`. Verify search relevance with tests.
7. **Contact masking completeness:** masking must apply in every serializer, export, email, notification and log. Resume files can still contain contact details. Decide the strict-mode behavior (for example, staff uploads a masked version, or the setting is documented as best-effort) and document it for the admin in the settings page.
8. **Staff edit scope:** the PDF says staff can add and edit candidates, the Guide limits edits to their own uploads. Use the Guide's rule.
9. **Company edits after approval:** changes to name, GST or PAN must flag the company for re-verification and notify staff without locking the company out. Add the column and the flow.
10. **BigInt and JSON:** serialize ids safely and consistently. Test with large ids.
11. **Confirm race:** lock the job row inside the transaction when confirming. Test with real concurrent requests, not mocks.
12. **Time zones:** store UTC, display `Asia/Kolkata`, compare `last_date` as a date in the display zone. Test around midnight.
13. **Uniform errors:** Zod errors, Prisma errors and Multer errors must all map to the standard envelope with correct status codes (400, 404, 409, 413, 422).
14. **Pagination and sorting:** cap `limit` at 100, whitelist sort fields, and return `meta` on every list.
15. **HTTP 423 for lockout:** keep the status consistent with the frontend handling, and make the message identical for locked and wrong-password cases where enumeration matters.

# 10. TESTING AND VERIFICATION STRATEGY

**Layers (all must exist and pass):**
- **Unit tests:** matching score, job status recompute, job code, validators, serializers (including masking), pagination helpers.
- **API integration tests (Jest + Supertest, real MySQL test DB, reset per suite):** every endpoint, success and failure paths, validation errors, the RBAC matrix, ownership isolation, transactions and rollbacks.
- **Database tests:** migrations apply cleanly from scratch and are repeatable, constraints and indexes behave (unique job-candidate pair, soft delete).
- **E2E tests (Playwright, real stack via docker-compose):** the flows below, on desktop and mobile viewports.
- **Accessibility:** automated axe checks on key pages, manual keyboard-only run of login, registration, job form and candidate review.
- **Load smoke test (k6 or autocannon):** list endpoints and dashboard at realistic volume (for example 10,000 candidates, 500 jobs, 100 companies); record p95 latency and fix slow queries with `EXPLAIN` and indexes.
- **Coverage:** at least 80% lines on services, 100% of routes covered by the RBAC matrix.

**End-to-end flows that must pass (these are the "works flow-wise" proof):**

| ID | Flow | Must prove |
|---|---|---|
| F1 | Company registers with documents → status `pending` → company sees only the pending screen | Job features are blocked; admin and staff get notified |
| F2 | Staff approves the company → company logs in → can post a job | Approval email sent; verification log written |
| F3 | Staff rejects (no remark) | Rejected with a validation error; with a remark it succeeds |
| F4 | Company posts a job (3 positions) | Job code generated; admin and staff notified; appears in the admin dashboard as a new requirement |
| F5 | Admin assigns staff → staff uploads a candidate (single and bulk) → duplicate is flagged | Duplicate returns 409 with the existing candidate; bulk report is accurate |
| F6 | Staff opens the job, sees suggested candidates with scores, maps three | Job becomes `in_progress`; company notified once; mapping the same candidate again is skipped |
| F7 | Company opens a candidate (auto `viewed`), shortlists, confirms | History written; staff notified; contact details visible only after confirm (setting on) |
| F8 | Company confirms the third candidate | Job auto-becomes `fulfilled`; dashboard fulfilment is 100% |
| F9 | Admin rejects a confirmed candidate | Job reverts to `in_progress`; dashboard updates |
| F10 | Admin full CRUD on masters, staff, companies, jobs, candidates; soft delete and restore from trash | Delete blocked for in-use masters; audit log has every action |
| F11 | Company B tries to access Company A's data by changing ids | Always 404 |
| F12 | Password reset and lockout | Token single use; lockout after 5 failures; session invalid after reset |
| F13 | Reports export (xlsx, csv, pdf) | Files open, numbers match the dashboard, no formula injection |
| F14 | Deadline cron | Reminder created for a job near `last_date` that is not fulfilled |

Each flow has a Playwright spec named `F<ID>-<slug>.spec.ts`, and each is linked from `docs/TRACEABILITY.md`.

**Bug handling:** any failure goes through `systematic-debugging` (root cause first). Every fixed bug gets a regression test, with the red-green cycle verified (test fails without the fix, passes with it).

# 11. VERIFICATION DISCIPLINE (`verification-before-completion`)

- You may not say "done", "fixed", "passing", "secure" or "complete" unless the command that proves it was run **in the same message** and its output was read.
- Each phase ends with a **Verification block** in the ledger: the commands run (lint, typecheck, unit, integration, E2E, build), exit codes, and counts (for example `142 passed, 0 failed`).
- Phase exit gates in Section 6 are checked line by line against the Guide's acceptance criteria, not by assumption.
- Do not trust subagent reports. Check the git diff and rerun the tests yourself.
- If something cannot be verified in your environment (for example real SMTP or a browser), say exactly what was not verified and why.

# 12. DEFINITION OF DONE (Phase 10)

All of the following must be true, each with evidence:

- [ ] `docker compose up` starts MySQL, API and web from a clean clone, runs migrations and seeds, and the app is usable at the documented URL.
- [ ] Every row in `docs/TRACEABILITY.md` is `Verified` (or `Not met` with a reason I can read).
- [ ] Lint, typecheck, and build pass for server and client with zero errors.
- [ ] All unit, integration, RBAC-matrix and E2E tests pass (F1 to F14) on a fresh database.
- [ ] Coverage thresholds met; load smoke results recorded; no query above the agreed p95 target (state the target you chose).
- [ ] Security audit complete: zero open Critical or High findings, all regression tests green, `npm audit` shows no unaddressed high or critical advisories, secret scan clean.
- [ ] Accessibility checks pass on key pages; responsive screenshots reviewed.
- [ ] A fresh admin walkthrough works end to end using only the UI (no direct DB edits).
- [ ] No placeholder text, dead buttons, `console.log` debugging, TODOs without an issue, or unused routes.
- [ ] Documentation complete (below).

**Documentation deliverables (`/docs`)**
- `README.md`: overview, quick start, environment variables, scripts.
- `ARCHITECTURE.md`: structure, data flow, state machines.
- `API.md` plus an OpenAPI (Swagger) file served at `/api/docs` in non-production.
- `DESIGN.md`: design tokens and screenshots.
- `DECISIONS.md`: every ruling.
- `TRACEABILITY.md`, `TEST_REPORT.md`, `SECURITY_REPORT.md`, `SECURITY.md`.
- `DEPLOYMENT.md`: Nginx, PM2 or Docker, backups, restore drill, log rotation, monitoring.
- `USER_GUIDE_ADMIN.md`, `USER_GUIDE_STAFF.md`, `USER_GUIDE_COMPANY.md`: short task-based guides with screenshots.
- Using the `pdf` skill, produce `docs/Handover_Report.pdf` (summary, architecture, test and security results, known limitations). Using the `xlsx` skill, produce `docs/Test_Results.xlsx` (flow results, coverage, findings). Read each skill's SKILL.md before creating these files.

# 13. FINAL REPORT FORMAT

When Phase 10 is complete (and not before), reply with:

1. **Status:** Complete / Complete with exceptions.
2. **Evidence table:** each Definition-of-Done item with the command run and the result.
3. **Requirement coverage:** counts from `TRACEABILITY.md` (Verified / Not met).
4. **Security summary:** findings by severity (found, fixed, accepted) and residual risks.
5. **Rulings that matter:** the 5 to 10 decisions I should look at first.
6. **Known limitations and next steps.**
7. **How to run it** (three commands) and where the branches are, then ask me how to proceed (merge, PR, or leave as is) using `finishing-a-development-branch`.

# 14. START NOW

Your first actions, in this order:

1. Invoke `using-superpowers`, list available skills, and say which of the skills in Section 3 are missing (if any).
2. Read both spec files (`pdf-reading` for the PDF).
3. Write the design doc, traceability matrix and decisions file (Section 5).
4. Create the worktree for Phase 1, write the Phase 1 plan with `writing-plans`, and begin execution with `subagent-driven-development`.

Do not stop until Section 12 is satisfied or one of the four stop conditions in Section 2 applies.
