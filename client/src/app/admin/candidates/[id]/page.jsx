'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../services/api';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { useAuth } from '../../../../context/AuthContext';

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = params.id;
  const { user } = useAuth();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCandidate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/candidates/${candidateId}`);
      if (res.data?.success) {
        setCandidate(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidate profile');
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  if (loading) {
    return (
      <div className="container p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading candidate profile...</div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="container p-4">
        <div className="alert alert-danger">{error || 'Candidate not found'}</div>
        <Link href="/admin/candidates" className="btn btn-outline-secondary btn-sm">
          ← Back to Candidates
        </Link>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || (user?.role === 'staff' && String(candidate.uploaded_by) === String(user.id));

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link href="/admin/candidates" className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Candidates
        </Link>
      </div>

      {/* Header */}
      <div className="card shadow-sm border-0 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h3 fw-bold mb-0">{candidate.name}</h1>
              <StatusBadge status={candidate.status} />
            </div>
            <p className="text-muted small mb-0">
              {candidate.current_designation || 'Candidate'} {candidate.current_company ? `at ${candidate.current_company}` : ''}
              {candidate.uploader && ` • Uploaded by ${candidate.uploader.name}`}
            </p>
          </div>

          <div className="d-flex gap-2">
            {candidate.resume_path && (
              <a
                href={`/api/v1/candidates/${candidate.id}/resume`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm px-3"
              >
                📄 Download Resume
              </a>
            )}
            <Link
              href={`/admin/jobs?mapCandidate=${candidate.id}`}
              className="btn btn-primary btn-sm px-3"
            >
              Map to Job Requisition →
            </Link>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Profile Info */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h2 className="h5 fw-bold mb-3">Professional Overview</h2>
            <div className="row g-3 small">
              <div className="col-md-6">
                <span className="text-muted d-block">Email Address:</span>
                <span className="fw-semibold">{candidate.email}</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Mobile Number:</span>
                <span className="fw-semibold">{candidate.mobile}</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Experience:</span>
                <span className="fw-semibold">{candidate.experience_years} Years</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Highest Qualification:</span>
                <span className="fw-semibold">{candidate.qualification?.name || 'N/A'}</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Current Salary:</span>
                <span className="fw-semibold">
                  {candidate.current_salary ? `₹${Number(candidate.current_salary).toLocaleString()} / yr` : 'Not Disclosed'}
                </span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Expected Salary:</span>
                <span className="fw-semibold">
                  {candidate.expected_salary ? `₹${Number(candidate.expected_salary).toLocaleString()} / yr` : 'Not Disclosed'}
                </span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Notice Period:</span>
                <span className="fw-semibold">{candidate.notice_period_days} Days</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Source:</span>
                <span className="fw-semibold">{candidate.source?.name || 'Direct Upload'}</span>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4 pt-3 border-top">
              <h3 className="h6 fw-bold mb-2">Technical Competencies & Ratings</h3>
              <div className="d-flex flex-wrap gap-2">
                {(!candidate.skills || candidate.skills.length === 0) ? (
                  <span className="text-muted small">No skills tagged for this profile.</span>
                ) : (
                  candidate.skills.map((s) => (
                    <span
                      key={s.id}
                      className="badge bg-primary p-2 d-flex align-items-center gap-1"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {s.skill?.name || `Skill #${s.skill_id}`}
                      <span className="text-warning">{'★'.repeat(s.rating || 3)}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Location */}
            {candidate.address && (
              <div className="mt-4 pt-3 border-top">
                <h3 className="h6 fw-bold mb-1">Address & Location</h3>
                <p className="text-secondary small mb-0">
                  {candidate.address} {candidate.pincode ? `(${candidate.pincode})` : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ownership & Audit Column */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h2 className="h6 fw-bold mb-3">Ownership & Permissions</h2>
            <div className="small mb-3">
              <span className="text-muted d-block">Uploaded By:</span>
              <strong>{candidate.uploader?.name || 'Staff'}</strong> ({candidate.uploader?.email})
            </div>
            <div className="small mb-3">
              <span className="text-muted d-block">Created On:</span>
              <span>{new Date(candidate.created_at).toLocaleString()}</span>
            </div>
            {!canEdit && (
              <div className="alert alert-secondary small mb-0 py-2">
                ℹ Per Ruling 3.8, only the uploading staff member or an administrator may modify this candidate profile.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

