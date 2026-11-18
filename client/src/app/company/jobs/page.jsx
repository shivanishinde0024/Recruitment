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

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      console.error('Failed to load company jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

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
      header: 'Positions & Pipeline',
      key: 'positions_required',
      render: (row) => (
        <div className="small">
          <div>Required: <strong>{row.positions_required}</strong></div>
          <div className="text-muted">
            Submitted: {row.submitted_count || 0} | Confirmed: <strong className="text-success">{row.confirmed_count || 0}</strong>
          </div>
          <div className="fw-semibold text-primary">Remaining: {row.remaining_count ?? row.positions_required}</div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Last Date',
      key: 'last_date',
      render: (row) => (
        <span className="small text-muted">
          {row.last_date ? new Date(row.last_date).toLocaleDateString() : 'Open until filled'}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <Link
          href={`/company/jobs/${row.id}`}
          className="btn btn-sm btn-outline-primary"
        >
          View & Candidates
        </Link>
      )
    }
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Job Requirements</h1>
          <p className="text-muted small mb-0">
            Post and manage job requisitions and review mapped candidate profiles.
          </p>
        </div>
        <Link href="/company/jobs/create" className="btn btn-primary px-3">
          + Post New Requirement
        </Link>
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

      {/* Jobs Table */}
      <div className="card shadow-sm border-0">
        <DataTable
          columns={columns}
          data={jobs}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchJobs(p)}
          emptyMessage="No job requirements found. Click '+ Post New Requirement' to create your first requisition."
        />
      </div>
    </div>
  );
}
