'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../services/api';
import StatusBadge from '../../../../components/ui/StatusBadge';

export default function AdminJobDetailPage() {
  const params = useParams();
  const jobId = params.id;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    try {
      const [jobRes, staffRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get('/users?role=staff&status=active&limit=100').catch(() => ({ data: { data: [] } }))
      ]);

      if (jobRes.data?.success) {
        const j = jobRes.data.data;
        setJob(j);
        setSelectedStaffId(j.assigned_to ? String(j.assigned_to) : '');
      }
      setStaffUsers(staffRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    setAssignLoading(true);
    setAssignSuccess(false);

    try {
      const res = await api.patch(`/jobs/${jobId}/assign-staff`, {
        assigned_to: selectedStaffId
      });
      if (res.data?.success) {
        setJob(res.data.data);
        setAssignSuccess(true);
        setTimeout(() => setAssignSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign staff');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading requisition details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">{error || 'Job not found'}</div>
        <Link href="/admin/jobs" className="btn btn-outline-secondary btn-sm">
          ← Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link href="/admin/jobs" className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Job Requisitions
        </Link>
      </div>

      {/* Header */}
      <div className="card shadow-sm border-0 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h3 fw-bold mb-0">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-muted small mb-0">
              <code>{job.job_code}</code> • Client: <strong>{job.company?.company_name}</strong> • Posted on {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              href={`/admin/jobs/${job.id}/candidates`}
              className="btn btn-primary btn-sm px-3"
            >
              Candidate Pipeline & Matching →
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
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
        {/* Specification */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h2 className="h5 fw-bold mb-3">Requisition Specification</h2>
            <div className="row g-3 small">
              <div className="col-md-6">
                <span className="text-muted d-block">Industry Sector:</span>
                <span className="fw-semibold">{job.company?.industry?.name || 'General Industry'}</span>
              </div>
              <div className="col-md-6">
                <span className="text-muted d-block">Job Category:</span>
                <span className="fw-semibold">{job.job_category?.name || 'N/A'}</span>
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
                <span className="text-muted d-block">Qualification:</span>
                <span className="fw-semibold">{job.qualification?.name || 'Any Graduate'}</span>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4 pt-3 border-top">
              <h3 className="h6 fw-bold mb-2">Tagged Skills</h3>
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
          </div>
        </div>

        {/* Staff Assignment & Actions */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h2 className="h6 fw-bold mb-3">Staff Recruiter Assignment</h2>
            {assignSuccess && (
              <div className="alert alert-success py-2 small mb-3">
                Staff recruiter assigned successfully!
              </div>
            )}
            <form onSubmit={handleAssignStaff}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Assigned Staff Member</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.email})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-outline-primary btn-sm w-100"
                disabled={assignLoading || !selectedStaffId}
              >
                {assignLoading ? 'Saving...' : 'Update Assignment'}
              </button>
            </form>
          </div>

          <div className="card shadow-sm border-0 p-4">
            <h2 className="h6 fw-bold mb-2">Client Company</h2>
            <div className="small">
              <div className="fw-semibold text-dark">{job.company?.company_name}</div>
              <div className="text-muted">{job.company?.contact_person} ({job.company?.contact_email})</div>
              <div className="text-muted">{job.company?.contact_mobile}</div>
              <Link href={`/admin/companies/${job.company?.id}`} className="btn btn-link btn-sm p-0 text-decoration-none mt-2">
                View Company Profile →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
