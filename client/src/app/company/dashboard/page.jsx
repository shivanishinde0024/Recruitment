'use client';

import React from 'react';
import RoleLayout from '../../../components/layout/RoleLayout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const isPending = user?.company?.status === 'pending';
  const isSuspended = user?.company?.status === 'suspended';

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Company Hiring Portal</h1>
          <p className="text-muted small mb-0">Overview of job postings, candidate submissions, and confirmations</p>
        </div>
        <Link href="/company/jobs/new" className={`btn btn-primary ${isPending || isSuspended ? 'disabled' : ''}`}>
          + Post New Requirement
        </Link>
      </div>

      {isPending && (
        <div className="alert alert-warning p-4 mb-4" role="alert">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: '2rem' }}>⏳</span>
            <div>
              <h5 className="alert-heading fw-bold mb-1">Account Verification Pending</h5>
              <p className="mb-2 small">
                Your company registration is currently under review by our compliance team.
                While pending, you can review and update your company profile or uploaded certificates,
                but posting job requirements and candidate reviews will be unlocked once approved.
              </p>
              <Link href="/company/profile" className="btn btn-sm btn-outline-dark fw-semibold">
                View & Edit Company Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="alert alert-danger p-4 mb-4" role="alert">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <div>
              <h5 className="alert-heading fw-bold mb-1">Account Suspended</h5>
              <p className="mb-0 small">
                Your hiring portal access has been temporarily suspended. Please contact portal administrator for assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Open Jobs</div>
            <div className="h2 fw-bold text-primary mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Active hiring requirements</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Candidates Awaiting Review</div>
            <div className="h2 fw-bold text-warning mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Profiles awaiting review</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Confirmed Placements</div>
            <div className="h2 fw-bold text-success mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Hired candidates</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="rp-card mb-0">
            <div className="text-muted small text-uppercase fw-semibold">Fulfilled Jobs</div>
            <div className="h2 fw-bold text-info mt-2 mb-0">--</div>
            <div className="small text-muted mt-1">Successfully closed positions</div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
