# REST API Specification (API.md)

Interactive Swagger UI documentation is available at `/api/docs` in non-production environments. The underlying OpenAPI 3.0 specification is available at `/api/docs/openapi.json`.

---

## 1. Protocol & Response Envelopes

### Base URL
All API v1 endpoints are served relative to:
```
http://localhost:5000/api/v1
```

### Standard Success Envelope (`ApiResponse`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

### Standard Error Envelope (`ApiError`)
```json
{
  "success": false,
  "error": "ResourceNotFound",
  "message": "Requested entity not found",
  "details": [
    { "field": "email", "message": "Invalid email address format" }
  ]
}
```

### HTTP Status Codes
| Code | Meaning | Usage |
|---|---|---|
| `200 OK` | Success | Successful retrieval, modification, or deletion |
| `201 Created` | Created | Successful entity creation |
| `400 Bad Request` | Validation Error | Malformed body, missing fields, schema validation failure |
| `401 Unauthorized` | Auth Failure | Missing token, expired session, invalid credentials |
| `403 Forbidden` | RBAC Access Denied | Insufficient role permissions |
| `404 Not Found` | Not Found | Entity does not exist or cross-tenant boundary isolation |
| `409 Conflict` | Conflict | Duplicate record (e.g. candidate email/mobile conflict) |
| `422 Unprocessable` | Business Rule Violation | Invalid state transition, position reduction below confirmed |
| `423 Locked` | Security Lockout | Account locked due to 5 consecutive failed logins |
| `500 Server Error` | Internal Failure | Unexpected internal system error |

---

## 2. Authentication & Session Endpoints (`/api/v1/auth`)

### `POST /auth/login`
Authenticates user credentials.
- **Access**: Public
- **Body**: `{ "email": "admin@portal.com", "password": "Password@123" }`
- **Response**: Returns user object and short-lived JWT `access_token` (15m), and sets httpOnly `refresh_token` cookie (7d).
- **Security**: 5 consecutive failures triggers HTTP 423 account lockout for 15 minutes.

### `POST /auth/register-company`
Self-service registration for employer companies with multipart legal documents.
- **Access**: Public
- **Form Fields**: `name`, `email`, `password`, `mobile`, `contact_person`, `contact_email`, `contact_mobile`, `gst_no`, `pan_no`
- **Files**: `doc_gst`, `doc_pan`, `doc_incorporation`, `logo`

### `POST /auth/refresh`
Rotates refresh token and issues fresh access token.
- **Access**: Public (Cookie-authenticated)
- **Security**: Detects replay of rotated tokens and revokes entire family.

### `POST /auth/logout`
Revokes active refresh token and clears auth cookies.

### `GET /auth/me`
Retrieves currently authenticated user profile and permissions.

### `POST /auth/forgot-password`
Initiates password reset email.
- **Anti-Enumeration**: Always returns HTTP 200 regardless of whether the email exists.

### `POST /auth/reset-password`
Consumes single-use reset token to establish new password.

---

## 3. Masters Management (`/api/v1/masters`)

### `GET /masters/:type`
Retrieves active master items for dropdowns and filters.
- **Access**: All authenticated roles (`admin`, `staff`, `company`)
- **Supported Types**: `departments`, `designations`, `skills`, `qualifications`, `job-types`, `salary-ranges`, `experience-ranges`, `industries`, `interview-modes`, `countries`, `states`, `cities`.

### `POST /masters/:type`
Creates a master entity. (Admin only)

### `PUT /masters/:type/:id`
Updates a master entity. (Admin only)

### `DELETE /masters/:type/:id`
Soft-deletes a master entity.
- **Guard**: Returns HTTP 422 if the master record is currently referenced by any active candidate or job requisition.

---

## 4. Companies Management (`/api/v1/companies`)

### `GET /companies`
Lists registered companies with status filtering. (Admin, Staff)

### `GET /companies/:id`
Retrieves company detail. Multi-tenant scoped for company users.

### `PATCH /companies/:id/verify`
Transitions verification status. (Admin, Staff)
- **Body**: `{ "action": "approved" | "rejected" | "need_info" | "suspended", "remarks": "Mandatory remark" }`

### `GET /companies/:id/documents/:docType`
Securely streams uploaded company verification document.

---

## 5. Job Requisitions (`/api/v1/jobs`)

### `GET /jobs`
Lists job requisitions with status, department, and company filters.

### `POST /jobs`
Creates a new job requisition. (Approved Company, Admin, Staff)
- **Features**: Generates sequential `job_code` (`JOB-YYYY-NNNN`), validates experience/salary bounds, and sanitizes rich text description.

### `PATCH /jobs/:id/assign-staff`
Assigns staff recruiter to job requisition. (Admin only)

### `GET /jobs/:id/suggested-candidates`
Returns top 50 algorithmically matched candidates scored 0 to 100.

---

## 6. Candidates Management (`/api/v1/candidates`)

### `GET /candidates`
Search candidate pool via FULLTEXT search on resume text or name/skills with pagination.

### `POST /candidates`
Single candidate profile creation with PDF/DOCX resume file upload.
- **Conflict**: Returns HTTP 409 if candidate email or mobile already exists.

### `POST /candidates/bulk-upload`
Uploads Excel spreadsheet + Zip archive of resumes. Returns detailed row-by-row status report.

### `GET /candidates/:id/resume`
Streams candidate resume file. Restricted to Admin, Staff, and Companies with mapped candidate.

---

## 7. Candidate Mappings (`/api/v1/mappings`)

### `POST /mappings`
Maps single or multiple candidates to a job requisition. (Admin, Staff)
- **Side Effect**: Automatically transitions job status to `in_progress` and dispatches notification.

### `PATCH /mappings/:id/review`
Updates candidate review status on company board. (Company user)
- **Actions**: `viewed`, `shortlisted`, `confirmed`, `rejected`, `hold`
- **Race Protection**: Concurrency row lock (`FOR UPDATE`) on candidate confirmation. Auto-transitions job to `fulfilled` once confirmed count reaches required positions. Unmasks candidate contact info.

### `PATCH /mappings/:id/withdraw`
Recruiter withdraws submitted candidate.
- **Guard**: Returns HTTP 422 once company has reviewed the candidate.

---

## 8. Analytics & Reports (`/api/v1/reports`)

### `GET /reports/admin-company-wise`
Returns decoupled analytical metrics grouped by company. (Admin, Staff)

### `GET /reports/export?format=csv|xlsx`
Streams safe CSV/Excel export report with anti-formula injection sanitization.

---

## 9. Audit Logs, Trash & System Settings

### `GET /audit-logs`
Lists immutable audit logs with before/after state diffs. (Admin only)

### `GET /trash`
Lists soft-deleted entities across companies, jobs, and candidates. (Admin only)

### `PATCH /trash/:module/:id/restore`
Restores soft-deleted entity.
- **Guard**: Returns HTTP 422 if restoring a job whose parent company is in trash.

### `GET /settings` & `PUT /settings`
Reads and updates platform policies, branding, and SMTP configuration. (Admin only)

### `POST /settings/test-email`
Sends live test probe email to verify SMTP configuration. (Admin only)

