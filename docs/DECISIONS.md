# Architectural & Technical Decisions Ledger (DECISIONS.md)

This document records all formal rulings, trade-off evaluations, conflict resolutions, and defect mitigations for the **Recruitment Portal** project.
Format: `Ruling: <decision> | <why> | <cost if wrong>`

---

## 1. Skill & Environment Process Decisions

### Ruling 1.1: Superpowers Process Emulation
- **Ruling:** Apply the full behavioral discipline of the `using-superpowers`, `writing-plans`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, and `verification-before-completion` workflows natively within Google Antigravity IDE, keeping all ledger files under `docs/superpowers/`.
- **Why:** The specific Claude Code superpower plugin bundles are not installed as local SKILL.md plugins in Antigravity, but the engineering principles (strict TDD red-green cycle, root cause debugging, worktree/branch isolation, command verification) are fully enforceable.
- **Cost if wrong:** Lack of process structure; mitigated by strict adherence to test-first and command verification rules.

### Ruling 1.2: Git Environment Configuration
- **Ruling:** All git invocations must specify `DEVELOPER_DIR=/Library/Developer/CommandLineTools` when executed within standard sandboxed sessions.
- **Why:** macOS `/var/db/xcode_select_link` is protected by system sandbox boundaries; explicit `DEVELOPER_DIR` prevents `xcode-select` probing errors.
- **Cost if wrong:** Git commands fail with error code 1 in sandboxed environments.

### Ruling 1.3: Database Strategy & Dual-Engine Testing
- **Ruling:** The production database engine is strictly **MySQL 8 (InnoDB, utf8mb4)** as mandated by the master prompt and development guide. For localized integration and unit testing in restricted sandbox environments without live daemon ports, Prisma schema is designed with clean modular abstraction and migration parity, supporting both MySQL 8 and automated local test DB instances.
- **Why:** Ensures 100% compliance with MySQL 8 schema, constraints, fulltext indexing, and raw locking queries (`FOR UPDATE`), while enabling instant repeatable TDD test execution in CI/sandbox without external daemon dependencies.
- **Cost if wrong:** Slower feedback loops or blocked test runs in isolated environments.

---

## 2. Specification Conflict Resolutions (PDF vs. Development Guide)

### Ruling 2.1: Staff Candidate Edit Scope
- **Conflict:** PDF Section 2 indicates Staff can add and edit candidates generally. Development Guide Section 5 and Section 11 (Rule 19) state: "Staff can only edit candidates they uploaded (admin edits all). Staff can see all candidates for matching purposes."
- **Ruling:** Follow Development Guide Section 11 Rule 19: Staff can view all candidates for job matching, but are strictly restricted to updating only candidates where `uploaded_by == req.user.id`.
- **Why:** Precedence rule dictates the Development Guide governs technical detail; prevents accidental cross-recruiter modification.
- **Cost if wrong:** Inadvertent data corruption or overwrites between recruiters.

### Ruling 2.2: ORM Selection
- **Conflict:** PDF mentions "MySQL with Sequelize or Prisma ORM". Development Guide specifies Prisma 5.
- **Ruling:** Use Prisma ORM exclusively (`@prisma/client`, `prisma`).
- **Why:** Master prompt and Development Guide enforce Prisma 5.
- **Cost if wrong:** Schema divergence and dual ORM maintenance overhead.

### Ruling 2.3: Company Access While Pending Verification
- **Conflict:** PDF states company login is blocked until status = APPROVED or limited access while pending. Development Guide Rule 1 states company can log in while `pending`, but sees only a "Verification pending" screen plus profile edit and document upload.
- **Ruling:** Implement the Development Guide rule: allow authentication for `pending` companies, but restrict UI access exclusively to the pending verification notice, profile view/edit, and document re-upload. Block all job posting and candidate review capabilities with HTTP 403.
- **Why:** Greatly improves user experience by allowing companies to check status, fix missing documents, and edit profile details.
- **Cost if wrong:** Company users cannot track their application status or remediate document requests.

---

## 3. The 15 Known Defects and Gaps (Master Prompt Section 9)

### Ruling 3.1: Dashboard Fan-Out Query Fix (Defect 1)
- **Problem:** Joining `jobs` directly to `job_candidates` and summing `positions_required` inflates positions counts proportionally to mapped candidates.
- **Ruling:** Decouple aggregations. Positions required and job counts must be calculated in a dedicated aggregate subquery grouped by `company_id`, then joined with candidate status counts from `job_candidates`.
- **Why:** Prevents multiplication of required positions when multiple candidates are mapped.
- **Cost if wrong:** Completely erroneous fulfillment percentages and statistics on admin dashboard.

### Ruling 3.2: Concurrent Job Code Generation (Defect 2)
- **Problem:** `nextJobCode` reading `JOB-<year>-XXXX` with `orderBy: { id: 'desc' }` produces duplicate codes under concurrent requests.
- **Ruling:** Use a dedicated database sequence / lock table (`job_sequences` with `year` and `current_val`) locked with `SELECT ... FOR UPDATE` inside `prisma.$transaction`, combined with a database-level `UNIQUE KEY uq_jobs_code (job_code)` and an automatic retry mechanism.
- **Why:** Guarantees strict gapless or collision-free sequential job codes even under high concurrency.
- **Cost if wrong:** Job creation failures or database constraint violations under concurrent traffic.

### Ruling 3.3: Next.js Middleware & JWT Secret Isolation (Defect 3)
- **Problem:** Sharing the API's private `JWT_ACCESS_SECRET` with the Next.js client edge runtime widens blast radius.
- **Ruling:** Next.js `middleware.js` will verify a dedicated, role-scoped signed routing cookie (`app_role_token` or signed session cookie) solely for UX redirects, or use non-critical verification. The Express REST API remains the authoritative security boundary with strict `authenticate` and `requireRole` middleware. Expired tokens are never accepted for authorization on API routes.
- **Why:** Zero-trust architecture: frontend routing is advisory for user experience; backend API enforces 100% of authentication and RBAC.
- **Cost if wrong:** Security token leakage in client/SSR bundles and privilege escalation.

### Ruling 3.4: Soft Delete vs. Unique Email Policy (Defect 4)
- **Problem:** `users.email` has a `UNIQUE` constraint. When a user or company is soft-deleted (`deleted_at != NULL`), re-registering or re-creating that email fails with a duplicate key conflict.
- **Ruling:** Upon soft deletion, the email is rewritten to `deleted_<timestamp>_<original_email>` (or composite unique constraint including `deleted_at`), and restored back if un-deleted.
- **Why:** Enables clean re-registration of legitimate email addresses while preserving audit logs and historical relational integrity.
- **Cost if wrong:** Users cannot re-register after being archived; support interventions required.

### Ruling 3.5: Refresh Token Family Revocation / Reuse Detection (Defect 5)
- **Problem:** Basic token rotation deletes or updates tokens without detecting reuse of compromised tokens.
- **Ruling:** Implement token families (`family_id` or parent chaining). When an already revoked or rotated refresh token is presented, revoke all refresh tokens belonging to that user/family immediately and flag a security event.
- **Why:** OWASP and NIST compliance for session token hijacking mitigation.
- **Cost if wrong:** Compromised stolen refresh tokens remain usable if replay isn't flagged.

### Ruling 3.6: FULLTEXT Index Search Limits & Fallback (Defect 6)
- **Problem:** MySQL InnoDB FULLTEXT index ignores tokens under `ft_min_word_len` (default 3 or 4 chars) and stop words, and does not automatically account for `deleted_at IS NULL`.
- **Ruling:** Search query handler inspects query terms. If terms are shorter than 3 characters, fallback to parameterized `LIKE %term%` on name, email, designation, and skills. All queries explicitly append `WHERE deleted_at IS NULL`.
- **Why:** Search works reliably for short acronyms like "Go", "C#", "UI", "QA", or two-letter terms.
- **Cost if wrong:** Recruiter searches yield empty results for common short technical keywords.

### Ruling 3.7: Candidate Contact Masking Completeness (Defect 7)
- **Problem:** Masking candidate contact details until confirmed can leak through partial serializers, notifications, audit logs, or resumes.
- **Ruling:** Implement a strict candidate serializer (`serializeCandidate(cand, requestingUser, mappingStatus)`). For company roles, `email`, `mobile`, and `alt_mobile` are masked (e.g., `s***@***.com`, `+91-XXXXX1234`) unless `status === 'confirmed'` or setting `hide_candidate_contact_until_confirmed === false`. In strict mode, resume download is restricted or served with a documented advisory.
- **Why:** Protects recruitment agency business model from direct client circumventing before placement confirmation.
- **Cost if wrong:** Clients bypass portal and recruit candidates directly, causing revenue loss.

### Ruling 3.8: Staff Candidate Edit Scope (Defect 8)
- **Problem:** Ambiguity regarding whether staff can edit any candidate.
- **Ruling:** Settle per Development Guide: Staff can only edit candidates where `uploaded_by == req.user.id`. Admin can edit all candidates. All staff can view and map any candidate.
- **Why:** Clean accountability for recruiter data entry.
- **Cost if wrong:** Uncontrolled cross-editing among recruitment team members.

### Ruling 3.9: Company Profile Edits After Approval (Defect 9)
- **Problem:** If an approved company changes its legal name, GST, or PAN, it bypasses verification.
- **Ruling:** Add `needs_reverification` boolean column to `companies`. If an approved company updates `company_name`, `gst_no`, or `pan_no`, set `needs_reverification = true`, notify staff/admin, but do not lock out normal day-to-day hiring operations.
- **Why:** Balances regulatory verification requirements with frictionless customer experience.
- **Cost if wrong:** Fraudulent company profile changes go unnoticed.

### Ruling 3.10: BigInt Serialization (Defect 10)
- **Problem:** MySQL `BIGINT UNSIGNED` primary and foreign keys are returned as JavaScript `BigInt` by Prisma, which throws `TypeError: Do not know how to serialize a BigInt` in `JSON.stringify()`.
- **Ruling:** Add `BigInt.prototype.toJSON = function () { return this.toString(); };` (or safe Number conversion where integers fit within `Number.MAX_SAFE_INTEGER`, defaulting to string/number utility serializer). All IDs in API responses are sanitized safely.
- **Why:** Eliminates JSON serialization crashes on all Express endpoints.
- **Cost if wrong:** 500 Internal Server Errors on every API endpoint returning BIGINT IDs.

### Ruling 3.11: Confirm Race Condition Prevention (Defect 11)
- **Problem:** Two company users confirming different candidates concurrently could exceed `positions_required`.
- **Ruling:** In `prisma.$transaction`, execute `SELECT positions_required, status FROM jobs WHERE id = ? FOR UPDATE`, count confirmed candidates with row locks, and reject with HTTP 422 ("All positions are filled") if `confirmed_count >= positions_required`.
- **Why:** Guarantees strict inventory control for positions.
- **Cost if wrong:** Over-hiring beyond contracted positions.

### Ruling 3.12: Timezone Normalization (Defect 12)
- **Problem:** Server, database, and client running in different timezones causes `last_date` comparison bugs around midnight.
- **Ruling:** Store all timestamps in UTC (`CURRENT_TIMESTAMP`). Format and compare business dates (e.g. `last_date`) in `Asia/Kolkata` (IST) using `dayjs.tz`.
- **Why:** Standardizes deadline evaluation regardless of host system timezone.
- **Cost if wrong:** Premature or delayed job expiration around midnight.

### Ruling 3.13: Uniform Error Envelope (Defect 13)
- **Problem:** Unhandled Zod, Prisma, Multer, or JWT errors return disparate error shapes.
- **Ruling:** Centralized `errorHandler` middleware catches all exceptions and transforms them into standard envelope:
  `{ success: false, message: string, errors?: Array<{ field: string, message: string }> }`
  Mapping: Zod -> 400, Prisma P2002 -> 409, Prisma P2025 -> 404, Multer fileSize -> 413, Business logic -> 422.
- **Why:** Predictable client-side error handling and form validation field error mapping.
- **Cost if wrong:** Frontend crashes or unreadable error messages for users.

### Ruling 3.14: Pagination & Whitelisted Sorting (Defect 14)
- **Problem:** Unlimited `limit` values invite DoS; raw `sortBy` strings invite SQL injection.
- **Ruling:** All listing endpoints apply `pagination({ page, limit, maxLimit: 100 })` and whitelist `allowedSortFields` per module. Unknown sort fields fall back to `created_at desc`. All list responses return standardized `meta: { page, limit, total, totalPages }`.
- **Why:** Prevents memory exhaustion attacks and SQL injection.
- **Cost if wrong:** Server crashes on `?limit=1000000` or SQL injection vulnerabilities.

### Ruling 3.15: Lockout Status & Enumeration Mitigation (Defect 15)
- **Problem:** Returning different messages or statuses for non-existent emails vs. locked accounts enables user enumeration.
- **Ruling:** For authentication endpoints (`/auth/login`), return uniform error message `Invalid email or password` on both invalid credentials and unverified existences. When an account is locked due to 5 failed attempts, return HTTP 423 `Account locked due to consecutive failed logins. Please try again after 15 minutes.` For `/auth/forgot-password`, always return HTTP 200 `If that email is registered, a password reset link has been sent.`
- **Why:** OWASP Authentication security guideline compliance.
- **Cost if wrong:** Attackers can harvest valid email addresses from brute-force attempts.
