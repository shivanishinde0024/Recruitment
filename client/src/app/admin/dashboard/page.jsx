'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import RoleLayout from '../../../components/layout/RoleLayout';
import api from '../../../services/api';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drill-down modal state
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [selectedCompanyDrillDown, setSelectedCompanyDrillDown] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/reports/company-wise');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load company-wise dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle drill-down inspection
  const handleOpenDrillDown = async (companyId) => {
    setDrillDownLoading(true);
    try {
      const res = await api.get(`/reports/company/${companyId}`);
      if (res.data?.success) {
        setSelectedCompanyDrillDown(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load company drill-down');
    } finally {
      setDrillDownLoading(false);
    }
  };

  if (loading) {
    return (
      <RoleLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <div className="text-muted small mt-2">Loading company-wise analytics...</div>
        </div>
      </RoleLayout>
    );
  }

  const summary = data?.summary || {};
  const companies = data?.companies || [];
  const urgentJobs = data?.urgent_requisitions || [];

  return (
    <RoleLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Executive Requisition Overview</h1>
          <p className="text-muted small mb-0">
            Real-time hiring pipelines, decoupled employer analytics, and urgent deadline tracking
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/reports" className="btn btn-outline-primary btn-sm">
            Export Reports (CSV/Excel) →
          </Link>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchDashboard}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Corporate Clients</span>
            <div className="h2 fw-bold text-dark mt-2 mb-0">{summary.total_companies || 0}</div>
            <div className="text-muted extra-small mt-1">Verified partner enterprises</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Active Requisitions</span>
            <div className="h2 fw-bold text-primary mt-2 mb-0">{summary.active_jobs || 0}</div>
            <div className="text-muted extra-small mt-1">Open & in-progress orders</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Confirmed Placements</span>
            <div className="h2 fw-bold text-success mt-2 mb-0">{summary.total_confirmed || 0}</div>
            <div className="text-muted extra-small mt-1">Across all requisitions</div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 h-100">
            <span className="text-muted extra-small text-uppercase fw-semibold">Overall Fulfillment</span>
            <div className="h2 fw-bold text-info mt-2 mb-0">{summary.overall_fulfillment_rate || 0}%</div>
            <div className="progress mt-2" style={{ height: '6px' }}>
              <div
                className="progress-bar bg-info"
                role="progressbar"
                style={{ width: `${summary.overall_fulfillment_rate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Main Company-Wise Table */}
        <div className="col-12 col-xl-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Company-Wise Hiring Requisitions</h5>
              <span className="badge bg-light text-dark border">{companies.length} Companies</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted extra-small text-uppercase">
                  <tr>
                    <th>Company Name</th>
                    <th>Industry</th>
                    <th>Jobs</th>
                    <th>Positions</th>
                    <th>Confirmed</th>
                    <th style={{ minWidth: '130px' }}>Fulfillment</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No company hiring activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    companies.map((c) => (
                      <tr key={c.company_id}>
                        <td>
                          <div className="fw-bold text-dark">{c.company_name}</div>
                          <div className="extra-small text-muted">{c.verification_status}</div>
                        </td>
                        <td className="small text-muted">{c.industry}</td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary">
                            {c.open_jobs_count} open / {c.jobs_count} total
                          </span>
                        </td>
                        <td className="fw-semibold text-dark">{c.positions_total}</td>
                        <td className="fw-bold text-success">{c.candidates_confirmed}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="progress flex-grow-1" style={{ height: '6px' }}>
                              <div
                                className={`progress-bar ${
                                  c.fulfillment_rate === 100
                                    ? 'bg-success'
                                    : c.fulfillment_rate > 50
                                    ? 'bg-primary'
                                    : 'bg-warning'
                                }`}
                                style={{ width: `${c.fulfillment_rate}%` }}
                              />
                            </div>
                            <span className="extra-small fw-semibold text-muted">
                              {c.fulfillment_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-primary btn-sm py-1 px-2"
                            onClick={() => handleOpenDrillDown(c.company_id)}
                            disabled={drillDownLoading}
                          >
                            Drill Down →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Urgent Worklist Side Panel */}
        <div className="col-12 col-xl-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">⚠️ Urgent Requisitions</h5>
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                {urgentJobs.length} Approaching
              </span>
            </div>

            <div className="p-3">
              {urgentJobs.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  ✓ No requisitions currently approaching deadline.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {urgentJobs.map((uj) => (
                    <div key={uj.id} className="border rounded p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-secondary font-monospace extra-small">
                          {uj.job_code}
                        </span>
                        <span className="badge bg-danger extra-small">
                          {uj.last_date ? new Date(uj.last_date).toLocaleDateString() : 'Immediate'}
                        </span>
                      </div>
                      <div className="fw-bold text-dark small">{uj.title}</div>
                      <div className="text-muted extra-small mb-2">Client: {uj.company_name}</div>
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top extra-small">
                        <span className="text-muted">
                          <strong>{uj.remaining_count}</strong> of {uj.positions_required} left
                        </span>
                        <Link
                          href={`/admin/jobs/${uj.id}/candidates`}
                          className="btn btn-outline-primary btn-sm py-0 px-2"
                        >
                          Match Candidates →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DRILL DOWN MODAL */}
      {selectedCompanyDrillDown && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  {selectedCompanyDrillDown.company?.company_name} - Hiring Breakdown
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedCompanyDrillDown(null)}
                />
              </div>
              <div className="modal-body p-4">
                {/* Company stats */}
                <div className="row g-3 mb-4 text-center">
                  <div className="col-3">
                    <div className="border rounded p-2 bg-light">
                      <div className="extra-small text-muted text-uppercase">Total Jobs</div>
                      <div className="fs-5 fw-bold">{selectedCompanyDrillDown.metrics.total_jobs}</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="border rounded p-2 bg-light">
                      <div className="extra-small text-muted text-uppercase">Target Positions</div>
                      <div className="fs-5 fw-bold">{selectedCompanyDrillDown.metrics.total_positions}</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="border rounded p-2 bg-light">
                      <div className="extra-small text-muted text-uppercase">Confirmed Placements</div>
                      <div className="fs-5 fw-bold text-success">{selectedCompanyDrillDown.metrics.total_confirmed}</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="border rounded p-2 bg-light">
                      <div className="extra-small text-muted text-uppercase">Fulfillment Rate</div>
                      <div className="fs-5 fw-bold text-info">{selectedCompanyDrillDown.metrics.fulfillment_rate}%</div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-3">Requisitions & Pipeline Candidates</h6>
                {selectedCompanyDrillDown.jobs.length === 0 ? (
                  <p className="text-muted small">No jobs posted by this company.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {selectedCompanyDrillDown.jobs.map((jb) => (
                      <div key={jb.id} className="card border p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-secondary font-monospace">{jb.job_code}</span>
                            <span className="fw-bold text-dark">{jb.title}</span>
                          </div>
                          <StatusBadge status={jb.status} />
                        </div>

                        <div className="extra-small text-muted mb-2">
                          <strong>Target:</strong> {jb.positions_required} positions &bull; <strong>Submitted:</strong> {jb.submitted_count} &bull; <strong>Confirmed:</strong> {jb.confirmed_count}
                        </div>

                        {jb.candidates.length > 0 ? (
                          <div className="table-responsive mt-2">
                            <table className="table table-sm table-bordered extra-small mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Candidate Name</th>
                                  <th>Match Score</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {jb.candidates.map((cnd) => (
                                  <tr key={cnd.mapping_id}>
                                    <td>{cnd.candidate_name}</td>
                                    <td>{cnd.match_score ? `${cnd.match_score}%` : 'N/A'}</td>
                                    <td><StatusBadge status={cnd.status} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-muted extra-small fst-italic">
                            No candidates currently mapped to this job.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedCompanyDrillDown(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
