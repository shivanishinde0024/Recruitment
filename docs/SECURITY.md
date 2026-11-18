# Security Policy & Vulnerability Management (SECURITY.md)

## 1. Security Overview

The Recruitment Portal adheres to defense-in-depth principles across transport, authentication, authorization, data validation, and persistent storage layers.

---

## 2. Security Boundaries & Threat Controls

### 2.1 Authentication & Session Management
- **Password Hashing**: Passwords are saved using bcrypt with a work factor of 12.
- **Dual-Token Architecture**: Short-lived JWT access tokens (15-minute lifespan) paired with cryptographically random refresh tokens (7-day lifespan).
- **Token Rotation & Family Revocation**: Each refresh token can only be consumed once. Attempting to replay an already consumed refresh token triggers immediate revocation of the entire token family.
- **Brute Force Protection**: Five consecutive failed login attempts on an account locks the profile for 15 minutes (HTTP 423 Locked).
- **Anti-Enumeration**: Forgot password and login endpoints return uniform responses and generic error messages regardless of whether an email exists in the database.

### 2.2 Access Control & Multi-Tenancy (BOLA / BFLA)
- **Role-Based Access Control (RBAC)**: Role boundaries (`admin`, `staff`, `company`) are validated via cryptographically signed JWT claims on every protected route.
- **Multi-Tenant Boundary Enforcement**: Company accounts are strictly isolated to their own records (`company_id`). Cross-tenant access to another company's profiles, jobs, candidates, or mappings results in HTTP 404 (Not Found) rather than 403, preventing resource enumeration.
- **Candidate Privacy Guard**: Candidate contact details (`email`, `mobile`, `address`) are automatically masked with asterisks when viewed by company users until the candidate's hiring status is confirmed.

### 2.3 Input Validation & Injection Mitigation
- **Schema Validation**: All inbound HTTP request bodies, route parameters, and query parameters are strictly validated using Zod schemas with type coercion and bounds checking.
- **Cross-Site Scripting (XSS)**: Rich text descriptions and responsibilities are sanitized server-side via `sanitize-html`, stripping all unsafe HTML tags, event handlers, and script payloads.
- **Spreadsheet Formula Injection**: All exported CSV and Excel cells starting with dangerous trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are automatically prepended with a single quote `'`.
- **SQL Injection**: All database operations use Prisma ORM parameterized queries; raw SQL queries are strictly prohibited or use parameterized tagged template literals (`Prisma.sql`).

### 2.4 File Upload & Storage Security
- **MIME & Extension Whitelist**: Only authenticated users can upload files. Allowed types are strictly constrained:
  - Resumes: `.pdf`, `.docx`
  - Documents: `.pdf`, `.jpg`, `.jpeg`, `.png`
  - Bulk Archives: `.xlsx`, `.zip`
- **Zip Slip Defense**: Archive extraction paths are verified against target directories to prevent path traversal attacks (`../../etc/passwd`).
- **Private File Streaming**: Files are stored in non-public directories and delivered exclusively via authenticated streaming endpoints that enforce ownership checks.

---

## 3. Vulnerability Reporting & Disclosure

To report a suspected security vulnerability, please contact the development team at `security@recruitment-portal.internal`. Please do not disclose vulnerabilities publicly until an authorized patch has been released.
