'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function StaffPerformanceReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reports/staff-dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load performance metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const metrics = data?.metrics || {};
  const assignedJobs = data?.assigned_jobs || [];

  return (
    <div className="container-fluid py-3">
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Recruiter Performance Report</h1>
        <p className="text-muted small">Personal operational metrics, submission volume, and hire conversion rates</p>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rp-card p-3 text-center">
            <div className="text-muted small mb-1">Active Requisitions</div>
            <div className="h3 fw-bold text-primary mb-0">{metrics.active_jobs_count || 0}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rp-card p-3 text-center">
            <div className="text-muted small mb-1">Candidates Uploaded</div>
            <div className="h3 fw-bold text-info mb-0">{metrics.candidates_uploaded_count || 0}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rp-card p-3 text-center">
            <div className="text-muted small mb-1">Submissions Mapped</div>
            <div className="h3 fw-bold text-dark mb-0">{metrics.candidates_submitted_count || 0}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rp-card p-3 text-center">
            <div className="text-muted small mb-1">Confirmed Placements</div>
            <div className="h3 fw-bold text-success mb-0">{metrics.candidates_confirmed_count || 0}</div>
          </div>
        </div>
      </div>

      {/* Performance Summary Banner */}
      <div className="rp-card p-4 mb-4 bg-primary bg-opacity-10 border-primary border-opacity-25">
        <div className="row align-items-center">
          <div className="col-12 col-md-8">
            <h4 className="fw-bold mb-1">Hire Conversion Rate: {metrics.placement_conversion_rate || 0}%</h4>
            <p className="text-muted small mb-0">
              Ratio of confirmed placements to total candidate submissions mapped across your active requisitions.
            </p>
          </div>
          <div className="col-12 col-md-4 text-md-end mt-3 mt-md-0">
            <span className="badge bg-primary fs-6 px-3 py-2">
              {metrics.candidates_confirmed_count || 0} Hires Achieved
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Requisitions Overview */}
      <div className="rp-card p-0 overflow-hidden">
        <div className="p-3 border-bottom bg-light fw-bold">
          Assigned Requisitions Pipeline
        </div>
        {loading ? (
          <div className="p-5 text-center text-muted">Loading pipeline data...</div>
        ) : assignedJobs.length === 0 ? (
          <div className="p-4 text-center text-muted small">No active jobs assigned.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Job Code</th>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Positions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignedJobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <span className="badge bg-light text-dark font-monospace">{j.job_code}</span>
                    </td>
                    <td className="fw-semibold">{j.title}</td>
                    <td className="text-muted small">{j.company_name}</td>
                    <td>{j.positions_required} positions</td>
                    <td>
                      <span className="badge bg-secondary text-uppercase">{j.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
