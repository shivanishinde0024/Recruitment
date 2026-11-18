'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../../services/api';
import StatusBadge from '../../../../../components/ui/StatusBadge';

export default function AdminJobCandidatesMappingPage() {
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState(null);
  const [activeTab, setActiveTab] = useState('suggested'); // 'suggested' | 'mapped'
  const [suggestedCandidates, setSuggestedCandidates] = useState([]);
  const [mappedCandidates, setMappedCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  
  const [loadingJob, setLoadingJob] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Fetch Job Details
  const fetchJob = useCallback(async () => {
    setLoadingJob(true);
    try {
      const res = await api.get(`/jobs/${jobId}`);
      if (res.data?.success) {
        setJob(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoadingJob(false);
    }
  }, [jobId]);

  // Fetch Suggested Candidates
  const fetchSuggested = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get(`/jobs/${jobId}/suggested-candidates?minScore=10`);
      if (res.data?.success) {
        setSuggestedCandidates(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoadingList(false);
    }
  }, [jobId]);

  // Fetch Mapped Candidates
  const fetchMapped = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get(`/mappings?job_id=${jobId}`);
      if (res.data?.success) {
        setMappedCandidates(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load mappings:', err);
    } finally {
      setLoadingList(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    if (activeTab === 'suggested') {
      fetchSuggested();
    } else {
      fetchMapped();
    }
  }, [activeTab, fetchSuggested, fetchMapped]);

  // Handle Candidate Selection for Mapping
  const toggleSelectCandidate = (candId) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const selectAllSuggested = () => {
    if (selectedCandidateIds.length === suggestedCandidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(suggestedCandidates.map((c) => c.candidate.id));
    }
  };

  // Submit Candidate Mapping
  const handleMapCandidates = async () => {
    if (selectedCandidateIds.length === 0) return;
    setActionLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.post('/mappings', {
        job_id: jobId,
        candidate_ids: selectedCandidateIds
      });

      if (res.data?.success) {
        setMessage(`Successfully mapped ${res.data.data.mapped_count} candidate(s).`);
        setSelectedCandidateIds([]);
        fetchSuggested();
        fetchMapped();
        fetchJob();
        setActiveTab('mapped');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to map candidates');
    } finally {
      setActionLoading(false);
    }
  };

  // Withdraw Submitted Candidate
  const handleWithdraw = async (mappingId) => {
    if (!confirm('Are you sure you want to withdraw this candidate mapping?')) return;
    setActionLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.post(`/mappings/${mappingId}/withdraw`, {
        remark: 'Withdrawn by recruitment staff'
      });
      if (res.data?.success) {
        setMessage('Candidate mapping withdrawn successfully.');
        fetchMapped();
        fetchJob();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to withdraw candidate mapping');
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="container-fluid p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading requisition workspace...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">{error || 'Job not found'}</div>
        <Link href="/admin/jobs" className="btn btn-outline-secondary btn-sm">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  const confirmedCount = job.confirmed_count || 0;
  const remainingPositions = Math.max(0, job.no_of_positions - confirmedCount);

  return (
    <div className="container-fluid p-4">
      {/* Navigation Breadcrumb */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <Link href={`/admin/jobs/${jobId}`} className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Requisition ({job.job_code})
        </Link>
        <span className="badge bg-light text-dark border">
          Staff Console
        </span>
      </div>

      {/* Requisition Status Card */}
      <div className="card shadow-sm border-0 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-secondary font-monospace">{job.job_code}</span>
              <h4 className="fw-bold mb-0 text-dark">{job.title}</h4>
              <StatusBadge status={job.status} />
            </div>
            <div className="text-muted small">
              <strong>Company:</strong> {job.company?.name || 'Unknown'} &bull; <strong>Department:</strong> {job.department?.name || 'General'} &bull; <strong>Location:</strong> {job.location || 'Not specified'}
            </div>
          </div>

          {/* Positions stats pills */}
          <div className="d-flex gap-3 text-center">
            <div className="border rounded px-3 py-2 bg-light">
              <div className="text-muted extra-small text-uppercase fw-semibold">Target</div>
              <div className="fs-5 fw-bold text-dark">{job.no_of_positions}</div>
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

        {remainingPositions === 0 && (
          <div className="alert alert-success mt-3 mb-0 py-2 small">
            🎉 All positions for this job requisition have been fulfilled and confirmed!
          </div>
        )}
      </div>

      {/* Notification Alerts */}
      {message && <div className="alert alert-success alert-dismissible fade show">{message}</div>}
      {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}

      {/* Tabs */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom pt-3 pb-0">
          <ul className="nav nav-tabs card-header-tabs border-0">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'suggested' ? 'active text-primary border-primary border-bottom-0' : 'text-muted'}`}
                onClick={() => setActiveTab('suggested')}
              >
                Suggested Candidates ({suggestedCandidates.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'mapped' ? 'active text-primary border-primary border-bottom-0' : 'text-muted'}`}
                onClick={() => setActiveTab('mapped')}
              >
                Mapped Pipeline ({mappedCandidates.length})
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4">
          {/* TAB 1: SUGGESTED CANDIDATES */}
          {activeTab === 'suggested' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h6 className="fw-bold mb-1">Algorithmic Candidate Matches</h6>
                  <p className="text-muted small mb-0">
                    Ranked by weighted criteria: 50% Skills, 25% Experience, 15% Location, 10% Qualification.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={selectAllSuggested}
                    disabled={suggestedCandidates.length === 0}
                  >
                    {selectedCandidateIds.length === suggestedCandidates.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm px-3"
                    disabled={selectedCandidateIds.length === 0 || actionLoading || remainingPositions === 0}
                    onClick={handleMapCandidates}
                  >
                    {actionLoading ? 'Mapping...' : `Map Selected (${selectedCandidateIds.length}) to Job`}
                  </button>
                </div>
              </div>

              {loadingList ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary spinner-border-sm" role="status" />
                  <div className="text-muted small mt-2">Calculating match scores...</div>
                </div>
              ) : suggestedCandidates.length === 0 ? (
                <div className="text-center py-5 border rounded bg-light">
                  <p className="text-muted mb-2">No unmapped candidates match this job criteria.</p>
                  <Link href="/admin/candidates/create" className="btn btn-outline-primary btn-sm">
                    + Register New Candidate
                  </Link>
                </div>
              ) : (
                <div className="row g-3">
                  {suggestedCandidates.map(({ candidate, score, breakdown }) => {
                    const isSelected = selectedCandidateIds.includes(candidate.id);
                    const scoreColor = score >= 75 ? 'success' : score >= 50 ? 'primary' : 'warning';

                    return (
                      <div key={candidate.id} className="col-12 col-lg-6">
                        <div
                          className={`card h-100 border p-3 cursor-pointer transition-all ${
                            isSelected ? 'border-primary bg-primary-subtle shadow-sm' : 'bg-white'
                          }`}
                          onClick={() => toggleSelectCandidate(candidate.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex align-items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0"
                                checked={isSelected}
                                onChange={() => {}} // Controlled by outer card click
                              />
                              <h6 className="fw-bold mb-0 text-dark">
                                {candidate.first_name} {candidate.last_name}
                              </h6>
                            </div>
                            <span className={`badge bg-${scoreColor} px-2 py-1 fs-6`}>
                              {score}% Match
                            </span>
                          </div>

                          <div className="text-muted small mb-2">
                            <div><strong>Exp:</strong> {candidate.experience_years || 0} years &bull; <strong>Qual:</strong> {candidate.qualification || 'N/A'}</div>
                            <div><strong>Location:</strong> {candidate.current_location || candidate.city || 'Not specified'}</div>
                          </div>

                          {/* Match breakdown breakdown */}
                          <div className="bg-light p-2 rounded small mb-2 extra-small text-muted d-flex justify-content-between">
                            <span>Skills: {breakdown?.skills || 0}%</span>
                            <span>Exp: {breakdown?.experience || 0}%</span>
                            <span>Loc: {breakdown?.location || 0}%</span>
                            <span>Qual: {breakdown?.qualification || 0}%</span>
                          </div>

                          {candidate.skills && (
                            <div className="mt-auto pt-2 d-flex flex-wrap gap-1">
                              {candidate.skills.split(',').slice(0, 4).map((skill, idx) => (
                                <span key={idx} className="badge bg-light text-secondary border">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MAPPED CANDIDATES */}
          {activeTab === 'mapped' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Pipeline Review and Status</h6>
                <button className="btn btn-outline-secondary btn-sm" onClick={fetchMapped}>
                  Refresh Pipeline
                </button>
              </div>

              {loadingList ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary spinner-border-sm" role="status" />
                  <div className="text-muted small mt-2">Loading pipeline...</div>
                </div>
              ) : mappedCandidates.length === 0 ? (
                <div className="text-center py-5 border rounded bg-light">
                  <p className="text-muted mb-2">No candidates have been mapped to this job yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('suggested')}>
                    View Suggested Candidates
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th>Candidate</th>
                        <th>Experience</th>
                        <th>Match Score</th>
                        <th>Status</th>
                        <th>Mapped Date</th>
                        <th>Remarks</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappedCandidates.map((m) => {
                        const cand = m.candidate || {};
                        return (
                          <tr key={m.id}>
                            <td>
                              <div className="fw-bold text-dark">
                                {cand.first_name} {cand.last_name}
                              </div>
                              <div className="text-muted small">{cand.email}</div>
                            </td>
                            <td>{cand.experience_years ? `${cand.experience_years} yrs` : 'N/A'}</td>
                            <td>
                              <span className="badge bg-info text-dark">
                                {m.match_score ? `${m.match_score}%` : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={m.status} />
                            </td>
                            <td className="small text-muted">
                              {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="small text-muted">
                              {m.company_remarks || m.remarks || '-'}
                            </td>
                            <td className="text-end">
                              {m.status === 'submitted' ? (
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  disabled={actionLoading}
                                  onClick={() => handleWithdraw(m.id)}
                                >
                                  Withdraw
                                </button>
                              ) : (
                                <span className="text-muted extra-small">Locked ({m.status})</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

