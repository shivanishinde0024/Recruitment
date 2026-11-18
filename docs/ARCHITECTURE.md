# System Architecture Documentation (ARCHITECTURE.md)

## 1. System Overview & Technology Stack

The **Recruitment Portal** is an enterprise-grade recruitment and candidate lifecycle management platform built to orchestrate interactions across Administrators, Recruiter Staff, and Employer Companies.

```mermaid
flowchart TD
    Client["Next.js 14 Web Frontend\n(React 18 + Custom Bootstrap 5 Tokens)"]
    Gateway["Express.js 4 REST API Gateway\n(Port 5000 / Reverse Proxy)"]
    Middleware["Security & Auth Middleware\n(Helmet, CORS, HPP, RateLimit, Dual-Token JWT)"]
    Services["Domain Service Layer\n(Auth, Companies, Jobs, Candidates, Mappings, Reports, Audit)"]
    ORM["Prisma ORM 5 Data Layer"]
    DB[("MySQL 8.0 Database\n(InnoDB, utf8mb4, Row Locking)")]
    Storage["Secure Local Storage / Encrypted Files\n(Resumes, Legal Documents)"]

    Client -->|HTTPS / REST / Cookies| Gateway
    Gateway --> Middleware
    Middleware --> Services
    Services --> ORM
    Services --> Storage
    ORM --> DB
```

### Architectural Principles:
1. **Separation of Concerns**: Stateless Express REST API decoupled from Next.js server/client rendered presentation layer.
2. **Defensive Multi-Tenancy**: Strict BOLA/IDOR enforcement at the database query boundary for all company-scoped resources.
3. **Optimistic & Row-Locking Concurrency**: Atomic position reservation using `SELECT ... FOR UPDATE` row locks inside database transactions to prevent over-hiring race conditions.
4. **Decoupled Dashboard Aggregation**: Separation of aggregate analytical queries from high-throughput OLTP operational tables.
5. **Zero Trust File Handling**: Strict extension whitelisting, Zip slip traversal sanitization, and authenticated streaming endpoints.

---

## 2. Request Lifecycle & Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Client as Next.js Client
    participant API as Express API (/api/v1)
    participant Auth as Auth & Role Guard
    participant Service as Business Domain Service
    participant DB as MySQL 8 (via Prisma)

    User->>Client: Submit Login Credentials
    Client->>API: POST /api/v1/auth/login
    API->>DB: Query User & Check Lockout Status
    DB-->>API: User Record
    API->>API: Verify Password (bcrypt cost 12)
    API->>DB: Issue & Store Refresh Token (Family ID)
    API-->>Client: 200 OK + access_token (15m) + httpOnly refresh_token cookie (7d)
    Client-->>User: Redirect to Role Dashboard

    Note over User, DB: Subsequent Authenticated Requests
    User->>Client: Perform Action (e.g. Map Candidate)
    Client->>API: POST /api/v1/mappings (Bearer JWT)
    API->>Auth: Validate Token Signature & Role (admin / staff)
    Auth->>Service: Execute Domain Logic (Duplicate check, auto-status)
    Service->>DB: Atomic Transaction with Row Locking
    DB-->>Service: Updated State
    Service-->>API: Standardized Response Envelope
    API-->>Client: 201 Created (JSON Envelope)
    Client-->>User: Update UI State
```

---

## 3. Core State Machines

### 3.1 Company Verification Lifecycle
```mermaid
stateDiagram-v2
    [*] --> pending: Self-Registration
    pending --> approved: Admin/Staff Approve
    pending --> need_info: Admin/Staff Request Info
    pending --> rejected: Admin/Staff Reject (Mandatory Remark)
    need_info --> pending: Company Updates Details & Docs
    approved --> suspended: Admin Suspends Account
    suspended --> approved: Admin Reactivates
    approved --> pending: Company Alters Critical Fields (GST / PAN / Name)
    rejected --> [*]
```

### 3.2 Job Requisition Lifecycle
```mermaid
stateDiagram-v2
    [*] --> open: Created by Approved Company / Admin / Staff
    open --> in_progress: First Candidate Mapped
    in_progress --> fulfilled: Confirmed Count == Positions Required (Atomic Lock)
    fulfilled --> in_progress: Positions Increased or Confirmation Withdrawn
    open --> on_hold: Manual Hold
    in_progress --> on_hold: Manual Hold
    on_hold --> open: Resumed
    open --> closed: Requisition Closed / Cancelled
    in_progress --> closed: Requisition Closed
    fulfilled --> closed: Archive / Requisition Complete
    closed --> [*]
```

### 3.3 Candidate Mapping Lifecycle
```mermaid
stateDiagram-v2
    [*] --> submitted: Staff / Admin Maps Candidate to Job
    submitted --> viewed: Company Opens Candidate Profile
    submitted --> shortlisted: Company Shortlists Candidate
    viewed --> shortlisted: Company Shortlists Candidate
    shortlisted --> hold: Company Puts on Hold
    hold --> shortlisted: Re-shortlisted
    shortlisted --> confirmed: Company Hires Candidate (Contact Unmasked)
    submitted --> rejected: Company Rejects Candidate
    shortlisted --> rejected: Company Rejects Candidate
    submitted --> withdrawn: Staff Withdraws (Only allowed before review)
    confirmed --> [*]
    rejected --> [*]
    withdrawn --> [*]
```

---

## 4. Algorithmic Matching Engine

The automated candidate recommendation engine (`server/src/modules/mappings/matching.service.js`) computes candidate compatibility against job requirements on a normalized scale (0 to 100):

| Component | Weight | Calculation Method |
|---|---|---|
| **Skills Matching** | **50%** | Jaccard-weighted overlap between candidate skills and required job skills (`matched_skills / total_required_skills * 50`) |
| **Experience Compatibility** | **25%** | Linear penalty scoring based on deviation from `[experience_min, experience_max]`. Exact range = 25 pts; below/above penalized proportionally |
| **Location Match** | **15%** | City match = 15 pts; State match = 10 pts; Remote/Anywhere = 15 pts |
| **Qualification Match** | **10%** | Degree / Qualification level equivalence match |

---

## 5. Security & Boundary Hardening

1. **Multi-Tenant Scoping**: All queries on company assets enforce `where: { company_id: req.user.company_id }` for company users. Any cross-tenant access returns HTTP 404 (Resource Not Found) to eliminate information disclosure.
2. **Contact Privacy Guard**: Candidate contact details (`email`, `mobile`, `address`) are automatically masked with asterisks when returned to employer users unless the candidate mapping status is `confirmed`.
3. **Anti-Formula Injection**: All CSV and Excel export generators sanitize cell contents beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` by prefixing a single quote `'`.
4. **Zip Slip Traversal Defense**: Zip archives uploaded for bulk candidates validate target extraction paths against canonical base directories, rejecting malicious path traversal tokens (`../`).

