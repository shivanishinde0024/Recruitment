'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../../services/api';
import StatusBadge from '../../../../../components/ui/StatusBadge';

export default function CompanyJobCandidatesReviewPage() {
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'reject' | 'confirm' | null
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobRes, mappingsRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/mappings?job_id=${jobId}`)
      ]);

      if (jobRes.data?.success) {
        setJob(jobRes.data.data);
      }
      if (mappingsRes.data?.success) {
        setCandidates(mappingsRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidates for review');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Review status update
  const handleReviewStatus = async (mappingId, newStatus, remarks = '') => {
    setActionLoading(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        status: newStatus
      };
      if (remarks) {
        payload.company_remarks = remarks;
      }

      const res = await api.patch(`/mappings/${mappingId}/review`, payload);
      if (res.data?.success) {
        setMessage(`Candidate successfully marked as ${newStatus}.`);
        setActiveModal(null);
        setRejectRemarks('');
        setSelectedMapping(null);
        await fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCandidates = candidates.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="container-fluid p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading candidate review portal...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">{error || 'Job not found'}</div>
        <Link href="/company/jobs" className="btn btn-outline-secondary btn-sm">
          ← Back to My Requisitions
        </Link>
      </div>
    );
  }

  const confirmedCount = job.confirmed_count || 0;
  const targetPositions = job.no_of_positions || 1;
  const remainingPositions = Math.max(0, targetPositions - confirmedCount);
  const fulfillmentPercent = Math.min(100, Math.round((confirmedCount / targetPositions) * 100));

  return (
    <div className="container-fluid p-4">
      {/* Header and Breadcrumbs */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <Link href={`/company/jobs/${jobId}`} className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Requisition ({job.job_code})
        </Link>
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
          Employer Review Portal
        </span>
      </div>

      {/* Position Summary Card */}
      <div className="card shadow-sm border-0 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-secondary font-monospace">{job.job_code}</span>
              <h4 className="fw-bold mb-0 text-dark">{job.title}</h4>
              <StatusBadge status={job.status} />
            </div>
            <div className="text-muted small">
              <strong>Department:</strong> {job.department?.name || 'General'} &bull; <strong>Location:</strong> {job.location || 'Any'}
            </div>
          </div>

          <div className="d-flex gap-3 text-center">
            <div className="border rounded px-3 py-2 bg-light">
              <div className="text-muted extra-small text-uppercase fw-semibold">Target</div>
              <div className="fs-5 fw-bold text-dark">{targetPositions}</div>
            </div>
            <div className="border rounded px-3 py-2 bg-light">
              <div className="text-muted extra-small text-uppercase fw-semibold">Confirmed</div>
              <div className="fs-5 fw-bold text-success">{confirmedCount}</div>
            </div>
            <div className="border rounded px-3 py-2 bg-light">
              <div className="text-muted extra-small text-uppercase fw-semibold">Remaining</div>
              <div className={`fs-5 fw-bold ${remainingPositions === 0 ? 'text-muted' : 'text-primary'}`}>
                {remainingPositions}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="d-flex justify-content-between extra-small text-muted mb-1">
            <span>Fulfillment Progress</span>
            <span>{fulfillmentPercent}% ({confirmedCount} of {targetPositions} filled)</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${fulfillmentPercent === 100 ? 'bg-success' : 'bg-primary'}`}
              role="progressbar"
              style={{ width: `${fulfillmentPercent}%` }}
              aria-valuenow={fulfillmentPercent}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
        </div>

        {remainingPositions === 0 && (
          <div className="alert alert-success mt-3 mb-0 py-2 small">
            🎉 All positions filled! This requisition is fulfilled. Further confirmations are locked.
          </div>
        )}
      </div>

      {/* Notifications */}
      {message && <div className="alert alert-success alert-dismissible fade show">{message}</div>}
      {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}

      {/* Candidate Filter & Pipeline */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Status Tabs */}
          <div className="btn-group btn-group-sm" role="group">
            {[
              { id: 'all', label: 'All Candidates' },
              { id: 'submitted', label: 'Under Review' },
              { id: 'shortlisted', label: 'Shortlisted' },
              { id: 'confirmed', label: 'Hired / Confirmed' },
              { id: 'hold', label: 'On Hold' },
              { id: 'rejected', label: 'Rejected' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-muted small">
            Showing {filteredCandidates.length} candidate(s)
          </span>
        </div>

        <div className="card-body p-4">
          {filteredCandidates.length === 0 ? (
            <div className="text-center py-5 border rounded bg-light">
              <p className="text-muted mb-0">No candidates found for the selected filter.</p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredCandidates.map((m) => {
                const cand = m.candidate || {};
                const isConfirmed = m.status === 'confirmed';
                const scoreColor = (m.match_score || 0) >= 75 ? 'success' : (m.match_score || 0) >= 50 ? 'primary' : 'warning';

                return (
                  <div key={m.id} className="col-12 col-lg-6">
                    <div className="card h-100 border p-3 bg-white shadow-sm">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">
                            {cand.first_name} {cand.last_name}
                          </h6>
                          <div className="text-muted extra-small">
                            {cand.current_designation || 'Candidate'} &bull; {cand.current_company || 'Undisclosed'}
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1">
                          <StatusBadge status={m.status} />
                          {m.match_score && (
                            <span className={`badge bg-${scoreColor} extra-small`}>
                              {m.match_score}% Match
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Experience and Qualifications */}
                      <div className="text-muted small mb-2">
                        <div><strong>Experience:</strong> {cand.experience_years || 0} years</div>
                        <div><strong>Qualification:</strong> {cand.qualification || 'N/A'}</div>
                        <div><strong>Location:</strong> {cand.current_location || cand.city || 'N/A'}</div>
                      </div>

                      {/* Contact Info (Masked if not confirmed) */}
                      <div className={`p-2 rounded small mb-3 ${isConfirmed ? 'bg-success-subtle border border-success-subtle' : 'bg-light'}`}>
                        {isConfirmed ? (
                          <div>
                            <div className="text-success fw-semibold extra-small mb-1">
                              ✓ Contact Unlocked (Hired)
                            </div>
                            <div><strong>Email:</strong> {cand.email}</div>
                            <div><strong>Phone:</strong> {cand.mobile}</div>
                          </div>
                        ) : (
                          <div className="text-muted extra-small">
                            <div><strong>Email:</strong> {cand.email}</div>
                            <div><strong>Phone:</strong> {cand.mobile}</div>
                            <span className="text-secondary fst-italic">
                              (Contact unmasks upon final confirmation)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {cand.skills && (
                        <div className="mb-3 d-flex flex-wrap gap-1">
                          {cand.skills.split(',').slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="badge bg-light text-secondary border">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-auto pt-2 border-top d-flex gap-2 justify-content-end flex-wrap">
                        {m.status !== 'confirmed' && m.status !== 'rejected' && (
                          <>
                            {m.status !== 'shortlisted' && (
                              <button
                                className="btn btn-outline-primary btn-sm"
                                disabled={actionLoading}
                                onClick={() => handleReviewStatus(m.id, 'shortlisted')}
                              >
                                Shortlist
                              </button>
                            )}

                            {m.status !== 'hold' && (
                              <button
                                className="btn btn-outline-warning btn-sm"
                                disabled={actionLoading}
                                onClick={() => handleReviewStatus(m.id, 'hold')}
                              >
                                Hold
                              </button>
                            )}

                            <button
                              className="btn btn-outline-danger btn-sm"
                              disabled={actionLoading}
                              onClick={() => {
                                setSelectedMapping(m);
                                setActiveModal('reject');
                              }}
                            >
                              Reject
                            </button>

                            <button
                              className="btn btn-success btn-sm px-3"
                              disabled={actionLoading || remainingPositions === 0}
                              onClick={() => {
                                setSelectedMapping(m);
                                setActiveModal('confirm');
                              }}
                            >
                              Confirm / Hire
                            </button>
                          </>
                        )}

                        {m.status === 'confirmed' && (
                          <span className="badge bg-success-subtle text-success border border-success px-3 py-2">
                            ✓ Confirmed for Hire
                          </span>
                        )}

                        {m.status === 'rejected' && (
                          <span className="badge bg-danger-subtle text-danger border border-danger px-3 py-2">
                            Rejected ({m.company_remarks || 'No remarks'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION / HIRE MODAL */}
      {activeModal === 'confirm' && selectedMapping && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">Confirm Candidate for Hire</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setActiveModal(null)}
                />
              </div>
              <div className="modal-body p-4">
                <p>
                  You are confirming <strong>{selectedMapping.candidate?.first_name} {selectedMapping.candidate?.last_name}</strong> for the position of <strong>{job.title}</strong>.
                </p>
                <div className="alert alert-info small">
                  • <strong>Remaining Target:</strong> {remainingPositions} open position(s).<br />
                  • Confirming this candidate will consume 1 position and unmask full contact credentials.<br />
                  • When all {targetPositions} positions are confirmed, this requisition will automatically transition to <code>fulfilled</code>.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setActiveModal(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4"
                  disabled={actionLoading}
                  onClick={() => handleReviewStatus(selectedMapping.id, 'confirmed')}
                >
                  {actionLoading ? 'Confirming...' : 'Yes, Confirm & Hire'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {activeModal === 'reject' && selectedMapping && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Reject Candidate</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setActiveModal(null)}
                />
              </div>
              <div className="modal-body p-4">
                <p>
                  Reject <strong>{selectedMapping.candidate?.first_name} {selectedMapping.candidate?.last_name}</strong>?
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reason / Feedback (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectRemarks}
                    onChange={(e) => setRejectRemarks(e.target.value)}
                    placeholder="Enter rejection reason or feedback for recruitment staff..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setActiveModal(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-4"
                  disabled={actionLoading}
                  onClick={() => handleReviewStatus(selectedMapping.id, 'rejected', rejectRemarks)}
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Candidate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

