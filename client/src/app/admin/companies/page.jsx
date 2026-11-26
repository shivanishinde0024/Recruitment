'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import DataTable from '../../../components/tables/DataTable';
import FilterBar from '../../../components/forms/FilterBar';
import StatusBadge from '../../../components/ui/StatusBadge';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending Verification', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Need Information', value: 'need_info' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Suspended', value: 'suspended' }
];

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCompanies = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/companies?${params.toString()}`);
      if (res.data?.success) {
        setCompanies(res.data.data || []);
        if (res.data.meta) setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCompanies(1);
  }, [fetchCompanies]);

  const columns = [
    {
      header: 'Company Name',
      key: 'company_name',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.company_name}</div>
          <div className="text-muted small">
            {row.industry?.name || 'General Industry'} {row.gst_no ? `• GST: ${row.gst_no.toUpperCase()}` : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Contact Person',
      key: 'contact_person',
      render: (row) => (
        <div>
          <div className="small fw-semibold">{row.contact_person}</div>
          <div className="text-muted small">{row.contact_email}</div>
          <div className="text-muted small">{row.contact_mobile}</div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <div className="d-flex flex-column gap-1 align-items-start">
          <StatusBadge status={row.status} />
          {row.needs_reverification && (
            <span className="badge bg-warning text-dark border border-warning" style={{ fontSize: '0.7rem' }}>
              ⚠ Re-verification Needed
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Registered',
      key: 'created_at',
      render: (row) => (
        <span className="small text-muted">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <Link
          href={`/admin/companies/${row.id}`}
          className="btn btn-sm btn-outline-primary"
        >
          Review / Details
        </Link>
      )
    }
  ];

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Company Management</h1>
          <p className="text-muted small mb-0">
            Review corporate registrations, compliance documents, and verification statuses.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
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

      {/* Companies Data Table */}
      <div className="card shadow-sm border-0">
        <DataTable
          columns={columns}
          data={companies}
          loading={loading}
          meta={meta}
          onPageChange={(p) => fetchCompanies(p)}
          emptyMessage="No companies match the current filter criteria."
        />
      </div>
    </div>
  );
}

