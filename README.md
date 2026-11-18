# Enterprise Recruitment Portal

A modern, multi-tenant corporate recruitment, candidate management, and automated staffing platform. Built with **Next.js 14**, **Bootstrap 5**, **Node.js 20 LTS**, **Express.js**, **Prisma ORM**, and **MySQL 8**.

---

## 🌟 Key Features

- **Multi-Tenant Employer Portals**: Self-registration for corporate employers with GST/PAN verification, legal document uploading, and automated status transition workflows (`pending` -> `need_info` -> `approved` / `rejected`).
- **Concurrency-Safe Job Code Generator**: High-performance, collision-free `JOB-<YYYY>-XXXX` generator backed by serialized process mutexes and transactional unique constraints.
- **Candidate Talent Pool & Search**: Comprehensive candidate profiles with resume attachments, multi-attribute indexing, parameterized search with LIKE fallback, and staff uploader ownership enforcement.
- **Bulk Candidate Ingestion Engine**: Fast batch processing for 200+ row Excel spreadsheets combined with nested Zip archives for automated resume extraction and row-by-row error auditing.
- **Weighted Algorithmic Matching**: Dynamic scoring algorithm prioritizing 50% Skills, 25% Experience, 15% Location, and 10% Qualification to recommend top candidates per requisition.
- **Candidate Contact Masking**: Strict defense-in-depth privacy preserving candidate phone, email, and address from employers until final confirmation for hire.
- **Atomic Position Locking & Auto-Fulfillment**: Row-level locking (`FOR UPDATE`) preventing over-hiring race conditions, with automatic transition to `fulfilled` when quotas are met.
- **Executive & Recruiter Dashboards**: Decoupled SQL aggregates powering Admin Company-Wise hiring health, Recruiter workspaces, Employer portals, and urgent deadline tracking.
- **Anti-Formula Injection Reporting**: On-the-fly CSV and Excel report exports sanitizing dangerous formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **Centralized Audit Logging & Trash Recovery**: Structured before/after mutation snapshots with automatic PII redaction, combined with soft-delete trash and dependency-guarded restoration.
- **Enterprise Security Hardening**: OWASP Top 10 compliance with 15-minute brute-force lockout, refresh token reuse family revocation, IDOR multi-tenant boundary checks, and stored XSS sanitizers.

---

## 🏗️ Architecture & Technology Stack

- **Client**: Next.js 14 (App Router), React 18, Bootstrap 5 (with custom design token variables, avoiding stock styling).
- **Backend API**: Node.js 20 LTS, Express 4 REST API, Zod schema validation, Helmet, CORS, Cookie-Parser, Rate-Limiting.
- **Database & ORM**: MySQL 8.0 with Prisma ORM 5 (and zero-dependency in-memory DB simulator for hermetic testing).
- **Authentication**: JWT access tokens (15m expiry) and refresh tokens (7d expiry) with HTTP-only cookies and automatic reuse detection.
- **Testing**: Jest 29, Supertest 7, covering 15 test suites and 179 automated unit, integration, and E2E flow tests.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- (Optional for production) MySQL 8.0 server or Docker

### Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd "Recruitment Portal"
   ```

2. Install dependencies:
   ```bash
   # Install root and workspace dependencies
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

3. Configure Environment Variables:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env.local
   ```

4. Database Setup (MySQL):
   ```bash
   # Push schema to MySQL database
   npm --prefix server run prisma:db:push
   # Seed default master data and initial admin
   npm --prefix server run seed
   ```

### Running the Application

- **Start API Server** (Port 5000):
  ```bash
  npm run dev:server
  ```

- **Start Web Client** (Port 3000):
  ```bash
  npm run dev:client
  ```

---

## 🧪 Testing & Verification

Execute the complete 15-suite automated regression test suite:

```bash
npm test
```

Test coverage includes:
- **Flows F1 to F14**: Full enterprise end-to-end recruitment lifecycle.
- **OWASP Security Audit (9 Tracks)**: RBAC matrix, IDOR boundaries, injection defenses, file uploads, business logic races, authentication lockout, PII protection.
- **100% Pass Rate**: 179 tests green, 0 failures.

---

## 📚 Project Documentation

- [Architecture Guide](file:///Users/surajkakade/App/Recruitment%20Portal/ARCHITECTURE.md)
- [REST API Reference](file:///Users/surajkakade/App/Recruitment%20Portal/API.md)
- [Production Deployment](file:///Users/surajkakade/App/Recruitment%20Portal/DEPLOYMENT.md)
- [Security & Vulnerability Audit](file:///Users/surajkakade/App/Recruitment%20Portal/docs/SECURITY_REPORT.md)
- [Requirements Traceability Matrix](file:///Users/surajkakade/App/Recruitment%20Portal/docs/TRACEABILITY.md)
- [Architectural Decisions & Rulings](file:///Users/surajkakade/App/Recruitment%20Portal/docs/DECISIONS.md)
- [Administrator User Guide](file:///Users/surajkakade/App/Recruitment%20Portal/USER_GUIDE_ADMIN.md)
- [Recruiter Staff User Guide](file:///Users/surajkakade/App/Recruitment%20Portal/USER_GUIDE_STAFF.md)
- [Employer Client User Guide](file:///Users/surajkakade/App/Recruitment%20Portal/USER_GUIDE_COMPANY.md)

