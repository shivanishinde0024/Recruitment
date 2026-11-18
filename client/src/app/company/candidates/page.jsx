'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '../../../services/api';
import StatusBadge from '../../../components/ui/StatusBadge';

const resolveTitle = (j) => {
  if (!j) return 'Job Requisition';
  if (typeof j.custom_title === 'string' && j.custom_title.trim()) return j.custom_title;
  if (typeof j.title === 'string' && j.title.trim()) return j.title;
  if (j.title && typeof j.title.name === 'string') return j.title.name;
  return j.job_code || 'Job Requisition';
};

const resolveCandidateName = (c) => {
  if (!c) return 'Candidate';
  if (c.candidate_name) return c.candidate_name;
  if (c.candidate?.name) return c.candidate.name;
  const fullName = `${c.candidate?.first_name || ''} ${c.candidate?.last_name || ''}`.trim();
  return fullName || 'Candidate';
};

const resolveDesignation = (c) => {
  const cand = c?.candidate || c;
  if (typeof cand?.current_designation === 'string' && cand.current_designation.trim()) return cand.current_designation;
  if (typeof cand?.designation === 'string' && cand.designation.trim()) return cand.designation;
  if (cand?.designation && typeof cand.designation.name === 'string') return cand.designation.name;
  return 'Candidate';
};

function CandidateOverviewContent() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams?.get('jobId') || 'all';

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterJob, setFilterJob] = useState(initialJobId);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sync url param if it changes
  useEffect(() => {
    if (searchParams?.get('jobId')) {
      setFilterJob(searchParams.get('jobId'));
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get company jobs
        const jobsRes = await api.get('/jobs');
        const jobsList = jobsRes.data?.data || [];
        setJobs(jobsList);

        // Fetch candidate mappings for all jobs
        const allCandidates = [];
        for (const j of jobsList) {
          try {
            const mapRes = await api.get(`/mappings?job_id=${j.id}`);
            if (mapRes.data?.success && Array.isArray(mapRes.data.data)) {
              mapRes.data.data.forEach((m) => {
                allCandidates.push({
                  ...m,
                  job_code: j.job_code,
                  job_title: resolveTitle(j),
                  job_id: j.id
                });
              });
            }
          } catch (err) {
            // ignore individual job mapping error
          }
        }
        setCandidates(allCandidates);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load candidates.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = candidates.filter((c) => {
    if (filterJob !== 'all' && String(c.job_id) !== String(filterJob)) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = resolveCandidateName(c).toLowerCase();
      const jTitle = (typeof c.job_title === 'string' ? c.job_title : '').toLowerCase();
      return name.includes(term) || jTitle.includes(term);
    }
    return true;
  });

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1">Candidate Review Center</h1>
          <p className="text-muted small mb-0">Overview of all candidate submissions across your active job requisitions</p>
        </div>
        <Link href="/company/jobs" className="btn btn-outline-primary btn-sm">
          View All Requisitions
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* Filters Bar */}
      <div className="rp-card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search candidate or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={filterJob}
              onChange={(e) => setFilterJob(e.target.value)}
            >
              <option value="all">All Job Requisitions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.job_code} - {resolveTitle(j)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="viewed">Viewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="confirmed">Confirmed (Hired)</option>
              <option value="hold">On Hold</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="rp-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading candidates...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <div className="fs-1 mb-2">👥</div>
            <h5>No candidates found</h5>
            <p className="small mb-0">No candidate submissions match your selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Candidate</th>
                  <th>Requisition</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th>Contact Details</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const candidateName = resolveCandidateName(c);
                  const isConfirmed = c.status === 'confirmed';

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="fw-semibold">{candidateName}</div>
                        <div className="text-muted small">
                          {resolveDesignation(c)}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold small">{c.job_title}</div>
                        <span className="badge bg-light text-dark font-monospace">{c.job_code}</span>
                      </td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {c.match_score || 0}% match
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td>
                        {isConfirmed ? (
                          <div className="small">
                            <div>📧 {c.candidate?.email || 'N/A'}</div>
                            <div>📞 {c.candidate?.mobile || 'N/A'}</div>
                          </div>
                        ) : (
                          <span className="text-muted small fst-italic">
                            🔒 Masked until confirmed
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <Link
                          href={`/company/jobs/${c.job_id}/candidates`}
                          className="btn btn-sm btn-primary"
                        >
                          Review Candidate
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanyCandidateOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-5 text-center text-muted">
          <div className="spinner-border text-primary spinner-border-sm" role="status" />
          <div className="small mt-2">Loading review center...</div>
        </div>
      }
    >
      <CandidateOverviewContent />
    </Suspense>
  );
}
