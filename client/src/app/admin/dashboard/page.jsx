'use client';

import React from 'react';
import RoleLayout from '../../../components/layout/RoleLayout';

export default function AdminDashboardPage() {
  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Administrator Dashboard</h1>
          <p className="text-muted small mb-0">System overview, company-wise hiring orders, and placement health</p>
        </div>
        <span className="badge bg-primary px-3 py-2">Admin Control Center</span>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Open Jobs</div>
            <div className="h2 fw-bold text-primary mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Awaiting candidate fulfillment</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Pending Verifications</div>
            <div className="h2 fw-bold text-warning mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Companies awaiting review</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Total Candidates</div>
            <div className="h2 fw-bold text-success mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Registered in talent pool</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Fulfilled Positions</div>
            <div className="h2 fw-bold text-info mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Total confirmed placements</div>
          </div>
        </div>
      </div>

      <div className="rp-card">
        <h2 className="h5 fw-bold mb-3">Company-Wise Requirements</h2>
        <p className="text-muted small">Loading company requirements and fulfillment metrics...</p>
      </div>
    </RoleLayout>
  );
}
