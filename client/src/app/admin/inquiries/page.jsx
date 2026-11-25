'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

export default function AdminInquiriesPage() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await api.get(`/sqa/leads?${params.toString()}`);
      if (res.data?.success) {
        setLeads(res.data.data || []);
        if (res.data.meta?.stats) {
          setStats(res.data.meta.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
      toast.error('Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleUpdateStatus = async (leadId, newStatus) => {
    setUpdatingId(leadId);
    try {
      await api.patch(`/sqa/leads/${leadId}/status`, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev) => ({ ...prev, status: newStatus }));
      }
      toast.success(`Inquiry status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm(`Are you sure you want to delete inquiry ${leadId}?`)) return;
    setDeletingId(leadId);
    try {
      await api.delete(`/sqa/leads/${leadId}`);
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
      toast.success('Inquiry deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete inquiry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      toast.info('Preparing inquiries CSV export...');
      const res = await api.get('/sqa/leads/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `SQA_Inquiries_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV downloaded successfully.');
    } catch (err) {
      toast.error('Failed to export CSV.');
    }
  };

  const getRequestTypeInfo = (category = '', subStream = '') => {
    const cat = category.toLowerCase();
    const sub = subStream.toLowerCase();

    if (cat.includes('roadmap')) {
      return {
        label: 'Career Roadmap',
        icon: '🧭',
        badgeClass: 'badge bg-success-subtle text-success border border-success-subtle'
      };
    }
    if (cat.includes('design') || cat.includes('media') || cat.includes('spatial')) {
      return {
        label: 'Creative Design & Media',
        icon: '🎨',
        badgeClass: 'badge bg-secondary-subtle text-dark border border-secondary-subtle'
      };
    }
    if (cat.includes('certification') || cat.includes('ai') || cat.includes('analytic') || cat.includes('engineering') || cat.includes('emerging') || cat.includes('tech')) {
      return {
        label: 'Skill Certification',
        icon: '🎓',
        badgeClass: 'badge bg-info-subtle text-info border border-info-subtle'
      };
    }
    if (cat.includes('placement') || cat.includes('internship') || sub.includes('matching') || sub.includes('profile')) {
      return {
        label: 'Placement Application',
        icon: '💼',
        badgeClass: 'badge bg-primary-subtle text-primary border border-primary-subtle'
      };
    }
    if (cat.includes('start-up') || cat.includes('startup') || cat.includes('venture') || cat.includes('market research')) {
      return {
        label: 'Start-up & Research',
        icon: '🚀',
        badgeClass: 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle'
      };
    }
    if (cat.includes('soft') || cat.includes('personality') || cat.includes('interview')) {
      return {
        label: 'Soft Skills Lab',
        icon: '🗣️',
        badgeClass: 'badge bg-secondary-subtle text-secondary border border-secondary-subtle'
      };
    }
    return {
      label: category || 'General Inquiry',
      icon: '📝',
      badgeClass: 'badge bg-light text-dark border'
    };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ENROLLED':
        return <span className="badge bg-success text-white">✓ Enrolled</span>;
      case 'CONTACTED':
        return <span className="badge bg-warning text-dark">⏳ Contacted</span>;
      default:
        return <span className="badge bg-primary text-white">● New</span>;
    }
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Admissions &amp; Platform Inquiries</h1>
          <p className="text-muted small mb-0">
            Incoming career roadmap inquiries, certifications, placement profiles, and startup validations from the SQA Landing Page
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success btn-sm" onClick={handleExportCsv}>
            📥 Export CSV
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchLeads}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100">
              <span className="text-muted extra-small text-uppercase fw-semibold">Total Inquiries</span>
              <div className="h2 fw-bold text-dark mt-2 mb-0">{stats.totalLeads}</div>
              <div className="text-muted extra-small mt-1">Across all strategic pillars</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100">
              <span className="text-muted extra-small text-uppercase fw-semibold">New &amp; Uncontacted</span>
              <div className="h2 fw-bold text-primary mt-2 mb-0">{stats.newCount}</div>
              <div className="text-muted extra-small mt-1">Pending counselor follow-up</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100">
              <span className="text-muted extra-small text-uppercase fw-semibold">In Discussion</span>
              <div className="h2 fw-bold text-warning mt-2 mb-0">{stats.contactedCount}</div>
              <div className="text-muted extra-small mt-1">Candidate contacted</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card shadow-sm border-0 p-3 h-100">
              <span className="text-muted extra-small text-uppercase fw-semibold">Enrolled / Converted</span>
              <div className="h2 fw-bold text-success mt-2 mb-0">{stats.enrolledCount}</div>
              <div className="text-muted extra-small mt-1">{stats.conversionRate} Conversion Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search candidate name, email, phone, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-7 d-flex justify-content-md-end gap-2 flex-wrap">
            {/* Status Select */}
            <select
              className="form-select form-select-sm w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New (Uncontacted)</option>
              <option value="CONTACTED">Contacted</option>
              <option value="ENROLLED">Enrolled</option>
            </select>

            {/* Category Select */}
            <select
              className="form-select form-select-sm w-auto"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Pillars / Categories</option>
              <option value="Career Roadmap">🧭 Career Roadmap</option>
              <option value="Professional Skill Certifications">🎓 Skill Certifications</option>
              <option value="Engineering & Emerging Technologies">⚡ Engineering &amp; Tech</option>
              <option value="Creative Design & Media Lab">🎨 Creative Design &amp; Media</option>
              <option value="Applied AI & Data Intelligence">🤖 Applied AI &amp; Data</option>
              <option value="Corporate Internship & placement support">💼 Placement Support</option>
              <option value="Start-up & Market Research">🚀 Start-up &amp; Research</option>
              <option value="Personality Development & Soft skills">🗣️ Soft Skills</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="card shadow-sm border-0 overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted extra-small text-uppercase">
              <tr>
                <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Inquiry ID</th>
                <th style={{ minWidth: '220px' }}>Candidate / Student</th>
                <th style={{ minWidth: '150px' }}>Request Type</th>
                <th style={{ minWidth: '170px' }}>Focus Track / Milestone</th>
                <th style={{ minWidth: '150px' }}>Date Received</th>
                <th style={{ minWidth: '95px' }}>Status</th>
                <th className="text-end" style={{ minWidth: '170px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
                    <span className="text-muted small">Loading admissions inquiries...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted small">
                    <div style={{ fontSize: '2rem' }}>📭</div>
                    <div className="fw-semibold mt-1">No inquiries found matching criteria.</div>
                    <div className="extra-small text-muted">Try adjusting filters or search query.</div>
                  </td>
                </tr>
              ) : (
                leads.map((item) => {
                  const typeInfo = getRequestTypeInfo(item.serviceCategory, item.subStream);
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="badge bg-secondary font-monospace extra-small">
                          {item.id}
                        </span>
                      </td>
                      <td style={{ minWidth: '220px' }}>
                        <div className="fw-bold text-dark small mb-1">{item.fullName}</div>
                        <div className="d-flex flex-column gap-1 extra-small">
                          {item.email && (
                            <a
                              href={`mailto:${item.email}`}
                              className="text-decoration-none text-muted d-inline-flex align-items-center gap-1.5"
                              title={item.email}
                              style={{ maxWidth: '100%' }}
                            >
                              <span className="flex-shrink-0 text-primary" style={{ fontSize: '11px', lineHeight: 1 }}>✉</span>
                              <span className="text-truncate" style={{ maxWidth: '210px' }}>{item.email}</span>
                            </a>
                          )}
                          {item.phone && (
                            <a
                              href={`tel:${item.phone}`}
                              className="text-decoration-none text-muted d-inline-flex align-items-center gap-1.5"
                              title={item.phone}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              <span className="flex-shrink-0 text-success" style={{ fontSize: '11px', lineHeight: 1 }}>📞</span>
                              <span>{item.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={typeInfo.badgeClass}>
                          <span className="me-1">{typeInfo.icon}</span>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="small text-dark fw-semibold">{item.subStream || 'General Guidance'}</div>
                        <div className="extra-small text-muted">{item.serviceCategory}</div>
                      </td>
                      <td className="extra-small text-muted">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td>
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm py-0 px-2 extra-small"
                            onClick={() => setSelectedLead(item)}
                            title="View Full Inquiry Details"
                          >
                            View
                          </button>
                          {item.status !== 'CONTACTED' && (
                            <button
                              type="button"
                              className="btn btn-outline-warning btn-sm py-0 px-2 extra-small"
                              disabled={updatingId === item.id}
                              onClick={() => handleUpdateStatus(item.id, 'CONTACTED')}
                              title="Mark Contacted"
                            >
                              Contact
                            </button>
                          )}
                          {item.status !== 'ENROLLED' && (
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm py-0 px-2 extra-small"
                              disabled={updatingId === item.id}
                              onClick={() => handleUpdateStatus(item.id, 'ENROLLED')}
                              title="Mark Enrolled"
                            >
                              Enroll
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm py-0 px-2 extra-small"
                            disabled={deletingId === item.id}
                            onClick={() => handleDeleteLead(item.id)}
                            title="Delete Lead"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL INSPECTION MODAL */}
      {selectedLead && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Inquiry Details • {selectedLead.id}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedLead(null)}
                />
              </div>
              <div className="modal-body p-4 space-y-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{selectedLead.fullName}</h5>
                    <span className="text-muted extra-small">
                      Registered on {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>{getStatusBadge(selectedLead.status)}</div>
                </div>

                <div className="border rounded p-3 bg-light mb-3">
                  <div className="row g-2 extra-small">
                    <div className="col-12 col-sm-6">
                      <span className="text-muted d-block mb-1">Email Address:</span>
                      <a href={`mailto:${selectedLead.email}`} className="fw-semibold text-primary text-break" style={{ wordBreak: 'break-all' }}>
                        {selectedLead.email}
                      </a>
                    </div>
                    <div className="col-12 col-sm-6">
                      <span className="text-muted d-block mb-1">Phone Number:</span>
                      <a href={`tel:${selectedLead.phone}`} className="fw-semibold text-dark text-break">
                        {selectedLead.phone}
                      </a>
                    </div>
                    <div className="col-12 mt-2 pt-2 border-top">
                      <span className="text-muted d-block">Strategic Academic Pillar:</span>
                      <span className="fw-semibold text-dark">{selectedLead.serviceCategory}</span>
                    </div>
                    <div className="col-12">
                      <span className="text-muted d-block">Focus Track / Milestone:</span>
                      <span className="fw-semibold text-emerald-800">{selectedLead.subStream || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {selectedLead.goals && (
                  <div className="mb-3">
                    <span className="extra-small text-muted fw-bold text-uppercase d-block mb-1">
                      Candidate Notes / Strategic Goals:
                    </span>
                    <div className="p-3 bg-white border rounded small text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedLead.goals}
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span className="extra-small text-muted">Update Candidate Status:</span>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedLead.status === 'NEW' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleUpdateStatus(selectedLead.id, 'NEW')}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedLead.status === 'CONTACTED' ? 'btn-warning' : 'btn-outline-warning'}`}
                      onClick={() => handleUpdateStatus(selectedLead.id, 'CONTACTED')}
                    >
                      Contacted
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedLead.status === 'ENROLLED' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleUpdateStatus(selectedLead.id, 'ENROLLED')}
                    >
                      Enrolled
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedLead(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

