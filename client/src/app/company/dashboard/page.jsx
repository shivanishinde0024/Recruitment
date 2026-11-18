'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import RoleLayout from '../../../components/layout/RoleLayout';
import api from '../../../services/api';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function CompanyDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompanyDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reports/company-dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employer dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyDashboard();
  }, [fetchCompanyDashboard]);

  if (loading) {
    return (
      <RoleLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <div className="text-muted small mt-2">Loading employer dashboard...</div>
        </div>
      </RoleLayout>
    );
  }

  const metrics = data?.metrics || {};
  const activeJobs = data?.active_jobs || [];

  return (
    <RoleLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Employer Hiring Command Center</h1>
          <p className="text-muted small mb-0">
            Monitor open requisitions, review matched talent, and confirm candidate placements
          </p>
        </div>
        <Link href="/company/jobs/create" className="btn btn-primary btn-sm px-3">
          + Post New Requisition
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Pending Reviews Alert */}
      {(metrics.pending_review_candidates || 0) > 0 && (
        <div className="alert alert-warning d-flex justify-content-between align-items-center mb-4">
          <div>
            <strong>Action Needed:</strong> You have <strong>{metrics.pending_review_candidates}</strong> candidate(s) awaiting review across your requisitions.
          </div>
          <Link href="/company/jobs" className="btn btn-warning btn-sm fw-semibold">
            Review Candidate Submissions →
          </Link>
        </div>
      )}

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Active Requisitions</span>
            <div className="h2 fw-bold text-dark mt-2 mb-0">
              {(metrics.open_jobs || 0) + (metrics.in_progress_jobs || 0)}
            </div>
            <div className="text-muted extra-small mt-1">{metrics.total_jobs || 0} total lifetime</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Positions Target</span>
            <div className="h2 fw-bold text-primary mt-2 mb-0">{metrics.total_positions || 0}</div>
            <div className="text-muted extra-small mt-1">Open hiring capacity</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Confirmed Placements</span>
            <div className="h2 fw-bold text-success mt-2 mb-0">{metrics.confirmed_positions || 0}</div>
            <div className="text-muted extra-small mt-1">Offers finalized</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Hiring Fulfillment</span>
            <div className="h2 fw-bold text-info mt-2 mb-0">{metrics.fulfillment_rate || 0}%</div>
            <div className="progress mt-2" style={{ height: '6px' }}>
              <div
                className="progress-bar bg-info"
                style={{ width: `${metrics.fulfillment_rate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Jobs Grid */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0 text-dark">Active Requisitions & Candidate Pipelines</h5>
          <Link href="/company/jobs" className="btn btn-link btn-sm text-decoration-none">
            View All Jobs →
          </Link>
        </div>

        <div className="card-body p-4">
          {activeJobs.length === 0 ? (
            <div className="text-center py-5 border rounded bg-light">
              <p className="text-muted mb-3">You currently have no active hiring requisitions.</p>
              <Link href="/company/jobs/create" className="btn btn-primary btn-sm">
                + Post Your First Requisition
              </Link>
            </div>
          ) : (
            <div className="row g-3">
              {activeJobs.map((j) => {
                const percent = j.positions_required > 0
                  ? Math.min(100, Math.round((j.confirmed_count / j.positions_required) * 100))
                  : 0;

                return (
                  <div key={j.id} className="col-12 col-lg-6">
                    <div className="card border h-100 p-3 bg-white shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-secondary font-monospace extra-small me-2">
                            {j.job_code}
                          </span>
                          <h6 className="fw-bold d-inline text-dark">{j.title}</h6>
                        </div>
                        <StatusBadge status={j.status} />
                      </div>

                      <div className="text-muted small mb-3">
                        Target: <strong>{j.positions_required}</strong> positions &bull; Confirmed: <strong>{j.confirmed_count}</strong> &bull; Submissions: <strong>{j.submitted_count}</strong>
                      </div>

                      {/* Fulfillment progress */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between extra-small text-muted mb-1">
                          <span>Fulfillment</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${percent === 100 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                        <span className="extra-small text-muted">
                          <strong>{j.remaining_count}</strong> spot(s) remaining
                        </span>
                        <Link
                          href={`/company/jobs/${j.id}/candidates`}
                          className="btn btn-outline-primary btn-sm py-1 px-3"
                        >
                          Review Candidates ({j.submitted_count}) →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
}
