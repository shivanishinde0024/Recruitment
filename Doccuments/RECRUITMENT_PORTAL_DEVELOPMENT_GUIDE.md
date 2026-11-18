# Recruitment Portal: Complete Development Guide

> **Purpose:** This is the single source of truth for building the Recruitment Portal end to end. It is written so a developer, or an AI coding assistant, can follow it top to bottom and produce a working system. Build in the order given in [Section 19](#19-phase-wise-build-plan-with-acceptance-criteria).

**Stack:** Next.js (React) + Bootstrap 5 · Node.js + Express · MySQL 8 · Prisma ORM · JWT auth

---

## Table of Contents

1. [Product Summary](#1-product-summary)
2. [Tech Stack and Versions](#2-tech-stack-and-versions)
3. [Repository Structure](#3-repository-structure)
4. [Local Setup and Environment](#4-local-setup-and-environment)
5. [Roles and Permission Matrix](#5-roles-and-permission-matrix)
6. [Workflow and State Machines](#6-workflow-and-state-machines)
7. [Database Schema (MySQL)](#7-database-schema-mysql)
8. [Backend Architecture and Conventions](#8-backend-architecture-and-conventions)
9. [Backend Core Code](#9-backend-core-code)
10. [API Specification by Module](#10-api-specification-by-module)
11. [Business Rules (Critical)](#11-business-rules-critical)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Frontend Pages and Components](#13-frontend-pages-and-components)
14. [Dashboards: Data and Queries](#14-dashboards-data-and-queries)
15. [Notifications and Email Templates](#15-notifications-and-email-templates)
16. [Reports, Audit Log, Settings](#16-reports-audit-log-settings)
17. [Security Checklist](#17-security-checklist)
18. [Testing Plan](#18-testing-plan)
19. [Phase-wise Build Plan with Acceptance Criteria](#19-phase-wise-build-plan-with-acceptance-criteria)
20. [Deployment](#20-deployment)
21. [Future Enhancements](#21-future-enhancements)

---

## 1. Product Summary

A multi-role recruitment portal with three roles: **Admin**, **Staff**, **Company**.

1. A **company** registers on the portal (status `pending`).
2. **Admin or Staff** verifies the company (approve, reject, request info, suspend).
3. An approved company logs in and posts **job requirements** (title, description, positions, skills, experience, etc.).
4. **Admin or Staff** sees the requirement, finds or uploads suitable **candidate resumes**, and **maps** candidates to the job.
5. The **company** reviews mapped candidates and marks them **Shortlisted / Confirmed / Rejected / Hold**.
6. When confirmed candidates reach the number of positions, the requirement is auto-marked **Fulfilled**.
7. **Admin** has full control: master data, CRUD on everything, and a **company-wise dashboard** showing new and fulfilled requirements.

---

## 2. Tech Stack and Versions

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js 14+ (App Router), React 18 | UI and routing only |
| UI | Bootstrap 5.3 + `react-bootstrap` | Responsive, no custom CSS framework |
| Forms | `react-hook-form` + `yup` | Validation on client |
| Tables | `@tanstack/react-table` | Server-side pagination |
| Charts | `recharts` | Dashboards |
| Rich text | `react-quill` | Job description |
| HTTP | `axios` | Single instance with interceptors |
| Toasts | `react-toastify` | Feedback |
| Select | `react-select` | Multi-select skills |
| Backend | Node.js 20 LTS + Express 4 | REST API |
| ORM | Prisma 5 | Schema mirrored from SQL (`prisma db pull`) |
| DB | MySQL 8 (InnoDB, utf8mb4) | |
| Auth | `jsonwebtoken`, `bcrypt` | Access + refresh tokens |
| Validation | `zod` or `joi` | Server-side, on every route |
| Upload | `multer` | Disk storage (S3 optional) |
| Email | `nodemailer` | SMTP |
| Excel | `exceljs` (read and write), `adm-zip` (ZIP) | Bulk upload, reports |
| PDF export | `pdfkit` or `puppeteer` | Reports |
| Security | `helmet`, `cors`, `express-rate-limit`, `hpp` | |
| Logging | `winston`, `morgan` | |
| Tests | `jest`, `supertest`, `playwright` | |

---

## 3. Repository Structure

Use a simple monorepo with two apps.

```
recruitment-portal/
├── server/                         # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── sql/
│   │   └── 001_schema.sql          # Authoritative DB schema (Section 7)
│   ├── src/
│   │   ├── config/                 # env.js, db.js (prisma), mail.js, multer.js
│   │   ├── middleware/             # auth.js, role.js, validate.js, upload.js, error.js, audit.js
│   │   ├── modules/
│   │   │   ├── auth/               # routes, controller, service, schema
│   │   │   ├── users/              # staff + admin user management
│   │   │   ├── companies/
│   │   │   ├── jobs/
│   │   │   ├── candidates/
│   │   │   ├── mapping/            # job_candidates
│   │   │   ├── masters/            # generic master CRUD
│   │   │   ├── dashboard/
│   │   │   ├── reports/
│   │   │   ├── notifications/
│   │   │   ├── audit/
│   │   │   └── settings/
│   │   ├── services/               # mail.service.js, notify.service.js, matching.service.js, jobStatus.service.js
│   │   ├── utils/                  # response.js, pagination.js, jobCode.js, ApiError.js, asyncHandler.js
│   │   ├── routes.js               # mounts all module routers under /api/v1
│   │   ├── app.js                  # express app (no listen)
│   │   └── server.js               # listen()
│   ├── uploads/                    # git-ignored; private storage
│   │   ├── resumes/
│   │   ├── company-docs/
│   │   └── logos/
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
└── client/                         # Next.js app
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/page.jsx
    │   │   ├── (auth)/register/page.jsx
    │   │   ├── (auth)/forgot-password/page.jsx
    │   │   ├── (auth)/reset-password/page.jsx
    │   │   ├── admin/...           # see Section 13
    │   │   ├── staff/...
    │   │   ├── company/...
    │   │   ├── layout.jsx
    │   │   └── page.jsx            # redirect by role
    │   ├── components/             # layout/, ui/, tables/, forms/, charts/, modals/
    │   ├── context/AuthContext.jsx
    │   ├── hooks/                  # useAuth, useDebounce, usePagination, useApi
    │   ├── services/               # api.js (axios), auth.service.js, job.service.js ...
    │   ├── utils/                  # constants.js, format.js, roles.js
    │   └── middleware.js           # route protection by role
    ├── next.config.js              # rewrites /api -> backend
    ├── .env.local.example
    └── package.json
```

**Module pattern (backend):** each module has `*.routes.js` (URL + middleware) → `*.controller.js` (HTTP only) → `*.service.js` (business logic + Prisma) → `*.schema.js` (validation). Controllers never touch Prisma directly.

---

## 4. Local Setup and Environment

### 4.1 Prerequisites
Node 20+, MySQL 8, Git.

### 4.2 Backend

```bash
cd server
npm init -y
npm i express cors helmet hpp express-rate-limit cookie-parser morgan winston \
      @prisma/client prisma jsonwebtoken bcrypt zod multer nodemailer dotenv \
      exceljs adm-zip uuid dayjs
npm i -D nodemon jest supertest

# create DB and apply schema
mysql -u root -p -e "CREATE DATABASE recruitment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p recruitment < sql/001_schema.sql

npx prisma init
npx prisma db pull        # generates schema.prisma from the DB
npx prisma generate
node prisma/seed.js       # seeds admin + masters
npm run dev
```

`package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node prisma/seed.js",
    "test": "jest --runInBand"
  }
}
```

### 4.3 `server/.env.example`

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

DATABASE_URL="mysql://root:password@localhost:3306/recruitment"

JWT_ACCESS_SECRET=change_me_access_64_chars_min
JWT_REFRESH_SECRET=change_me_refresh_64_chars_min
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

BCRYPT_ROUNDS=12
MAX_FAILED_LOGINS=5
LOCK_MINUTES=15

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
MAIL_FROM="Recruitment Portal <no-reply@example.com>"

UPLOAD_DIR=./uploads
MAX_RESUME_MB=5
MAX_DOC_MB=5
ALLOWED_RESUME_TYPES=pdf,doc,docx
```

### 4.4 Frontend

```bash
cd client
npx create-next-app@latest . --js --app --src-dir --eslint --no-tailwind
npm i bootstrap react-bootstrap axios react-hook-form yup @hookform/resolvers \
      @tanstack/react-table recharts react-toastify react-select react-quill jose dayjs
```

`client/.env.local.example`:
```env
API_URL=http://localhost:5000
JWT_ACCESS_SECRET=same_value_as_server   # used only by middleware.js to verify role cookie
```

`next.config.js` (proxy API through Next so cookies are same-origin and CORS is avoided):
```js
module.exports = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_URL}/api/:path*` }];
  },
};
```

Import Bootstrap once in `app/layout.jsx`:
```js
import 'bootstrap/dist/css/bootstrap.min.css';
```

---

## 5. Roles and Permission Matrix

| Feature | Admin | Staff | Company |
|---|---|---|---|
| Manage masters (CRUD) | Yes | No (read only) | No (read only for dropdowns) |
| Manage staff users (CRUD) | Yes | No | No |
| Company registration | View / Edit / Delete | View | Self-register |
| Verify / reject / suspend company | Yes | Yes (no delete) | No |
| Job requirements | Add / Edit / Delete | Add / Edit | Own jobs only |
| Assign staff to job | Yes | No | No |
| Candidates (CRUD) | Yes | Add / Edit (own uploads; admin sees all) | No |
| Map candidate to job | Yes | Yes | No |
| View mapped candidates | Yes | Yes | Own jobs only |
| Shortlist / Confirm / Reject / Hold | Yes (override) | No | Yes (own jobs only) |
| Dashboard | Full, company-wise | Own work | Own jobs |
| Reports and export | Full | Limited (own) | Own data |
| Audit logs, settings | Yes | No | No |

**Enforcement is two-layered on the server:**
1. `requireRole('admin','staff')` middleware on the route.
2. **Ownership check** in the service layer. A company user must only reach rows where `jobs.company_id = req.user.companyId`. Never trust IDs from the client.

---

## 6. Workflow and State Machines

```
Company registers (PENDING)
   -> Admin/Staff verifies -> APPROVED / REJECTED / (NEED_INFO) / SUSPENDED
   -> Company posts Job (OPEN)
   -> Admin/Staff assigns staff (optional), finds/uploads resumes
   -> Staff maps candidates (SUBMITTED)
   -> Company acts: VIEWED -> SHORTLISTED -> CONFIRMED | REJECTED | HOLD
   -> confirmed_count >= positions_required -> Job FULFILLED (auto)
```

### 6.1 Company status

| From | To | Who | Notes |
|---|---|---|---|
| `pending` | `approved` | admin, staff | Sends approval email; company can now post jobs |
| `pending` | `rejected` | admin, staff | Remark mandatory |
| `pending` | `need_info` | admin, staff | Remark mandatory; company can edit and resubmit (returns to `pending`) |
| `approved` | `suspended` | admin, staff | Remark mandatory; blocks login to job features |
| `suspended` | `approved` | admin | Re-activate |
| `rejected` | `pending` | admin | Re-open |

Every change inserts a row in `company_verification_logs`.

### 6.2 Job status

| From | To | Who | Notes |
|---|---|---|---|
| `draft` | `open` | company, admin, staff | Notify admin/staff on `open` |
| `open` | `in_progress` | system | Set automatically when first candidate is mapped |
| `open` / `in_progress` | `on_hold` | company, admin | |
| `on_hold` | `open` / `in_progress` | company, admin | Restore to prior state by recomputing |
| any active | `fulfilled` | system | When confirmed >= positions |
| `fulfilled` | `in_progress` | system | If a confirmed candidate is later rejected/withdrawn and confirmed < positions |
| any | `closed` | company, admin | Manual close; no more mapping |

### 6.3 Candidate mapping (`job_candidates`) status

| From | To | Who |
|---|---|---|
| (new) | `submitted` | admin, staff (on mapping) |
| `submitted` | `viewed` | company (auto when opened, or manual) |
| `submitted` / `viewed` | `shortlisted` | company |
| `submitted` / `viewed` / `shortlisted` / `hold` | `confirmed` | company, admin (override) |
| any non-final | `rejected` | company, admin |
| any non-final | `hold` | company |
| `submitted` | (deleted) | admin, staff (withdraw) |

Each transition writes to `job_candidate_history` and triggers a notification.

---

## 7. Database Schema (MySQL)

Save as `server/sql/001_schema.sql`. All tables use InnoDB, `utf8mb4`, soft delete via `deleted_at`.

```sql
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- MASTERS
-- =========================================================
CREATE TABLE industries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_industries_name (name)
) ENGINE=InnoDB;

CREATE TABLE company_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_company_types_name (name)
) ENGINE=InnoDB;

CREATE TABLE job_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_job_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE job_titles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_job_titles_cat (category_id),
  CONSTRAINT fk_job_titles_cat FOREIGN KEY (category_id) REFERENCES job_categories(id)
) ENGINE=InnoDB;

CREATE TABLE skills (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_skills_name (name)
) ENGINE=InnoDB;

CREATE TABLE qualifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_qualifications_name (name)
) ENGINE=InnoDB;

CREATE TABLE employment_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_employment_types_name (name)
) ENGINE=InnoDB;

CREATE TABLE experience_levels (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  min_years DECIMAL(4,1) NULL,
  max_years DECIMAL(4,1) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE candidate_sources (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_candidate_sources_name (name)
) ENGINE=InnoDB;

CREATE TABLE countries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  iso_code VARCHAR(3) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE states (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  country_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_states_country (country_id),
  CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB;

CREATE TABLE cities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  state_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_cities_state (state_id),
  CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states(id)
) ENGINE=InnoDB;

-- =========================================================
-- USERS AND AUTH
-- =========================================================
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  mobile VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','staff','company') NOT NULL,
  status ENUM('active','inactive','blocked') NOT NULL DEFAULT 'active',
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  last_login DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role, status)
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rt_user (user_id),
  UNIQUE KEY uq_rt_hash (token_hash),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE password_resets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pr_hash (token_hash),
  KEY idx_pr_user (user_id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Optional: configurable staff permissions
CREATE TABLE permissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,          -- e.g. 'candidate.delete'
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE user_permissions (
  user_id BIGINT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, permission_id),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_up_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- COMPANIES
-- =========================================================
CREATE TABLE companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  industry_id INT UNSIGNED NULL,
  company_type_id INT UNSIGNED NULL,
  gst_no VARCHAR(20) NULL,
  pan_no VARCHAR(15) NULL,
  cin_no VARCHAR(25) NULL,
  registration_year YEAR NULL,
  company_size ENUM('1-10','11-50','51-200','201-500','501-1000','1000+') NULL,
  website VARCHAR(255) NULL,
  address TEXT NULL,
  country_id INT UNSIGNED NULL,
  state_id INT UNSIGNED NULL,
  city_id INT UNSIGNED NULL,
  pincode VARCHAR(12) NULL,
  contact_person VARCHAR(150) NOT NULL,
  contact_designation VARCHAR(100) NULL,
  contact_email VARCHAR(190) NOT NULL,
  contact_mobile VARCHAR(20) NOT NULL,
  logo_path VARCHAR(255) NULL,
  status ENUM('pending','approved','rejected','need_info','suspended') NOT NULL DEFAULT 'pending',
  verified_by BIGINT UNSIGNED NULL,
  verified_at DATETIME NULL,
  remark TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_companies_user (user_id),
  KEY idx_companies_status (status),
  KEY idx_companies_name (company_name),
  CONSTRAINT fk_companies_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_companies_industry FOREIGN KEY (industry_id) REFERENCES industries(id),
  CONSTRAINT fk_companies_ctype FOREIGN KEY (company_type_id) REFERENCES company_types(id),
  CONSTRAINT fk_companies_verifier FOREIGN KEY (verified_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE company_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  doc_type ENUM('gst','pan','incorporation','other') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NULL,
  size_bytes INT UNSIGNED NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_cd_company (company_id),
  CONSTRAINT fk_cd_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE company_verification_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(20) NULL,
  new_status VARCHAR(20) NOT NULL,
  remark TEXT NULL,
  done_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cvl_company (company_id),
  CONSTRAINT fk_cvl_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_cvl_user FOREIGN KEY (done_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- JOBS
-- =========================================================
CREATE TABLE jobs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_code VARCHAR(20) NOT NULL,                    -- JOB-2026-0001
  company_id BIGINT UNSIGNED NOT NULL,
  title_id INT UNSIGNED NULL,
  custom_title VARCHAR(200) NULL,                   -- if not in master
  category_id INT UNSIGNED NULL,
  department VARCHAR(120) NULL,
  description LONGTEXT NULL,
  responsibilities LONGTEXT NULL,
  qualification_id INT UNSIGNED NULL,
  exp_min DECIMAL(4,1) NOT NULL DEFAULT 0,
  exp_max DECIMAL(4,1) NULL,
  salary_min DECIMAL(12,2) NULL,
  salary_max DECIMAL(12,2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  employment_type_id INT UNSIGNED NULL,
  work_mode ENUM('onsite','remote','hybrid') NOT NULL DEFAULT 'onsite',
  city_id INT UNSIGNED NULL,
  notice_period_pref VARCHAR(50) NULL,
  gender_pref ENUM('any','male','female') NOT NULL DEFAULT 'any',
  positions_required INT UNSIGNED NOT NULL DEFAULT 1,
  last_date DATE NULL,
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  status ENUM('draft','open','in_progress','fulfilled','on_hold','closed') NOT NULL DEFAULT 'open',
  jd_file_path VARCHAR(255) NULL,
  assigned_staff_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  fulfilled_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  UNIQUE KEY uq_jobs_code (job_code),
  KEY idx_jobs_company (company_id),
  KEY idx_jobs_status (status),
  KEY idx_jobs_staff (assigned_staff_id),
  KEY idx_jobs_last_date (last_date),
  CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_jobs_title FOREIGN KEY (title_id) REFERENCES job_titles(id),
  CONSTRAINT fk_jobs_category FOREIGN KEY (category_id) REFERENCES job_categories(id),
  CONSTRAINT fk_jobs_qual FOREIGN KEY (qualification_id) REFERENCES qualifications(id),
  CONSTRAINT fk_jobs_emptype FOREIGN KEY (employment_type_id) REFERENCES employment_types(id),
  CONSTRAINT fk_jobs_city FOREIGN KEY (city_id) REFERENCES cities(id),
  CONSTRAINT fk_jobs_staff FOREIGN KEY (assigned_staff_id) REFERENCES users(id),
  CONSTRAINT fk_jobs_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE job_skills (
  job_id BIGINT UNSIGNED NOT NULL,
  skill_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (job_id, skill_id),
  CONSTRAINT fk_js_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_js_skill FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB;

-- =========================================================
-- CANDIDATES
-- =========================================================
CREATE TABLE candidates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  alt_mobile VARCHAR(20) NULL,
  gender ENUM('male','female','other') NULL,
  dob DATE NULL,
  current_location VARCHAR(150) NULL,
  preferred_location VARCHAR(150) NULL,
  total_experience DECIMAL(4,1) NOT NULL DEFAULT 0,
  current_ctc DECIMAL(12,2) NULL,
  expected_ctc DECIMAL(12,2) NULL,
  notice_period_days INT NULL,
  education VARCHAR(255) NULL,
  qualification_id INT UNSIGNED NULL,
  current_company VARCHAR(200) NULL,
  current_designation VARCHAR(150) NULL,
  summary TEXT NULL,
  resume_path VARCHAR(255) NOT NULL,
  resume_original_name VARCHAR(255) NULL,
  photo_path VARCHAR(255) NULL,
  source_id INT UNSIGNED NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  KEY idx_cand_email (email),
  KEY idx_cand_mobile (mobile),
  KEY idx_cand_exp (total_experience),
  FULLTEXT KEY ft_cand_search (name, current_designation, current_company, education, summary),
  CONSTRAINT fk_cand_source FOREIGN KEY (source_id) REFERENCES candidate_sources(id),
  CONSTRAINT fk_cand_qual FOREIGN KEY (qualification_id) REFERENCES qualifications(id),
  CONSTRAINT fk_cand_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE candidate_skills (
  candidate_id BIGINT UNSIGNED NOT NULL,
  skill_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (candidate_id, skill_id),
  CONSTRAINT fk_cs_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_skill FOREIGN KEY (skill_id) REFERENCES skills(id)
) ENGINE=InnoDB;

-- =========================================================
-- MAPPING (candidate submitted to a job)
-- =========================================================
CREATE TABLE job_candidates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  candidate_id BIGINT UNSIGNED NOT NULL,
  submitted_by BIGINT UNSIGNED NOT NULL,
  match_score TINYINT UNSIGNED NULL,
  submission_note TEXT NULL,                -- visible to company
  internal_note TEXT NULL,                  -- admin/staff only
  status ENUM('submitted','viewed','shortlisted','confirmed','rejected','hold') NOT NULL DEFAULT 'submitted',
  company_remark TEXT NULL,
  acted_at DATETIME NULL,
  joining_date DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_candidate (job_id, candidate_id),
  KEY idx_jc_status (status),
  KEY idx_jc_candidate (candidate_id),
  CONSTRAINT fk_jc_job FOREIGN KEY (job_id) REFERENCES jobs(id),
  CONSTRAINT fk_jc_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  CONSTRAINT fk_jc_user FOREIGN KEY (submitted_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE job_candidate_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_candidate_id BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(20) NULL,
  new_status VARCHAR(20) NOT NULL,
  remark TEXT NULL,
  changed_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_jch_jc (job_candidate_id),
  CONSTRAINT fk_jch_jc FOREIGN KEY (job_candidate_id) REFERENCES job_candidates(id) ON DELETE CASCADE,
  CONSTRAINT fk_jch_user FOREIGN KEY (changed_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- =========================================================
-- SYSTEM
-- =========================================================
CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL,                -- company_registered, job_posted, candidate_submitted ...
  ref_type VARCHAR(30) NULL,                -- company | job | job_candidate
  ref_id BIGINT UNSIGNED NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_user (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action ENUM('create','update','delete','status_change','login','logout','export') NOT NULL,
  module VARCHAR(40) NOT NULL,
  record_id BIGINT UNSIGNED NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_module (module, record_id),
  KEY idx_audit_user (user_id),
  KEY idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE email_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  subject VARCHAR(200) NOT NULL,
  body_html MEDIUMTEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE settings (
  `key` VARCHAR(80) PRIMARY KEY,
  `value` TEXT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
```

### 7.1 Seed data (`prisma/seed.js` must create)

- 1 admin user: `admin@portal.com` / strong temp password (force change on first login).
- Masters: industries (IT, Manufacturing, Finance, Healthcare, Retail...), company types (Pvt Ltd, LLP, Public Ltd, Startup, Proprietorship), job categories, 30+ skills, qualifications (Diploma, B.Tech, B.E., B.Sc, BCA, MCA, MBA, M.Tech...), employment types (Full-time, Contract, Internship, Part-time), candidate sources (Portal, Referral, LinkedIn, Naukri, Walk-in), experience levels, countries/states/cities (at least India).
- `settings`: `auto_approve_company=false`, `hide_candidate_contact_until_confirmed=true`, `max_resume_mb=5`, `site_name`.
- `email_templates`: see [Section 15](#15-notifications-and-email-templates).

---

## 8. Backend Architecture and Conventions

### 8.1 Base URL and versioning
`/api/v1/...`

### 8.2 Standard response envelope

Success:
```json
{ "success": true, "message": "Job created", "data": { }, "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```
Error:
```json
{ "success": false, "message": "Validation failed", "errors": [ { "field": "email", "message": "Invalid email" } ] }
```

### 8.3 HTTP status usage
`200` OK · `201` created · `400` validation · `401` not authenticated · `403` forbidden · `404` not found · `409` conflict (duplicate) · `422` business rule violation · `429` rate limit · `500` server error.

### 8.4 Pagination, search, sort (all list endpoints)

Query params: `page` (default 1), `limit` (default 10, max 100), `search`, `sortBy`, `sortOrder` (`asc|desc`), plus module-specific filters. Always return `meta`.

### 8.5 Soft delete rule
Never hard delete business data. Set `deleted_at = NOW()`. Every query must filter `deleted_at: null` (use a Prisma middleware or helper). Admin may have a "Trash/Restore" view for companies, jobs, candidates.

### 8.6 File uploads
- Resumes: `pdf, doc, docx`, max `MAX_RESUME_MB`. Docs: `pdf, jpg, png`. Logos: `jpg, png, webp`.
- Store under `uploads/<type>/<yyyy>/<mm>/<uuid>.<ext>`. Never use the original filename on disk. Save the original name in DB.
- Validate **extension and MIME type**.
- Files are **not** served statically. Serve through an authenticated endpoint `GET /api/v1/files/:type/:id` that checks permissions (see [Section 11](#11-business-rules-critical)).

### 8.7 Transactions
Use `prisma.$transaction` for: company registration (user + company + documents + log), mapping candidates, status change plus history plus auto-fulfil, bulk upload batches.

### 8.8 Audit
An `audit()` helper is called from services on create, update, delete and status_change. It stores old and new JSON (strip `password_hash` and tokens).

---

## 9. Backend Core Code

### 9.1 `src/app.js`

```js
const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(hpp());
app.use(morgan('combined'));

app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);
module.exports = app;
```

### 9.2 `src/utils/ApiError.js`, `asyncHandler.js`, `response.js`

```js
// ApiError.js
class ApiError extends Error {
  constructor(status, message, errors) { super(message); this.status = status; this.errors = errors; }
}
module.exports = ApiError;

// asyncHandler.js
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// response.js
exports.ok = (res, data, message = 'OK', meta) => res.json({ success: true, message, data, meta });
exports.created = (res, data, message = 'Created') => res.status(201).json({ success: true, message, data });
```

### 9.3 `src/middleware/auth.js` (verify access token from httpOnly cookie or Bearer header)

```js
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token || (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'Not authenticated');
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET); // { sub, role }
    const user = await prisma.users.findFirst({
      where: { id: BigInt(payload.sub), deleted_at: null, status: 'active' },
    });
    if (!user) throw new ApiError(401, 'Account inactive');
    let companyId = null;
    if (user.role === 'company') {
      const c = await prisma.companies.findFirst({ where: { user_id: user.id, deleted_at: null } });
      companyId = c?.id ?? null;
      req.company = c;
    }
    req.user = { id: user.id, role: user.role, name: user.name, email: user.email, companyId };
    next();
  } catch (e) {
    next(e.status ? e : new ApiError(401, 'Invalid or expired token'));
  }
};

exports.requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'Forbidden'));

// company must be approved to use job features
exports.requireApprovedCompany = (req, res, next) =>
  req.company?.status === 'approved' ? next() : next(new ApiError(403, 'Company is not approved yet'));
```

> Prisma returns `BigInt` for `BIGINT` columns. Add once at startup:
> `BigInt.prototype.toJSON = function () { return Number(this); };`

### 9.4 Login logic (`auth.service.js`) outline

```js
async function login({ email, password }, meta) {
  const user = await prisma.users.findFirst({ where: { email, deleted_at: null } });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (user.locked_until && user.locked_until > new Date()) throw new ApiError(423, 'Account locked. Try later.');
  if (user.status !== 'active') throw new ApiError(403, 'Account disabled');

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const attempts = user.failed_attempts + 1;
    await prisma.users.update({
      where: { id: user.id },
      data: {
        failed_attempts: attempts,
        locked_until: attempts >= MAX ? dayjs().add(LOCK_MIN, 'minute').toDate() : null,
      },
    });
    throw new ApiError(401, 'Invalid credentials');
  }
  await prisma.users.update({ where: { id: user.id }, data: { failed_attempts: 0, locked_until: null, last_login: new Date() } });

  const accessToken = jwt.sign({ sub: String(user.id), role: user.role }, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
  const refreshRaw = crypto.randomBytes(48).toString('hex');
  await prisma.refresh_tokens.create({ data: {
    user_id: user.id, token_hash: sha256(refreshRaw),
    expires_at: dayjs().add(7, 'day').toDate(), ip: meta.ip, user_agent: meta.ua } });
  return { user, accessToken, refreshRaw };
}
```

Cookies (set in controller):
```js
res.cookie('access_token', accessToken, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 15 * 60 * 1000, path: '/' });
res.cookie('refresh_token', refreshRaw, { httpOnly: true, secure: isProd, sameSite: 'lax', maxAge: 7 * 864e5, path: '/api/v1/auth' });
```

`/auth/refresh`: look up `sha256(cookie)`, verify not revoked/expired, **rotate** (revoke old, issue new pair).
`/auth/logout`: revoke refresh token, clear both cookies.

### 9.5 Upload middleware (`middleware/upload.js`)

```js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const dayjs = require('dayjs');

const ALLOWED = {
  resume: { ext: ['.pdf', '.doc', '.docx'], maxMb: +process.env.MAX_RESUME_MB || 5 },
  doc:    { ext: ['.pdf', '.jpg', '.jpeg', '.png'], maxMb: +process.env.MAX_DOC_MB || 5 },
  logo:   { ext: ['.jpg', '.jpeg', '.png', '.webp'], maxMb: 2 },
};

exports.uploader = (kind) => multer({
  limits: { fileSize: ALLOWED[kind].maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ALLOWED[kind].ext.includes(ext) ? cb(null, true) : cb(new Error('File type not allowed'));
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.env.UPLOAD_DIR, `${kind}s`, dayjs().format('YYYY/MM'));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname).toLowerCase()),
  }),
});
```

### 9.6 Job code generator (`utils/jobCode.js`)

```js
// JOB-<year>-<4 digit running number>, generated inside a transaction
async function nextJobCode(tx) {
  const year = new Date().getFullYear();
  const last = await tx.jobs.findFirst({ where: { job_code: { startsWith: `JOB-${year}-` } }, orderBy: { id: 'desc' } });
  const n = last ? parseInt(last.job_code.split('-')[2], 10) + 1 : 1;
  return `JOB-${year}-${String(n).padStart(4, '0')}`;
}
module.exports = { nextJobCode };
```

### 9.7 Auto job status (`services/jobStatus.service.js`) - core rule

```js
// call inside the same transaction after any job_candidates change
async function recomputeJobStatus(tx, jobId, actorId) {
  const job = await tx.jobs.findUnique({ where: { id: jobId } });
  if (!job || ['closed', 'draft', 'on_hold'].includes(job.status)) return job;

  const confirmed = await tx.job_candidates.count({ where: { job_id: jobId, status: 'confirmed' } });
  const mapped    = await tx.job_candidates.count({ where: { job_id: jobId, status: { not: 'rejected' } } });

  let next = job.status;
  if (confirmed >= job.positions_required) next = 'fulfilled';
  else if (mapped > 0) next = 'in_progress';
  else next = 'open';

  if (next !== job.status) {
    await tx.jobs.update({ where: { id: jobId },
      data: { status: next, fulfilled_at: next === 'fulfilled' ? new Date() : null } });
    // notify + audit (status_change)
  }
  return { ...job, status: next };
}
module.exports = { recomputeJobStatus };
```

### 9.8 Candidate to job match score (`services/matching.service.js`)

Weighted score, 0 to 100:

| Factor | Weight | Rule |
|---|---|---|
| Skills overlap | 50 | `matched_skills / job_skills * 50` |
| Experience fit | 25 | 25 if within `[exp_min, exp_max]`; reduce 5 points per year outside; floor 0 |
| Location | 15 | 15 if candidate current or preferred city matches job city (or job is remote) |
| Qualification | 10 | 10 if candidate qualification equals job qualification |

```js
function score(job, cand) {
  const js = new Set(job.skillIds), cs = new Set(cand.skillIds);
  const skills = js.size ? ([...js].filter(s => cs.has(s)).length / js.size) * 50 : 25;

  const e = Number(cand.total_experience);
  const min = Number(job.exp_min), max = job.exp_max != null ? Number(job.exp_max) : min + 5;
  const diff = e < min ? min - e : e > max ? e - max : 0;
  const exp = Math.max(0, 25 - diff * 5);

  const loc = job.work_mode === 'remote' || sameCity(job, cand) ? 15 : 0;
  const qual = job.qualification_id && job.qualification_id === cand.qualification_id ? 10 : 0;
  return Math.round(skills + exp + loc + qual);
}
```
`GET /jobs/:id/suggested-candidates` fetches candidates not already mapped to the job, scores them, returns the top 50 sorted by score.

---

## 10. API Specification by Module

All routes below are under `/api/v1`. Auth column: **P** = public, **A** = admin, **S** = staff, **C** = company (own data only).

### 10.1 Auth

| Method | Path | Auth | Body / Notes |
|---|---|---|---|
| POST | `/auth/register-company` | P | multipart: user fields + company fields + `gst_doc`, `pan_doc`, `incorporation_doc`, `logo`. Creates `users` (role=company), `companies` (status=pending), documents, log entry, notifies admin/staff. If setting `auto_approve_company=true`, set approved. |
| POST | `/auth/login` | P | `{ email, password }` → sets cookies, returns `{ user: {id,name,role,companyStatus} }` |
| POST | `/auth/refresh` | P | uses refresh cookie, rotates tokens |
| POST | `/auth/logout` | any | revokes refresh token |
| POST | `/auth/forgot-password` | P | `{ email }`. Always returns 200 (no user enumeration). Emails a reset link valid 30 minutes. |
| POST | `/auth/reset-password` | P | `{ token, password }` |
| POST | `/auth/change-password` | any | `{ currentPassword, newPassword }` |
| GET | `/auth/me` | any | current user + company status |
| PUT | `/auth/me` | any | update own name and mobile |

Password policy: min 8 chars, at least 1 upper, 1 lower, 1 digit.

### 10.2 Companies

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/companies` | A, S | List. Filters: `status`, `industryId`, `cityId`, `from`, `to`, `search` |
| GET | `/companies/:id` | A, S, C(own) | Detail incl. documents and verification logs |
| PUT | `/companies/:id` | A, C(own) | Update profile. If a company edits key fields (name, GST, PAN) while approved, set a `reverify` flag or notify staff (configurable) |
| PATCH | `/companies/:id/verify` | A, S | `{ action: 'approve'|'reject'|'need_info'|'suspend'|'reactivate', remark }`. Remark required except approve. Writes log, emails company. |
| POST | `/companies/:id/documents` | C(own), A | Add or replace document |
| DELETE | `/companies/:id` | A | Soft delete (also disables the user) |
| POST | `/companies/:id/restore` | A | Restore from trash |
| GET | `/companies/:id/documents/:docId/download` | A, S, C(own) | Authenticated file stream |
| POST | `/companies` | A | Admin creates a company directly (creates user with temp password and emails it) |

### 10.3 Jobs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/jobs` | A, S, C(own) | Filters: `companyId`, `status`, `priority`, `categoryId`, `assignedStaffId`, `from`, `to`, `unassigned=true`, `overdue=true`, `search` |
| POST | `/jobs` | A, S, C(approved) | Company: `companyId` is forced from token. Admin/staff must pass `companyId`. Generates `job_code`. Notifies admin/staff. |
| GET | `/jobs/:id` | A, S, C(own) | Detail incl. skills and counts (see 10.3.1) |
| PUT | `/jobs/:id` | A, S, C(own) | Cannot edit when status `closed`. Reducing `positions_required` below current confirmed count is rejected (422). |
| DELETE | `/jobs/:id` | A | Soft delete |
| PATCH | `/jobs/:id/status` | A, C(own) | `{ status: 'open'|'on_hold'|'closed', remark }`. `fulfilled` and `in_progress` are system-set only. |
| PATCH | `/jobs/:id/assign-staff` | A | `{ staffId }` (must be an active staff user). Notifies that staff member. |
| GET | `/jobs/:id/suggested-candidates` | A, S | Scored list (see 9.8) |

**10.3.1 Job detail counts (computed, not stored):**
```
positions_required, submitted_count (mapped, not rejected),
confirmed_count, pending_count (submitted+viewed+shortlisted+hold),
rejected_count, remaining = max(positions_required - confirmed_count, 0)
```

Job create/update body:
```json
{
  "companyId": 12,
  "titleId": 5, "customTitle": null, "categoryId": 2, "department": "Engineering",
  "description": "<p>...</p>", "responsibilities": "<ul>...</ul>",
  "skillIds": [1, 4, 9], "qualificationId": 3,
  "expMin": 2, "expMax": 5, "salaryMin": 600000, "salaryMax": 1200000, "currency": "INR",
  "employmentTypeId": 1, "workMode": "hybrid", "cityId": 40,
  "noticePeriodPref": "30 days", "genderPref": "any",
  "positionsRequired": 3, "lastDate": "2026-12-31", "priority": "high",
  "status": "open"
}
```
Sanitise `description` and `responsibilities` HTML (e.g. `sanitize-html`) before saving.

### 10.4 Candidates

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/candidates` | A, S | Filters: `search` (FULLTEXT), `skillIds[]`, `expMin`, `expMax`, `location`, `ctcMax`, `sourceId`, `uploadedBy`, `from`, `to` |
| POST | `/candidates` | A, S | multipart: fields + `resume` (required) + optional `photo`. Duplicate check on email OR mobile → 409 with the existing candidate's id (UI offers "use existing") |
| GET | `/candidates/:id` | A, S | Detail incl. history of jobs they were submitted to |
| PUT | `/candidates/:id` | A, S(own uploads) | Replace resume optional |
| DELETE | `/candidates/:id` | A | Soft delete. Blocked (422) if the candidate has an active `confirmed` mapping |
| POST | `/candidates/bulk-upload` | A, S | multipart: `sheet` (xlsx) + `resumes` (zip). See 10.4.1 |
| GET | `/candidates/bulk-upload/template` | A, S | Download the Excel template |
| GET | `/candidates/:id/resume` | A, S, C(see rule) | Authenticated resume download/stream |

**10.4.1 Bulk upload spec**
- Excel columns: `name, email, mobile, gender, experience_years, current_ctc, expected_ctc, notice_days, location, education, skills (comma separated), current_company, current_designation, resume_file_name`.
- `resume_file_name` must match a file inside the ZIP.
- Process row by row in a try/catch. Return a report: `{ total, created, skipped_duplicates, failed: [{ row, reason }] }`. Do not fail the whole batch on one bad row.
- Unknown skills: create automatically in `skills` (admin can clean later) or reject per a setting. Default: auto-create.
- Limit: 200 rows per upload.

### 10.5 Mapping (job_candidates)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/jobs/:id/candidates` | A, S | `{ candidates: [{ candidateId, submissionNote, internalNote }] }`. Per candidate: skip if already mapped (return in `skipped`), compute `match_score`, insert, history row `submitted`. Then `recomputeJobStatus`. Notify company once (batched message: "N new candidates submitted"). Rejects if job status is `closed`, `fulfilled`, `draft`, or `on_hold`, or company not approved. |
| GET | `/jobs/:id/candidates` | A, S, C(own job) | Filters: `status`. Company response omits `internal_note`. Contact details masked per setting (see Section 11). |
| GET | `/job-candidates/:id` | A, S, C(own) | Detail + history |
| PATCH | `/job-candidates/:id/status` | C(own), A | `{ status: 'viewed'|'shortlisted'|'confirmed'|'rejected'|'hold', remark, joiningDate? }`. Validate transition (6.3). Remark mandatory for `rejected`. Insert history, notify staff and the submitter, `recomputeJobStatus`. |
| DELETE | `/job-candidates/:id` | A, S | Withdraw. Only if status = `submitted`. Admin can withdraw at any status. |
| GET | `/candidates/:id/submissions` | A, S | Where this candidate was submitted and outcomes |

**Confirm race condition:** inside the transaction, lock the job row (`SELECT ... FOR UPDATE` via `$queryRaw`) before counting confirmed. If `confirmed >= positions_required` already, reject further confirms with 422 "All positions are filled" (admin can override by increasing positions).

### 10.6 Masters (generic)

`/masters/:type` where `type` ∈ `industries | company-types | job-categories | job-titles | skills | qualifications | employment-types | experience-levels | candidate-sources | countries | states | cities`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/masters/:type` | any logged in | `?search=&page=&limit=&isActive=&parentId=` Dropdowns use `?limit=500&isActive=true` |
| GET | `/masters/:type/:id` | A | |
| POST | `/masters/:type` | A | `{ name, isActive, parentId? }` (parent = `country_id` for states, `state_id` for cities, `category_id` for job titles) |
| PUT | `/masters/:type/:id` | A | |
| PATCH | `/masters/:type/:id/toggle` | A | Activate / deactivate |
| DELETE | `/masters/:type/:id` | A | Soft delete. Block with 422 if in use by active records |

Implement with a **config map** (type → prisma model, parent field, unique field) so one controller serves all masters.

### 10.7 Users (admin and staff management)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users` | A | `?role=staff|admin&status=&search=` |
| POST | `/users` | A | `{ name, email, mobile, role: 'staff'|'admin', password? }` (auto-generate and email if no password) |
| PUT | `/users/:id` | A | |
| PATCH | `/users/:id/status` | A | active / inactive / blocked. Cannot deactivate yourself or the last active admin |
| POST | `/users/:id/reset-password` | A | Sends reset link |
| DELETE | `/users/:id` | A | Soft delete. Reassign their open jobs first (422 if they still have assigned open jobs, or auto-unassign) |

### 10.8 Dashboard

| Method | Path | Auth |
|---|---|---|
| GET | `/dashboard/admin` | A |
| GET | `/dashboard/staff` | S |
| GET | `/dashboard/company` | C |
| GET | `/dashboard/admin/company/:id` | A (drill-down) |

Details in [Section 14](#14-dashboards-data-and-queries).

### 10.9 Reports

| Method | Path | Auth |
|---|---|---|
| GET | `/reports/company-wise` | A |
| GET | `/reports/staff-performance` | A, S(own) |
| GET | `/reports/pipeline` | A, S |
| GET | `/reports/time-to-fill` | A |
| GET | `/reports/export?report=<name>&format=xlsx|csv|pdf&...filters` | A, S(limited) |

All accept `from`, `to`, `companyId`, `staffId`.

### 10.10 Notifications, Audit, Settings, Files

| Method | Path | Auth |
|---|---|---|
| GET | `/notifications?unread=true` | any |
| GET | `/notifications/unread-count` | any |
| PATCH | `/notifications/:id/read` | any |
| PATCH | `/notifications/read-all` | any |
| GET | `/audit-logs?module=&userId=&action=&from=&to=` | A |
| GET | `/settings` | A |
| PUT | `/settings` | A |
| GET | `/files/...` | per file rules |

---

## 11. Business Rules (Critical)

Implement and test every rule. Each is a likely bug source.

**Company**
1. A company user can log in while `pending`, but sees only a **"Verification pending"** screen plus profile edit and document upload. Job and candidate features need `approved`.
2. `rejected`, `suspended`: login allowed but shows the status and remark with a contact message. No job features.
3. Reject, need_info and suspend require a non-empty remark.
4. Email, GST and PAN must be unique across non-deleted companies (validate format: GST 15 chars, PAN 10 chars).

**Jobs**
5. Only an `approved` company can create jobs.
6. `positions_required >= 1`. `exp_max >= exp_min`. `salary_max >= salary_min`. `last_date` not in the past on create.
7. `fulfilled` is set only by the system. Confirm count `>=` positions triggers it. If a confirmed candidate is later rejected by admin/company or withdrawn, recompute (may revert to `in_progress`).
8. A `closed` job accepts no mapping or status changes except reopen by admin.
9. Staff can create and edit jobs on behalf of a company, but only admin can delete or assign staff.
10. A job past `last_date` and not fulfilled is flagged **overdue** (computed in queries, not stored).

**Candidates and mapping**
11. A candidate can be mapped to many jobs but only once per job (DB unique key plus app check).
12. A candidate already `confirmed` for one company job can still be submitted elsewhere, but show a warning badge "Confirmed elsewhere" to staff.
13. Company sees only mappings for its own jobs. Always filter by `jobs.company_id = req.user.companyId` via join. Return 404, not 403, for other companies' records.
14. `internal_note` is never sent to company users (strip in serializer).
15. Contact privacy (setting `hide_candidate_contact_until_confirmed`, default true): for a company, hide candidate `email`, `mobile`, `alt_mobile` unless mapping status is `confirmed`. Resume files may contain contact details, so for the strict mode serve a PDF as-is and document this limitation, or generate a masked copy later.
16. Resume download by a company is allowed only if the candidate is mapped to one of its jobs.
17. Withdraw is allowed for staff only while status is `submitted`.

**Users**
18. At least one active admin must always exist.
19. Staff can only edit candidates they uploaded (admin edits all). Staff can see all candidates for matching purposes.

**Audit**
20. Log every create, update, delete, status change, login, and export.

---

## 12. Frontend Architecture

### 12.1 Auth and route protection

- API sets httpOnly `access_token`. The Next.js `middleware.js` verifies it with `jose` and enforces role prefixes.

```js
// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const PUBLIC = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('access_token')?.value;
  let role = null;
  if (token) { try { role = (await jwtVerify(token, secret)).payload.role; } catch {} }

  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return role ? NextResponse.redirect(new URL(`/${role}/dashboard`, req.url)) : NextResponse.next();
  }
  if (!role) return NextResponse.redirect(new URL('/login', req.url));

  const area = pathname.split('/')[1];                // admin | staff | company
  if (['admin', 'staff', 'company'].includes(area) && area !== role)
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)'] };
```

> Note: the access token expires in 15 minutes. The axios interceptor must call `/auth/refresh` on `401` and retry. If the cookie has already expired, middleware would redirect to login. To avoid that, either set the access cookie lifetime equal to the refresh lifetime (JWT `exp` inside still limits validity and the API returns 401 → refresh) and have middleware accept expired-but-well-signed tokens for **routing only** (use `jwtVerify(..., { clockTolerance: '7d' })`). The API remains the true security boundary.

### 12.2 Axios instance (`services/api.js`)

```js
import axios from 'axios';
const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

let refreshing = null;
api.interceptors.response.use(r => r, async (err) => {
  const orig = err.config;
  if (err.response?.status === 401 && !orig._retry && !orig.url.includes('/auth/')) {
    orig._retry = true;
    refreshing = refreshing || api.post('/auth/refresh').finally(() => (refreshing = null));
    try { await refreshing; return api(orig); }
    catch { if (typeof window !== 'undefined') window.location.href = '/login'; }
  }
  return Promise.reject(err);
});
export default api;
```

### 12.3 `AuthContext`
Holds `user`, `loading`, `login()`, `logout()`, `refreshMe()`. Loads `/auth/me` on mount. Expose `useAuth()`.

### 12.4 UI conventions
- Layout: fixed Bootstrap sidebar (collapsible on mobile via `Offcanvas`) + top navbar with notification bell and user menu.
- Sidebar items are defined per role in `utils/roles.js`.
- Reusable `DataTable` (server-side pagination, sort, search, filters, row actions).
- `StatusBadge` maps status → Bootstrap color (`pending`=warning, `approved`/`confirmed`/`fulfilled`=success, `rejected`=danger, `suspended`/`on_hold`/`hold`=secondary, `open`=primary, `in_progress`=info, `closed`=dark, `submitted`=primary, `viewed`=info, `shortlisted`=warning).
- `ConfirmModal` for all deletes. `react-toastify` for every success/error.
- Every form: `react-hook-form` + `yup`, show field errors from API `errors[]`.
- Loading skeleton/spinner on every data fetch. Empty states with helpful text.
- Rich-text editor loaded with `next/dynamic` (`ssr: false`).

---

## 13. Frontend Pages and Components

### 13.1 Public

| Route | Contents |
|---|---|
| `/login` | Email + password, forgot link, register link. Redirect by role. |
| `/register` | Multi-step company registration: (1) Account (name, email, mobile, password) (2) Company (name, industry, type, GST/PAN/CIN, size, year, website) (3) Address (country → state → city cascade, pincode) (4) Contact person (5) Documents (GST, PAN, incorporation, logo) + review + submit. |
| `/forgot-password`, `/reset-password?token=` | Standard. |

### 13.2 Admin (`/admin/...`)

| Route | Contents |
|---|---|
| `dashboard` | Section 14 |
| `companies` | Table with filters; row actions: view, edit, verify, delete. Pending tab highlighted. |
| `companies/[id]` | Tabs: Profile · Documents (preview/download) · Jobs · Verification history. Verify action bar (Approve / Reject / Need info / Suspend with remark modal). |
| `companies/new`, `companies/[id]/edit` | Forms |
| `jobs` | All jobs, filters (company, status, priority, staff, overdue, unassigned). Assign-staff action. |
| `jobs/new`, `jobs/[id]/edit` | Full job form (company selector for admin) |
| `jobs/[id]` | Job detail, stats (required / submitted / confirmed / remaining), **Candidates tab** (mapped list with statuses, override actions), **Suggested** tab (scored list with "Map" multi-select), history timeline |
| `candidates` | Search, filters, table, add, bulk upload, delete |
| `candidates/new`, `candidates/[id]`, `candidates/[id]/edit` | Form with resume upload, skill multi-select, duplicate warning; detail with resume viewer and submission history |
| `candidates/bulk-upload` | Template download, sheet + zip upload, result report |
| `staff` | Staff CRUD, status toggle, reset password |
| `masters/[type]` | One generic page for all masters: table, add/edit modal, toggle, delete |
| `reports` | Report picker, filters, preview table + charts, export buttons |
| `audit-logs` | Filterable table with JSON diff viewer |
| `settings` | General, email (SMTP test button), uploads, toggles |
| `trash` | Restore deleted companies / jobs / candidates |
| `profile` | Own profile + change password |

### 13.3 Staff (`/staff/...`)
`dashboard`, `companies` (list + verify, no delete), `jobs` (all or assigned filter, add/edit), `jobs/[id]` (mapping UI as above), `candidates` (+ new, bulk upload), `reports` (own), `profile`.

### 13.4 Company (`/company/...`)

| Route | Contents |
|---|---|
| `dashboard` | Section 14. If not approved: status banner and limited view. |
| `profile` | View/edit profile and documents |
| `jobs` | Own jobs table with counts and status |
| `jobs/new`, `jobs/[id]/edit` | Job form (companyId hidden) |
| `jobs/[id]` | Job info + stats + **Candidates** list |
| `jobs/[id]/candidates` | Card/table view: name, experience, skills, expected CTC, notice, match, submission note. Resume viewer (iframe/PDF). Action buttons: Shortlist, Confirm (optional joining date), Hold, Reject (remark required). Opening a candidate auto-marks `viewed`. |
| `candidates` | All candidates across own jobs, filter by status |
| `notifications`, `change-password` | |

### 13.5 Shared components
`Sidebar`, `Topbar`, `NotificationBell`, `DataTable`, `FilterBar`, `StatusBadge`, `ConfirmModal`, `RemarkModal`, `FileUpload`, `ResumeViewer`, `SkillSelect`, `LocationCascade`, `StatCard`, `Timeline`, `EmptyState`, `PageHeader`, `RichTextEditor`, `ChartCard`.

---

## 14. Dashboards: Data and Queries

### 14.1 Admin dashboard response

```json
{
  "cards": {
    "totalCompanies": 120, "pendingVerification": 8, "openRequirements": 34,
    "fulfilledRequirements": 90, "totalCandidates": 2400, "confirmedThisMonth": 17,
    "unassignedJobs": 5, "overdueJobs": 3
  },
  "companyWise": [
    { "companyId": 1, "company": "Acme Pvt Ltd", "openJobs": 4, "totalPositions": 12,
      "submitted": 20, "confirmed": 7, "pending": 9, "remaining": 5,
      "fulfilmentPct": 58, "lastActivity": "2026-11-15T10:20:00Z" }
  ],
  "charts": {
    "jobsByStatus": [ { "status": "open", "count": 20 } ],
    "monthlyNewVsFulfilled": [ { "month": "2026-10", "new": 14, "fulfilled": 9 } ],
    "topCompanies": [ { "company": "Acme", "confirmed": 7 } ],
    "staffPerformance": [ { "staff": "Riya", "submitted": 30, "confirmed": 9 } ]
  },
  "lists": {
    "newRequirements": [], "pendingCompanies": [], "urgentOrOverdue": []
  }
}
```
Filters: `from`, `to`, `companyId`, `staffId`, `status`, `categoryId`.

**UI:** cards row → company-wise table (progress bar for fulfilment %, click → drill-down page showing that company's jobs with required vs filled and candidate lists) → charts (status donut, monthly bar, top companies bar, staff performance bar) → three lists with quick actions (assign, verify).

### 14.2 Key SQL (company-wise table)

```sql
SELECT c.id AS company_id, c.company_name,
  COUNT(DISTINCT CASE WHEN j.status IN ('open','in_progress') THEN j.id END) AS open_jobs,
  COALESCE(SUM(j.positions_required),0) AS total_positions,
  COUNT(CASE WHEN jc.status <> 'rejected' THEN jc.id END) AS submitted,
  COUNT(CASE WHEN jc.status = 'confirmed' THEN jc.id END) AS confirmed,
  COUNT(CASE WHEN jc.status IN ('submitted','viewed','shortlisted','hold') THEN jc.id END) AS pending,
  GREATEST(MAX(j.updated_at), MAX(jc.updated_at)) AS last_activity
FROM companies c
LEFT JOIN jobs j ON j.company_id = c.id AND j.deleted_at IS NULL
LEFT JOIN job_candidates jc ON jc.job_id = j.id
WHERE c.deleted_at IS NULL AND c.status = 'approved'
GROUP BY c.id, c.company_name
ORDER BY last_activity DESC;
```
> Because `total_positions` is summed across the join with candidates it can be inflated. Compute it in a separate subquery (`SELECT company_id, SUM(positions_required) FROM jobs GROUP BY company_id`) and join, or use `SUM` over a de-duplicated derived table. Write a test with known data to confirm.

Fulfilment % = `LEAST(confirmed / total_positions * 100, 100)`.

### 14.3 Staff dashboard
`pendingVerifications`, `myAssignedJobs` (open), `jobsNeedingCandidates` (assigned, confirmed < positions, 0 or few mapped), `mySubmissions`, `myConfirmed`, `conversionPct`, recent activity.

### 14.4 Company dashboard
Cards: open requirements, fulfilled, total positions, filled positions, candidates awaiting review (`submitted`+`viewed`), shortlisted, confirmed. Lists: jobs needing action, latest candidates received. Chart: per-job positions vs confirmed.

---

## 15. Notifications and Email Templates

### 15.1 `notify.service.js`

```js
async function notify({ userIds, type, title, message, refType, refId, email }) {
  await prisma.notifications.createMany({ data: userIds.map(id => ({ user_id: id, type, title, message, ref_type: refType, ref_id: refId })) });
  if (email) queueEmail(email); // fire-and-forget; log failures, never fail the request
}
```
Frontend: poll `/notifications/unread-count` every 30 to 60 s (WebSocket/SSE optional later).

### 15.2 Trigger table

| Event | Recipients | In-app | Email |
|---|---|---|---|
| Company registered | all admin + staff | Yes | Yes (admin) |
| Company approved / rejected / need_info / suspended | the company user | Yes | Yes |
| New job posted | all admin + assigned staff (if any) | Yes | Yes |
| Staff assigned to job | that staff | Yes | Yes |
| Candidates submitted | company user | Yes | Yes |
| Candidate viewed / shortlisted | submitter staff | Yes | No |
| Candidate confirmed / rejected / hold | submitter staff + admin | Yes | Yes (confirmed/rejected) |
| Job fulfilled | company + admin + assigned staff | Yes | Yes |
| Job nearing `last_date` (2 days) and not fulfilled | assigned staff + admin | Yes | Yes (daily cron) |
| Password reset | user | No | Yes |

### 15.3 Email template codes (seed in `email_templates`)
`company_registered_admin`, `company_registration_received`, `company_approved`, `company_rejected`, `company_need_info`, `company_suspended`, `job_posted_admin`, `job_assigned_staff`, `candidates_submitted`, `candidate_confirmed`, `candidate_rejected`, `job_fulfilled`, `job_deadline_reminder`, `password_reset`, `staff_welcome`.

Placeholders: `{{name}}`, `{{company}}`, `{{jobTitle}}`, `{{jobCode}}`, `{{remark}}`, `{{count}}`, `{{link}}`. Admin can edit templates in the Masters module.

### 15.4 Cron jobs (`node-cron`)
- Daily 09:00: deadline reminders.
- Daily 02:00: delete expired `password_resets` and `refresh_tokens`.

---

## 16. Reports, Audit Log, Settings

### 16.1 Reports

| Report | Columns |
|---|---|
| Company-wise requirements | Company, total jobs, open, fulfilled, positions, confirmed, fulfilment % |
| Staff performance | Staff, jobs assigned, submissions, shortlisted, confirmed, conversion % (confirmed / submissions) |
| Candidate pipeline | Job, company, submitted, viewed, shortlisted, confirmed, rejected, hold |
| Time to fill | Job, company, created_at, fulfilled_at, days |
| Candidate sources | Source, candidates added, confirmed |

Export: `xlsx` via `exceljs`, `csv` manual, `pdf` via `pdfkit`. Stream the file. Log `export` in audit.

### 16.2 Audit log UI
Filters: user, module, action, date range. Row expands to show old vs new JSON diff.

### 16.3 Settings (admin)
`site_name`, `logo`, SMTP (with "send test email"), `max_resume_mb`, `allowed_resume_types`, `auto_approve_company`, `hide_candidate_contact_until_confirmed`, `deadline_reminder_days`.

---

## 17. Security Checklist

- [ ] bcrypt (cost 12), password policy, lockout after repeated failures
- [ ] Short-lived access token, rotating refresh token stored **hashed**
- [ ] httpOnly + Secure + SameSite cookies; Next rewrites keep everything same-origin
- [ ] CSRF: SameSite=Lax plus reject state-changing requests without `Content-Type: application/json` or multipart and with a mismatching `Origin` header
- [ ] `requireRole` on **every** route; ownership check on **every** company-scoped query
- [ ] Return 404 (not 403) for other companies' records
- [ ] Zod/Joi validation on body, query and params for every endpoint; reject unknown fields
- [ ] Prisma parameterised queries; `$queryRaw` only with tagged templates
- [ ] Sanitise rich text (`sanitize-html`); escape output; Helmet headers
- [ ] File uploads: extension + MIME check, size limits, random filenames, outside web root, authenticated download, optional ClamAV scan
- [ ] Rate limits on login, register, forgot-password
- [ ] No user enumeration on forgot-password and login errors
- [ ] Never log passwords, tokens, or full candidate PII
- [ ] Secrets only in env; `.env` git-ignored
- [ ] CORS limited to `CLIENT_URL`
- [ ] Audit log for sensitive actions
- [ ] DB backups (daily) and restore drill
- [ ] Candidate data privacy: retention policy, delete on request (hard delete script for admin), consent text on upload
- [ ] HTTPS everywhere in production

---

## 18. Testing Plan

### 18.1 Backend (Jest + Supertest, separate test DB)
- Auth: register, login, wrong password lockout, refresh rotation, reset flow.
- RBAC matrix: for each route, assert allowed and denied roles.
- Ownership: company A cannot read, update or act on company B's jobs, mappings, resumes (expect 404).
- Company verification transitions and mandatory remarks.
- Job rules: validations, positions reduce guard, auto status `open → in_progress → fulfilled → in_progress`.
- Mapping: duplicate prevention, closed-job rejection, batch skip report, race test: two confirms at once for the last position (only one succeeds).
- Candidate duplicate check, bulk upload report, soft delete guard.
- Dashboard numbers against a seeded dataset.

### 18.2 Frontend (Playwright E2E)
1. Company registers → admin approves → company logs in.
2. Company posts a job → staff gets notification → staff uploads a candidate → maps it.
3. Company confirms → job shows fulfilled → admin dashboard shows updated company-wise numbers.
4. Role guards: visiting another role's URL redirects.

### 18.3 Manual UAT checklist
Mobile responsiveness, large file rejection, wrong file type, empty states, slow network, session expiry mid-action.

---

## 19. Phase-wise Build Plan with Acceptance Criteria

Follow in order. Do not start a phase until the previous one's acceptance criteria pass.

### Phase 1: Foundation and Auth (1.5 to 2 weeks)
- [ ] Monorepo, ESLint/Prettier, Git hooks, `.env.example`
- [ ] Run `001_schema.sql`, Prisma pull, seed admin + masters
- [ ] Express app skeleton, error handler, response helpers, logger
- [ ] Auth module (login, refresh, logout, me, forgot/reset, change password)
- [ ] Next.js app, Bootstrap layout (sidebar/topbar per role), `AuthContext`, axios, `middleware.js`

**Accept when:** admin can log in, is redirected to `/admin/dashboard`, refresh works after the access token expires, other-role URLs redirect, logout clears cookies.

### Phase 2: Masters and User Management (1 to 1.5 weeks)
- [ ] Generic masters CRUD API + generic `/admin/masters/[type]` page
- [ ] Cascading location dropdowns (country → state → city)
- [ ] Staff/admin user CRUD, status toggle, reset password, welcome email
- [ ] Reusable `DataTable`, `FilterBar`, `ConfirmModal`, `StatusBadge`

**Accept when:** all masters can be added, edited, toggled, soft-deleted; delete is blocked when in use; staff can be created and can log in.

### Phase 3: Company Registration and Verification (1.5 weeks)
- [ ] Multi-step registration with uploads
- [ ] Company pending screen, profile edit
- [ ] Admin/staff company list, detail, document preview, verify actions with remarks, verification log
- [ ] Emails and notifications for all status changes
- [ ] Notification bell and list

**Accept when:** full register → approve/reject flow works with emails; remark rules enforced; company features blocked until approved.

### Phase 4: Job Requirements (1.5 weeks)
- [ ] Job CRUD (company own, admin/staff for any), job code generation
- [ ] Skills multi-select, rich text, JD attachment
- [ ] Filters, assign staff, status changes (open/hold/close)
- [ ] Computed counts in job detail and list
- [ ] New-job notifications

**Accept when:** company posts a job and admin/staff are notified; validations in Section 11 pass; company cannot see other companies' jobs.

### Phase 5: Candidates (1.5 to 2 weeks)
- [ ] Candidate CRUD with resume upload, duplicate detection
- [ ] Search and filters (FULLTEXT, skills, experience, CTC)
- [ ] Authenticated resume streaming and preview
- [ ] Bulk upload (xlsx + zip) with result report and template download

**Accept when:** staff can add a candidate in under a minute, duplicates are flagged, bulk upload of 100 rows produces an accurate report.

### Phase 6: Mapping and Company Review (1.5 weeks)
- [ ] Suggested candidates with match score
- [ ] Map one or many, skip duplicates, notes, withdraw
- [ ] Company candidate review UI with all actions and remarks
- [ ] Status history timeline, auto job status (`recomputeJobStatus`), race-safe confirm
- [ ] Contact masking setting

**Accept when:** end-to-end flow works; job auto-fulfils when confirmed = positions; internal notes never reach company; two simultaneous confirms cannot exceed positions.

### Phase 7: Dashboards, Notifications, Reports (2 weeks)
- [ ] Admin dashboard with company-wise table, drill-down, charts, lists, filters
- [ ] Staff and company dashboards
- [ ] Reports with Excel/CSV/PDF export
- [ ] Deadline reminder cron

**Accept when:** dashboard numbers match a manually verified seeded dataset; exports open correctly.

### Phase 8: Audit, Hardening, Release (1.5 to 2 weeks)
- [ ] Audit log middleware and UI, trash/restore
- [ ] Settings page, SMTP test
- [ ] Security checklist (Section 17) complete
- [ ] Automated tests (Section 18) passing, UAT, performance check (indexes, `EXPLAIN` on heavy queries)
- [ ] Deployment, backups, monitoring

**Accept when:** all checklists are ticked and UAT is signed off.

---

## 20. Deployment

**Recommended topology**
```
Browser → Nginx (HTTPS) ─┬─> Next.js (PM2 or Docker, port 3000)
                         └─> /api → Express (PM2 or Docker, port 5000) → MySQL
                                        └─> /uploads (private volume or S3)
```

- Use the same parent domain for web and API (or Nginx reverse proxy) so cookies work.
- Production env: `NODE_ENV=production`, secure cookies, strong JWT secrets.
- Run with PM2 (`pm2 start src/server.js -i max`) or Docker Compose (`web`, `api`, `db`).
- Migrations: keep SQL files versioned (`002_...sql`) and apply in CI/CD; run `prisma db pull && prisma generate` after.
- Back up MySQL daily (mysqldump + off-site) and back up the uploads volume.
- Logs to files with rotation; add uptime monitoring and error tracking (e.g. Sentry).
- CI (GitHub Actions): lint → test → build → deploy.

---

## 21. Future Enhancements

- Resume parsing (auto-fill candidate fields) and AI-based match scoring
- Interview scheduling with calendar integration; statuses `interview_scheduled`, `offered`, `joined`
- Offer letter generation and joining tracker
- Billing and invoicing per placement
- Candidate self-service portal
- WhatsApp / SMS alerts, and a mobile app
- Real-time notifications (WebSocket / SSE)
- Multi-tenant staff teams and per-staff permission editor (uses `permissions` and `user_permissions` tables already in the schema)

---

*End of document.*
