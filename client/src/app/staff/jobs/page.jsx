'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../context/AuthContext';

export default function StaffJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAssigned, setFilterAssigned] = useState('assigned');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/jobs');
        if (res.data?.success) {
          setJobs(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load job requisitions.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (filterAssigned === 'assigned' && String(j.assigned_staff_id) !== String(user?.id)) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const title = (j.title || '').toLowerCase();
      const code = (j.job_code || '').toLowerCase();
      const company = (j.company_name || j.company?.company_name || '').toLowerCase();
      return title.includes(term) || code.includes(term) || company.includes(term);
    }
    return true;
  });

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Recruitment Job Orders</h1>
          <p className="text-muted small">Job requisitions assigned to you and active across the portal</p>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      <div className="rp-card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search by job code, title, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${filterAssigned === 'assigned' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilterAssigned('assigned')}
              >
                Assigned to Me
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterAssigned === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilterAssigned('all')}
              >
                All Open Requisitions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rp-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading requisitions...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <div className="fs-1 mb-2">📋</div>
            <h5>No job orders found</h5>
            <p className="small mb-0">
              {filterAssigned === 'assigned'
                ? "You currently have no job orders assigned. Check 'All Open Requisitions'."
                : 'No requisitions matched your search query.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Job Code</th>
                  <th>Title & Company</th>
                  <th>Positions</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <span className="badge bg-light text-dark font-monospace fw-bold">{j.job_code}</span>
                    </td>
                    <td>
                      <div className="fw-semibold">{j.title}</div>
                      <div className="text-muted small">{j.company_name || j.company?.company_name}</div>
                    </td>
                    <td>
                      <div className="small">
                        <strong>{j.confirmed_count || 0}</strong> / {j.positions_required} confirmed
                      </div>
                    </td>
                    <td>
                      <div className="small">{j.last_date ? new Date(j.last_date).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td>
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link href={`/staff/jobs/${j.id}/candidates`} className="btn btn-primary">
                          Match & Map Candidates
                        </Link>
                        <Link href={`/staff/jobs/${j.id}`} className="btn btn-outline-secondary">
                          View
                        </Link>
                      </div>
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

