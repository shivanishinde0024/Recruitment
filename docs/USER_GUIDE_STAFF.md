# Recruiter Staff Operations Manual (USER_GUIDE_STAFF.md)

Welcome to the Recruitment Portal Recruiter Workspace. This guide outlines how staff members manage candidate pools, execute algorithmic matching, map candidates to active job requisitions, and track candidate progress.

---

## 1. Recruiter Dashboard

- **URL**: `http://localhost:3000/staff/dashboard`
- View your **Assigned Jobs**, pending verifications, active submissions, and successful placements.
- Urgent worklist highlights jobs with approaching submission deadlines (`last_date`).

---

## 2. Candidate Sourcing & Upload

### 2.1 Single Candidate Creation
1. Navigate to **Candidates** (`/admin/candidates` or Staff workspace).
2. Click **+ Add Candidate**.
3. Input full name, primary email, mobile phone, total experience, current location, and skills.
4. Upload resume document (`.pdf` or `.docx`, max 5MB).
5. **Duplicate Prevention**: The system enforces uniqueness on both email and mobile number, rejecting duplicates with HTTP 409 Conflict.

### 2.2 Bulk Candidate Import via Excel + Zip
1. Navigate to **Candidates** > **Bulk Upload** (`/admin/candidates/bulk`).
2. Download the standardized Excel template.
3. Prepare the Excel spreadsheet with candidate records, referencing resume filenames in the designated column.
4. Create a Zip archive containing all referenced resume files.
5. Upload both the Excel file and the Zip file simultaneously.
6. Review the resulting row-by-row status report showing imported candidates and any validation errors.

---

## 3. Algorithmic Candidate Matching

1. Open any assigned job requisition and navigate to **Candidate Matching** (`/admin/jobs/:id/candidates`).
2. The system automatically computes compatibility scores (0 to 100) across the candidate database:
   - **50% Skills**: Match between candidate skills and required job skills.
   - **25% Experience**: Compatibility with job minimum/maximum experience bounds.
   - **15% Location**: City/State match or Remote flexibility.
   - **10% Qualification**: Educational degree level equivalence.
3. Review ranked suggestions with visual match score badges.

---

## 4. Mapping Candidates to Requisitions

1. Select one or more suggested candidates using checkboxes.
2. Click **Map Selected Candidates to Job**.
3. Confirmation dialog confirms submission.
4. **Automated Effects**:
   - Mapped candidates transition to status `submitted`.
   - The job requisition automatically transitions to `in_progress`.
   - In-app and email notifications are dispatched to the employer company.

---

## 5. Candidate Withdrawal Lifecycle

If an error occurs or a candidate becomes unavailable:
1. Open the job candidate mappings list.
2. Locate the candidate in status `submitted`.
3. Click **Withdraw Candidate**.
4. Input mandatory withdrawal remark.
5. **Important Rule**: Once the employer company has reviewed, shortlisted, or scheduled the candidate, withdrawal is blocked (HTTP 422). Staff must contact the employer directly.
