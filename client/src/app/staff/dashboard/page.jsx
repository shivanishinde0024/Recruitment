'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import RoleLayout from '../../../components/layout/RoleLayout';
import api from '../../../services/api';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function StaffDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaffDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reports/staff-dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff workspace');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffDashboard();
  }, [fetchStaffDashboard]);

  if (loading) {
    return (
      <RoleLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <div className="text-muted small mt-2">Loading recruiter workspace...</div>
        </div>
      </RoleLayout>
    );
  }

  const metrics = data?.metrics || {};
  const assignedJobs = data?.assigned_jobs || [];
  const urgentJobs = data?.urgent_jobs || [];

  return (
    <RoleLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Recruiter Workspace</h1>
          <p className="text-muted small mb-0">
            Track your assigned job requisitions, candidate sourcing pipeline, and confirmed placements
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/candidates/create" className="btn btn-primary btn-sm">
            + Register Candidate
          </Link>
          <Link href="/admin/candidates/bulk" className="btn btn-outline-secondary btn-sm">
            Bulk Upload (Excel/Zip)
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Assigned Jobs</span>
            <div className="h2 fw-bold text-dark mt-2 mb-0">{metrics.assigned_jobs_count || 0}</div>
            <div className="text-muted extra-small mt-1">{metrics.active_jobs_count || 0} active hiring</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Candidates Uploaded</span>
            <div className="h2 fw-bold text-primary mt-2 mb-0">{metrics.candidates_uploaded_count || 0}</div>
            <div className="text-muted extra-small mt-1">Sourced by your profile</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Confirmed Hires</span>
            <div className="h2 fw-bold text-success mt-2 mb-0">{metrics.candidates_confirmed_count || 0}</div>
            <div className="text-muted extra-small mt-1">Placements finalized</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Conversion Rate</span>
            <div className="h2 fw-bold text-info mt-2 mb-0">{metrics.placement_conversion_rate || 0}%</div>
            <div className="progress mt-2" style={{ height: '6px' }}>
              <div
                className="progress-bar bg-info"
                style={{ width: `${metrics.placement_conversion_rate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Assigned Requisitions Table */}
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">My Assigned Requisitions</h5>
              <span className="badge bg-light text-dark border">{assignedJobs.length} Assigned</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted extra-small text-uppercase">
                  <tr>
                    <th>Job Code & Title</th>
                    <th>Client Company</th>
                    <th>Positions</th>
                    <th>Status</th>
                    <th>Deadline</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedJobs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No job requisitions currently assigned to you.
                      </td>
                    </tr>
                  ) : (
                    assignedJobs.map((j) => (
                      <tr key={j.id}>
                        <td>
                          <div className="fw-bold text-dark">{j.title}</div>
                          <span className="badge bg-secondary font-monospace extra-small">{j.job_code}</span>
                        </td>
                        <td className="small text-muted">{j.company_name}</td>
                        <td className="fw-semibold text-dark">{j.positions_required}</td>
                        <td><StatusBadge status={j.status} /></td>
                        <td className="small text-muted">
                          {j.last_date ? new Date(j.last_date).toLocaleDateString() : 'None'}
                        </td>
                        <td className="text-end">
                          <Link
                            href={`/admin/jobs/${j.id}/candidates`}
                            className="btn btn-outline-primary btn-sm py-1 px-2"
                          >
                            Match Candidates →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Approaching Deadlines Side Card */}
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom p-3">
              <h5 className="fw-bold mb-0 text-dark">⏰ Requisition Deadlines</h5>
            </div>
            <div className="p-3">
              {urgentJobs.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  ✓ None of your assigned jobs are near their deadline.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {urgentJobs.map((uj) => (
                    <div key={uj.id} className="border rounded p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge bg-secondary font-monospace extra-small">{uj.job_code}</span>
                        <span className="badge bg-danger extra-small">
                          {new Date(uj.last_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="fw-bold text-dark small">{uj.title}</div>
                      <div className="text-muted extra-small mb-2">Company: {uj.company_name}</div>
                      <Link
                        href={`/admin/jobs/${uj.id}/candidates`}
                        className="btn btn-sm btn-primary w-100 py-1"
                      >
                        Source Matching Candidates
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
