'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import DataTable from '../../../components/tables/DataTable';
import FilterBar from '../../../components/forms/FilterBar';
import StatusBadge from '../../../components/ui/StatusBadge';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'Mapped', value: 'mapped' },
  { label: 'Placed', value: 'placed' },
  { label: 'Inactive', value: 'inactive' }
];

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCandidates = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/candidates?${params.toString()}`);
      if (res.data?.success) {
        setCandidates(res.data.data || []);
        if (res.data.meta) setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCandidates(1);
  }, [fetchCandidates]);

  const columns = [
    {
      header: 'Candidate Name',
      key: 'name',
      render: (row) => (
        <div>
          <div className="fw-semibold text-primary">{row.name}</div>
          <div className="text-muted small">
            {row.current_designation || 'Specialist'} {row.current_company ? `at ${row.current_company}` : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      key: 'email',
      render: (row) => (
        <div className="small">
          <div>{row.email}</div>
          <div className="text-muted">{row.mobile}</div>
        </div>
      )
    },
    {
      header: 'Experience & Notice',
      key: 'experience_years',
      render: (row) => (
        <div className="small">
          <div><strong>{row.experience_years}</strong> Years</div>
          <div className="text-muted">{row.notice_period_days} Days Notice</div>
        </div>
      )
    },
    {
      header: 'Key Skills',
      key: 'skills',
      render: (row) => (
        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '240px' }}>
          {(!row.skills || row.skills.length === 0) ? (
            <span className="text-muted small">-</span>
          ) : (
            row.skills.slice(0, 3).map((s) => (
              <span key={s.id} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                {s.skill?.name || 'Skill'}
              </span>
            ))
          )}
          {row.skills?.length > 3 && (
            <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
              +{row.skills.length - 3}
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
          <Link
            href={`/admin/candidates/${row.id}`}
            className="btn btn-sm btn-outline-primary"
          >
            Profile
          </Link>
          {row.resume_path && (
            <a
              href={`/api/v1/candidates/${row.id}/resume`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary"
              title="Download Resume"
            >
              📄
            </a>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1">Candidate Talent Pool</h1>
          <p className="text-muted small mb-0">
            Search, screen, and map qualified talent to open client requisitions.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/candidates/bulk" className="btn btn-outline-primary">
            ⬆ Bulk Import (Excel/Zip)
          </Link>
          <Link href="/admin/candidates/create" className="btn btn-primary px-3">
            + Add Candidate
          </Link>
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

      {/* Candidates Table */}
      <div className="card shadow-sm border-0">
        <DataTable
          columns={columns}
          data={candidates}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchCandidates(p)}
          emptyMessage="No candidate profiles found matching your query."
        />
      </div>
    </div>
  );
}

