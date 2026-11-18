'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../services/api';
import StatusBadge from '../../../../components/ui/StatusBadge';
import ConfirmModal from '../../../../components/modals/ConfirmModal';

export default function CompanyJobDetailPage() {
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusModal, setStatusModal] = useState({ isOpen: false, status: null, title: '', message: '' });

  const fetchJob = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${jobId}`);
      if (res.data?.success) {
        setJob(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleStatusChange = async (nextStatus) => {
    try {
      const res = await api.patch(`/jobs/${jobId}/status`, { status: nextStatus });
      if (res.data?.success) {
        setJob(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setStatusModal({ isOpen: false, status: null, title: '', message: '' });
    }
  };

  if (loading) {
    return (
      <div className="container p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading job details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container p-4">
        <div className="alert alert-danger">{error || 'Job not found'}</div>
        <Link href="/company/jobs" className="btn btn-outline-secondary btn-sm">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link href="/company/jobs" className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Jobs
        </Link>
      </div>

      {/* Header Bar */}
      <div className="card shadow-sm border-0 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h3 fw-bold mb-0">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-muted small mb-0">
              <code>{job.job_code}</code> • Posted on {new Date(job.created_at).toLocaleDateString()}
              {job.last_date && ` • Last Date: ${new Date(job.last_date).toLocaleDateString()}`}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="d-flex gap-2 align-items-center">
            <Link
              href={`/company/jobs/${job.id}/candidates`}
              className="btn btn-sm btn-primary"
            >
              Review Candidates ({job.submitted_count || 0}) →
            </Link>
            {job.status === 'open' && (
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                onClick={() => setStatusModal({
                  isOpen: true,
                  status: 'on_hold',
                  title: 'Put Job On Hold',
                  message: 'Are you sure you want to pause hiring for this requisition?'
                })}
              >
                Pause Job
              </button>
            )}
            {job.status === 'on_hold' && (
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={() => handleStatusChange('open')}
              >
                Resume Hiring
              </button>
            )}
            {job.status !== 'closed' && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setStatusModal({
                  isOpen: true,
                  status: 'closed',
                  title: 'Close Job Requirement',
                  message: 'Are you sure you want to close this job requirement?'
                })}
              >
                Close Requisition
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 text-center">
            <span className="text-muted small text-uppercase fw-semibold">Positions Required</span>
            <span className="h3 fw-bold text-dark mt-1 mb-0">{job.positions_required}</span>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 text-center">
            <span className="text-muted small text-uppercase fw-semibold">Candidates Submitted</span>
            <span className="h3 fw-bold text-primary mt-1 mb-0">{job.submitted_count || 0}</span>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 text-center">
            <span className="text-muted small text-uppercase fw-semibold">Confirmed / Hired</span>
            <span className="h3 fw-bold text-success mt-1 mb-0">{job.confirmed_count || 0}</span>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 p-3 text-center">
            <span className="text-muted small text-uppercase fw-semibold">Remaining to Fill</span>
            <span className="h3 fw-bold text-warning mt-1 mb-0">{job.remaining_count ?? job.positions_required}</span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Job Specs */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h2 className="h5 fw-bold mb-3">Job Overview & Specification</h2>
            <div className="row g-3 small">
              <div className="col-md-6">
                <span className="text-muted d-block">Category:</span>
                <span className="fw-semibold">{job.job_category?.name || 'General'}</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Employment Type:</span>
                <span className="fw-semibold">{job.employment_type?.name || 'Full-time'}</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Experience:</span>
                <span className="fw-semibold">{job.experience_min} - {job.experience_max} Years</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Compensation:</span>
                <span className="fw-semibold">
                  {job.salary_min ? `₹${Number(job.salary_min).toLocaleString()} - ₹${Number(job.salary_max).toLocaleString()}` : 'Not Disclosed'}
                  {job.salary_negotiable && ' (Negotiable)'}
                </span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Minimum Qualification:</span>
                <span className="fw-semibold">{job.qualification?.name || 'Any Graduate'}</span>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4 pt-3 border-top">
              <h3 className="h6 fw-bold mb-2">Required Skills</h3>
              <div className="d-flex flex-wrap gap-2">
                {(!job.skills || job.skills.length === 0) ? (
                  <span className="text-muted small">No specific skills tagged.</span>
                ) : (
                  job.skills.map((s) => (
                    <span
                      key={s.id}
                      className={`badge p-2 ${s.is_mandatory ? 'bg-primary' : 'bg-light text-dark border'}`}
                      style={{ fontSize: '0.85rem' }}
                    >
                      {s.skill?.name || `Skill #${s.skill_id}`} {s.is_mandatory && '★ Mandatory'}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Description */}
            {job.description && (
              <div className="mt-4 pt-3 border-top">
                <h3 className="h6 fw-bold mb-2">Job Description</h3>
                <div className="small text-secondary" dangerouslySetInnerHTML={{ __html: job.description }} />
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <div className="mt-4 pt-3 border-top">
                <h3 className="h6 fw-bold mb-2">Key Responsibilities</h3>
                <div className="small text-secondary" dangerouslySetInnerHTML={{ __html: job.responsibilities }} />
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="mt-4 pt-3 border-top">
                <h3 className="h6 fw-bold mb-2">Benefits & Perks</h3>
                <div className="small text-secondary" dangerouslySetInnerHTML={{ __html: job.benefits }} />
              </div>
            )}
          </div>
        </div>

        {/* Candidate Pipeline Summary */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h2 className="h6 fw-bold mb-3">Staff Sourcing Team</h2>
            <div className="small">
              {job.assigned_user ? (
                <div>
                  <div className="fw-semibold">{job.assigned_user.name}</div>
                  <div className="text-muted">{job.assigned_user.email}</div>
                  <span className="badge bg-light text-primary border mt-2">Assigned Talent Recruiter</span>
                </div>
              ) : (
                <div className="text-muted">
                  A dedicated staff recruiter is being assigned to source and screen candidates for this requisition.
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0 p-4 text-center">
            <h2 className="h6 fw-bold mb-2">Candidate Submissions</h2>
            <p className="text-muted small mb-3">
              Review profiles submitted by our talent acquisition team.
            </p>
            <Link
              href={`/company/candidates?jobId=${job.id}`}
              className="btn btn-outline-primary btn-sm w-100"
            >
              Review Pipeline ({job.submitted_count || 0})
            </Link>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={statusModal.isOpen}
        title={statusModal.title}
        message={statusModal.message}
        onConfirm={() => handleStatusChange(statusModal.status)}
        onCancel={() => setStatusModal({ isOpen: false, status: null, title: '', message: '' })}
      />
    </div>
  );
}
