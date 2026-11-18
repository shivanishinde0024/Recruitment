# Administrator Operational Guide (USER_GUIDE_ADMIN.md)

Welcome to the Recruitment Portal Administrator Console. This guide covers daily management workflows, verification processes, audit controls, and platform maintenance.

---

## 1. Accessing the Admin Console

- **URL**: `http://localhost:3000/login`
- **Default Credentials**: `admin@portal.com` / `Password@123`
- **Console Dashboard**: `http://localhost:3000/admin/dashboard`

```
+------------------------------------------------------------------------------------+
|  RECRUITMENT PORTAL (ADMIN)                       [Search...]  [Admin User (v)]    |
+------------------------------------------------------------------------------------+
|  [Dashboard] [Companies] [Jobs] [Candidates] [Masters] [Staff] [Audit] [Trash]     |
+------------------------------------------------------------------------------------+
```

---

## 2. Managing Company Verifications

When an employer registers, they enter a `pending` state until verified by an Administrator or Staff member.

1. Navigate to **Companies** (`/admin/companies`).
2. Filter the table by status **Pending**.
3. Click **Review** on the company record to view their profile, GST, PAN, and certificate documents.
4. Select one of the following actions:
   - **Approve**: Activates the employer account, allowing them to post jobs.
   - **Need Info**: Prompts the employer with mandatory remarks to correct specific fields or re-upload documents.
   - **Reject**: Rejects the application with mandatory feedback.
   - **Suspend**: Temporarily revokes job posting and hiring permissions for an active company.
5. All verification actions are permanently recorded in the immutable `company_verification_logs` table.

---

## 3. Provisioning Staff & User Accounts

1. Navigate to **Staff Management** (`/admin/staff`).
2. Click **+ Add Staff Member**.
3. Fill in name, email, and mobile number.
4. An auto-generated temporary password is created and emailed to the staff member.
5. **Account Protections**:
   - The system prevents an Administrator from deactivating or deleting their own account.
   - The system blocks deleting or deactivating the last active Administrator account.

---

## 4. Requisition Oversight & Staff Assignment

1. Navigate to **Jobs** (`/admin/jobs`).
2. Search and inspect all open, in-progress, and fulfilled requisitions.
3. Click **Assign Staff** to assign an unassigned requisition to a designated recruiter.
4. Track confirmed placements against the requisition's required positions.
5. The system prevents reducing positions below the number of already confirmed candidates.

---

## 5. Executive Analytics & Data Exports

1. Open the **Executive Dashboard** (`/admin/dashboard`).
2. View key KPI cards: Total Companies, Active Jobs, Total Candidates, Confirmed Placements.
3. Review the **Company-Wise Recruitment Pipeline** table.
4. Click **Drill Down** on any company to inspect that company's individual job requisitions and candidate statuses.
5. Navigate to **Reports** (`/admin/reports`) to download sanitized CSV or Excel spreadsheets.

---

## 6. Audit Trail & Diff Viewer

1. Navigate to **Audit Logs** (`/admin/audit`).
2. Filter by actor, action type (`create`, `update`, `status_change`, `login`, `export`), or date range.
3. Click **Inspect Diff** on any entry to view side-by-side JSON before/after state diffs.
4. Passwords and sensitive PII are automatically redacted.

---

## 7. Trash & Recovery Management

1. Navigate to **Trash Directory** (`/admin/trash`).
2. View soft-deleted Companies, Jobs, and Candidates.
3. Click **Restore** to un-delete a record.
4. **Dependency Rule**: The system blocks restoring a job requisition if its parent company is currently in trash (HTTP 422).
5. Click **Permanent Delete** to permanently remove an archived record from the database.

---

## 8. Platform Settings & SMTP Verification

1. Navigate to **Settings** (`/admin/settings`).
2. Configure platform name, support contact, and branding tokens.
3. Configure outbound SMTP host, port, authentication, and sender address.
4. Click **Send Test Email** to send a live probe message to verify connectivity.

