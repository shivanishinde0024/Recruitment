# Employer Company User Guide (USER_GUIDE_COMPANY.md)

Welcome to the Recruitment Portal Employer Workspace. This guide assists employer companies with registration, requisition creation, candidate review, and hiring confirmations.

---

## 1. Company Registration & Verification

1. Navigate to `http://localhost:3000/register`.
2. Fill out company name, business email, contact mobile, and tax identification numbers (GST & PAN).
3. Upload verification documents (GST Certificate, PAN Card, Certificate of Incorporation).
4. Submit the registration form.
5. Your account enters **Pending Verification** status. You can log in and update company details, but job posting is disabled until verified by an Administrator.
6. Once approved, you will receive an email confirmation granting full workspace access.

---

## 2. Employer Dashboard

- **URL**: `http://localhost:3000/company/dashboard`
- Summary cards display: Active Requisitions, Candidates Under Review, Shortlisted Candidates, Confirmed Hires.
- Recent activity stream tracks candidate submissions and recruiter actions.

---

## 3. Creating & Managing Job Requisitions

1. Navigate to **Job Requirements** (`/company/jobs`).
2. Click **+ Post New Requirement**.
3. Fill in job title, department, employment type, location, experience range, salary range, and number of positions needed.
4. Add rich text job description and candidate responsibilities.
5. Click **Publish Requirement**.
6. A sequential job code (e.g. `JOB-2026-0001`) is generated automatically.
7. Portal recruiters will begin sourcing and mapping candidates immediately.

---

## 4. Candidate Review Board

1. From **Job Requirements**, click on any active requisition to open the **Candidate Review Board**.
2. Candidates mapped by staff appear in the **Submitted** column.
3. **Contact Privacy Guard**: Candidate contact numbers and email addresses are masked with asterisks to protect privacy during the evaluation phase.
4. Click **View Resume** to review qualifications and experience.
5. Take action on each candidate:
   - **Shortlist**: Moves candidate to shortlisted stage for interview scheduling.
   - **Hold**: Marks candidate on hold for future consideration.
   - **Reject**: Rejects candidate with optional feedback notes.
   - **Confirm Hire**: Hires the candidate for the open position.

---

## 5. Candidate Hiring Confirmation & Auto-Fulfillment

1. When an offer is accepted, click **Confirm Candidate**.
2. A confirmation dialog outlines the position commitment.
3. Upon confirmation:
   - Candidate status transitions to `confirmed`.
   - Candidate contact information (phone number, email address, address) is immediately unmasked.
   - The requisition's remaining open positions count is decremented.
   - **Auto-Fulfillment**: When the number of confirmed candidates reaches the total required positions, the job requisition automatically transitions to **Fulfilled**.

