'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import RoleLayout from '../../../components/layout/RoleLayout';
import api from '../../../services/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  // Diff Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (moduleFilter) params.set('module', moduleFilter);
      if (actionFilter) params.set('action', actionFilter);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setMeta(res.data.meta);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'create':
        return 'bg-success';
      case 'update':
      case 'update_settings':
        return 'bg-primary';
      case 'delete':
      case 'permanent_delete':
        return 'bg-danger';
      case 'restore':
        return 'bg-info text-dark';
      case 'status_change':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <RoleLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">System Audit & Compliance Log</h1>
          <p className="text-muted small mb-0">
            Immutable ledger of state mutations, user authorizations, and data modifications
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard" className="btn btn-outline-secondary btn-sm">
            ← Dashboard
          </Link>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchLogs}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Modules</option>
              <option value="companies">Companies</option>
              <option value="jobs">Job Requisitions</option>
              <option value="candidates">Candidates</option>
              <option value="masters">Master Data</option>
              <option value="settings">System Settings</option>
            </select>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select form-select-sm"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Soft Delete</option>
              <option value="restore">Restore</option>
              <option value="status_change">Status Change</option>
              <option value="permanent_delete">Permanent Delete</option>
            </select>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <span className="text-muted extra-small">
              Showing {logs.length} entries {meta ? `(Page ${meta.page} of ${meta.totalPages})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted extra-small text-uppercase">
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Module</th>
                <th>Action</th>
                <th>Record ID</th>
                <th>IP Address</th>
                <th className="text-end">Inspection</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm" role="status" />
                    <div className="text-muted extra-small mt-2">Loading audit entries...</div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No audit records found matching selected criteria.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td className="small text-muted font-monospace">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td>
                      {l.user ? (
                        <div>
                          <div className="fw-semibold text-dark small">{l.user.name}</div>
                          <div className="extra-small text-muted">{l.user.email} ({l.user.role})</div>
                        </div>
                      ) : (
                        <span className="text-muted extra-small fst-italic">System Daemon</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace extra-small">
                        {l.module}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(l.action)} extra-small`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="font-monospace small text-muted">
                      {l.record_id || '-'}
                    </td>
                    <td className="extra-small text-muted font-monospace">
                      {l.ip}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-primary btn-sm py-0 px-2 extra-small"
                        onClick={() => setSelectedLog(l)}
                      >
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ← Previous
            </button>
            <span className="text-muted extra-small">
              Page {meta.page} of {meta.totalPages} ({meta.total} records)
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* AUDIT DIFF MODAL */}
      {selectedLog && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  Audit Snapshot #{selectedLog.id} ({selectedLog.module} &bull; {selectedLog.action})
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedLog(null)}
                />
              </div>
              <div className="modal-body p-4">
                <div className="mb-3 text-muted extra-small">
                  <strong>User:</strong> {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System'} &bull; <strong>Time:</strong> {new Date(selectedLog.created_at).toISOString()} &bull; <strong>IP:</strong> {selectedLog.ip}
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <h6 className="fw-bold small text-muted text-uppercase">Previous State (Before)</h6>
                    <pre className="bg-light p-3 border rounded small text-danger font-monospace" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {selectedLog.old_value ? JSON.stringify(selectedLog.old_value, null, 2) : 'null (New Record)'}
                    </pre>
                  </div>
                  <div className="col-12 col-md-6">
                    <h6 className="fw-bold small text-muted text-uppercase">New State (After)</h6>
                    <pre className="bg-light p-3 border rounded small text-success font-monospace" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {selectedLog.new_value ? JSON.stringify(selectedLog.new_value, null, 2) : 'null (Deleted)'}
                    </pre>
                  </div>
                </div>

                <div className="mt-3 alert alert-light border extra-small text-muted mb-0">
                  🛡️ Sensitive attributes (passwords, JWT hashes, recovery tokens) are automatically redacted in compliance with security audit mandates.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedLog(null)}
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

