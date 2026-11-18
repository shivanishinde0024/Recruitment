'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import RoleLayout from '../../../components/layout/RoleLayout';
import api from '../../../services/api';

export default function AdminTrashManagerPage() {
  const [trashItems, setTrashItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Permanent Delete Modal
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/trash?module=${activeTab}`);
      if (res.data?.success) {
        setTrashItems(res.data.data || []);
        setMeta(res.data.meta);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trash repository');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  // Restore item
  const handleRestore = async (item) => {
    setActionLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.patch(`/trash/${item.module}/${item.id}/restore`);
      if (res.data?.success) {
        setMessage(`Successfully restored ${item.name} (${item.module}).`);
        await fetchTrash();
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to restore ${item.name}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Permanently delete item
  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.delete(`/trash/${itemToDelete.module}/${itemToDelete.id}/permanent`);
      if (res.data?.success) {
        setMessage(`Item permanently deleted from database.`);
        setItemToDelete(null);
        await fetchTrash();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to permanently delete item');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <RoleLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Trash & Lifecycle Recovery</h1>
          <p className="text-muted small mb-0">
            Safely inspect soft-deleted entities, restore relational dependencies, or execute permanent purges
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/admin/dashboard" className="btn btn-outline-secondary btn-sm">
            ← Dashboard
          </Link>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchTrash}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success alert-dismissible fade show">{message}</div>}
      {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}

      {/* Tabs */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="btn-group btn-group-sm" role="group">
            {[
              { id: 'all', label: 'All Trash' },
              { id: 'companies', label: 'Companies' },
              { id: 'jobs', label: 'Job Requisitions' },
              { id: 'candidates', label: 'Candidates' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-muted extra-small">
            {trashItems.length} deleted record(s) in repository
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted extra-small text-uppercase">
              <tr>
                <th>Entity Module</th>
                <th>Name / Title</th>
                <th>Identifier / Parent</th>
                <th>Deleted On</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm" role="status" />
                    <div className="text-muted extra-small mt-2">Loading trash repository...</div>
                  </td>
                </tr>
              ) : trashItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    ✓ The trash directory is clean. No soft-deleted records found.
                  </td>
                </tr>
              ) : (
                trashItems.map((item) => (
                  <tr key={`${item.module}-${item.id}`}>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary font-monospace extra-small">
                        {item.module}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{item.name}</div>
                    </td>
                    <td className="small text-muted">
                      {item.identifier}
                      {item.parent_name && (
                        <div className="extra-small text-secondary">
                          Company: {item.parent_name}
                        </div>
                      )}
                    </td>
                    <td className="small text-muted font-monospace">
                      {new Date(item.deleted_at).toLocaleString()}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-outline-success btn-sm py-1 px-3 extra-small"
                          disabled={actionLoading}
                          onClick={() => handleRestore(item)}
                        >
                          Restore
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm py-1 px-2 extra-small"
                          disabled={actionLoading}
                          onClick={() => setItemToDelete(item)}
                        >
                          Purge Permanently
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PERMANENT PURGE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Permanent Deletion Warning</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setItemToDelete(null)}
                />
              </div>
              <div className="modal-body p-4">
                <p>
                  Are you absolutely certain you want to permanently delete <strong>{itemToDelete.name}</strong> ({itemToDelete.module})?
                </p>
                <div className="alert alert-danger small mb-0">
                  ⚠️ <strong>Irreversible Action:</strong> This operation will completely erase the row from the database. It cannot be recovered from the trash directory.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setItemToDelete(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-4"
                  disabled={actionLoading}
                  onClick={handlePermanentDelete}
                >
                  {actionLoading ? 'Purging...' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleLayout>
  );
}
