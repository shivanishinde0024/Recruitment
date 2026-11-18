'use client';

import React from 'react';
import RoleLayout from '../../../components/layout/RoleLayout';

export default function StaffDashboardPage() {
  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Recruiter Dashboard</h1>
          <p className="text-muted small mb-0">My assigned requirements, pending submissions, and candidate pipeline</p>
        </div>
        <span className="badge bg-info px-3 py-2 text-white">Staff Portal</span>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Assigned Jobs</div>
            <div className="h2 fw-bold text-primary mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Active requirements</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">My Submissions</div>
            <div className="h2 fw-bold text-success mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Candidates submitted this month</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Pending Verifications</div>
            <div className="h2 fw-bold text-warning mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Company applications to review</div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
