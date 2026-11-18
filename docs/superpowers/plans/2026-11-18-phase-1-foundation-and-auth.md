# Phase 1 Implementation Plan: Foundation and Auth
**Date:** 2026-11-18  
**Branch:** `phase-1-foundation-and-auth`  
**Status:** In Progress  

---

## 1. Global Constraints & Operating Invariants
1. **Never work on `main`:** All work in this phase is committed to `phase-1-foundation-and-auth`.
2. **Strict TDD Cycle:** Write failing unit/integration tests before writing code for controllers, middleware, or services.
3. **No Secrets in Repo:** All credentials use `.env.example` placeholders.
4. **Uniform Response & Error Envelope:**
   - Success: `{ success: true, message: string, data: any, meta?: object }`
   - Error: `{ success: false, message: string, errors?: Array<{ field: string, message: string }> }`
5. **Security Baseline:**
   - Passwords hashed with `bcrypt` (12 rounds).
   - Rate limit on `/api/v1/auth` endpoints.
   - 15-minute access token, 7-day rotating refresh token with family revocation on reuse.
   - Account lockout after 5 consecutive failed logins for 15 minutes (HTTP 423).
   - Zero user enumeration on forgot password (always 200).
6. **Verification Before Completion:** Every completed task must be verified with command output before moving to the next.

---

## 2. Review Focus
- **Auth Integrity:** Confirm refresh token reuse immediately revokes the family.
- **Lockout:** Confirm 5 wrong passwords trigger HTTP 423 with lock duration.
- **Routing & RBAC:** Ensure Next.js route protection and Express API `requireRole` reject unauthorized roles.
- **BigInt Safety:** Ensure BigInt serialization does not crash JSON responses.

---

## 3. Bite-Sized Task Breakdown

### Task 1.1: Project Tooling & Monorepo Structure
- **Files:** `package.json`, `server/package.json`, `client/package.json`, `docker-compose.yml`, `.gitignore`
- **Deliverables:** Root package script orchestration (`npm run dev`, `npm test`), ESLint, Prettier config.
- **Verification:** `npm run lint` or syntax checks pass.

### Task 1.2: Database Schema & Migration Foundation
- **Files:** `server/sql/001_schema.sql`, `server/prisma/schema.prisma`
- **Deliverables:** Complete MySQL 8 schema script, Prisma schema defining models for `users`, `refresh_tokens`, `password_resets`, `permissions`, `user_permissions`, `companies`, `company_documents`, `company_verification_logs`, `jobs`, `job_skills`, `candidates`, `candidate_skills`, `job_candidates`, `job_candidate_history`, `notifications`, `audit_logs`, `email_templates`, `settings`, and 12 master tables.
- **Verification:** Schema generation / validation tests pass.

### Task 1.3: Prisma Database Seeder
- **Files:** `server/prisma/seed.js`
- **Deliverables:** Seed default admin (`admin@portal.com` / `Admin@123456`), all masters (industries, company types, qualifications, skills, etc.), default settings, email templates.
- **Verification:** Seed script runs cleanly against database/mock and creates records.

### Task 1.4: Express Server Core Architecture
- **Files:**
  - `server/src/app.js`
  - `server/src/server.js`
  - `server/src/config/env.js`, `db.js`
  - `server/src/utils/ApiError.js`, `asyncHandler.js`, `response.js`
  - `server/src/middleware/error.js`, `audit.js`
- **Deliverables:** Express app with Helmet, CORS, HPP, CookieParser, Morgan, rate-limiting, and central error handler.
- **Verification:** Supertest testing 404 handler and error response envelope.

### Task 1.5: Authentication Module (Backend)
- **Files:**
  - `server/src/modules/auth/auth.routes.js`
  - `server/src/modules/auth/auth.controller.js`
  - `server/src/modules/auth/auth.service.js`
  - `server/src/modules/auth/auth.schema.js`
  - `server/src/middleware/auth.js`
- **Deliverables:**
  - POST `/auth/login` (with lockout check and failed attempts increment)
  - POST `/auth/refresh` (token rotation + reuse detection revoking family)
  - POST `/auth/logout` (revoking refresh token)
  - POST `/auth/forgot-password` (anti-enumeration)
  - POST `/auth/reset-password` (single-use token verification)
  - POST `/auth/change-password`
  - GET `/auth/me`, PUT `/auth/me`
- **Verification:** Integration tests covering all auth endpoints and security edge cases.

### Task 1.6: Next.js Frontend Foundation & Theme Tokens
- **Files:**
  - `client/src/styles/theme.css` (custom design tokens overriding Bootstrap)
  - `client/src/app/layout.jsx`
  - `client/src/context/AuthContext.jsx`
  - `client/src/services/api.js` (Axios instance with auto-refresh interceptor)
  - `client/src/middleware.js` (Edge route guard with role-based redirects)
  - `client/src/components/layout/Navbar.jsx`, `Sidebar.jsx`, `RoleLayout.jsx`
  - `client/src/app/(auth)/login/page.jsx`
  - `client/src/app/admin/dashboard/page.jsx`
  - `client/src/app/staff/dashboard/page.jsx`
  - `client/src/app/company/dashboard/page.jsx`
- **Deliverables:** Next.js application with role-aware layouts, login page, dashboard landing pages, and session management.
- **Verification:** Build test (`npm run build` or Next.js route tests) and component verification.

---

## 4. Phase 1 Exit Gate Checklist
- [ ] Admin can authenticate and obtain access + refresh cookies.
- [ ] Account lockout kicks in at 5 consecutive invalid attempts with HTTP 423.
- [ ] Refresh token endpoint rotates token and invalidates old token.
- [ ] Reusing an old refresh token revokes all user sessions.
- [ ] Logout revokes refresh token and clears cookies.
- [ ] Role protection middleware prevents unauthorized cross-role access.
