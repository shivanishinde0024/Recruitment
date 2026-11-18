'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import DataTable from '../../../components/tables/DataTable';
import FilterBar from '../../../components/forms/FilterBar';
import StatusBadge from '../../../components/ui/StatusBadge';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Closed', value: 'closed' }
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Staff Assignment Modal State
  const [assignModal, setAssignModal] = useState({ isOpen: false, job: null });
  const [staffUsers, setStaffUsers] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/jobs?${params.toString()}`);
      if (res.data?.success) {
        setJobs(res.data.data || []);
        if (res.data.meta) setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  const openAssignModal = async (job) => {
    setSelectedStaffId(job.assigned_to ? String(job.assigned_to) : '');
    setAssignModal({ isOpen: true, job });

    if (staffUsers.length === 0) {
      try {
        const res = await api.get('/users?role=staff&status=active&limit=100');
        if (res.data?.success) {
          setStaffUsers(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load staff list:', err);
      }
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId || !assignModal.job) return;

    setAssignLoading(true);
    try {
      const res = await api.patch(`/jobs/${assignModal.job.id}/assign-staff`, {
        assigned_to: selectedStaffId
      });
      if (res.data?.success) {
        setAssignModal({ isOpen: false, job: null });
        await fetchJobs(meta.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign staff member');
    } finally {
      setAssignLoading(false);
    }
  };

  const columns = [
    {
      header: 'Job Code & Title',
      key: 'title',
      render: (row) => (
        <div>
          <div className="fw-semibold text-primary">{row.title}</div>
          <div className="text-muted small">
            <code>{row.job_code}</code> • {row.employment_type?.name || 'Full-time'}
          </div>
        </div>
      )
    },
    {
      header: 'Company',
      key: 'company',
      render: (row) => (
        <div>
          <div className="small fw-semibold">{row.company?.company_name || 'N/A'}</div>
          <div className="text-muted small">{row.company?.contact_email}</div>
        </div>
      )
    },
    {
      header: 'Positions & Metrics',
      key: 'positions_required',
      render: (row) => (
        <div className="small">
          <div>Required: <strong>{row.positions_required}</strong></div>
          <div className="text-muted">Submitted: {row.submitted_count || 0} | Confirmed: {row.confirmed_count || 0}</div>
          <div className="fw-semibold text-primary">Remaining: {row.remaining_count ?? row.positions_required}</div>
        </div>
      )
    },
    {
      header: 'Assigned Staff',
      key: 'assigned_user',
      render: (row) => (
        <div>
          {row.assigned_user ? (
            <span className="badge bg-light text-dark border">
              👤 {row.assigned_user.name}
            </span>
          ) : (
            <span className="badge bg-warning text-dark border border-warning">
              Unassigned
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => openAssignModal(row)}
          >
            Assign
          </button>
          <Link
            href={`/admin/jobs/${row.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            Review
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Job Requisitions</h1>
          <p className="text-muted small mb-0">
            Monitor client company hiring requests, assign staff recruiters, and oversee pipeline progress.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3">
        <FilterBar
          search={search}
          onSearchChange={(s) => setSearch(s)}
          filters={[
            {
              name: 'status',
              label: 'Status',
              options: STATUS_OPTIONS,
              value: statusFilter,
              onChange: (val) => setStatusFilter(val)
            }
          ]}
        />
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <DataTable
          columns={columns}
          data={jobs}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchJobs(p)}
          emptyMessage="No job requirements match the current filters."
        />
      </div>

      {/* Staff Assignment Modal */}
      {assignModal.isOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <form onSubmit={handleAssignSubmit}>
                <div className="modal-header">
                  <h2 className="modal-title h5 fw-bold">Assign Staff Recruiter</h2>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setAssignModal({ isOpen: false, job: null })}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <p className="small text-muted mb-3">
                    Assign an active staff member to lead candidate sourcing and screening for job requisition <strong>{assignModal.job?.title}</strong> (<code>{assignModal.job?.job_code}</code>).
                  </p>
                  <label className="form-label small fw-semibold">Select Staff Member *</label>
                  <select
                    className="form-select"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    required
                  >
                    <option value="">Choose Staff User...</option>
                    {staffUsers.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setAssignModal({ isOpen: false, job: null })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={assignLoading || !selectedStaffId}
                  >
                    {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
