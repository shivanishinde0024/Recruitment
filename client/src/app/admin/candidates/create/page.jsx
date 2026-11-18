'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import LocationCascade from '../../../../components/forms/LocationCascade';

export default function CreateCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Masters
  const [qualifications, setQualifications] = useState([]);
  const [sources, setSources] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    gender: 'male',
    dob: '',
    qualification_id: '',
    experience_years: 0,
    current_company: '',
    current_designation: '',
    current_salary: '',
    expected_salary: '',
    notice_period_days: 30,
    address: '',
    country_id: '',
    state_id: '',
    city_id: '',
    pincode: '',
    source_id: ''
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [currentSkillId, setCurrentSkillId] = useState('');
  const [currentSkillRating, setCurrentSkillRating] = useState(3);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [qualRes, srcRes, skillRes] = await Promise.all([
          api.get('/masters/qualifications?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/masters/candidate-sources?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/masters/skills?limit=100').catch(() => ({ data: { data: [] } }))
        ]);
        setQualifications(qualRes.data?.data || []);
        setSources(srcRes.data?.data || []);
        setAvailableSkills(skillRes.data?.data || []);
      } catch {
        // Fallback silently
      }
    };
    fetchMasters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCascadeChange = ({ countryId, stateId, cityId }) => {
    setFormData((prev) => ({
      ...prev,
      country_id: countryId || '',
      state_id: stateId || '',
      city_id: cityId || ''
    }));
  };

  const handleAddSkill = () => {
    if (!currentSkillId) return;
    const exists = selectedSkills.some((s) => String(s.skill_id) === String(currentSkillId));
    if (!exists) {
      setSelectedSkills((prev) => [
        ...prev,
        { skill_id: parseInt(currentSkillId, 10), rating: parseInt(currentSkillRating, 10) }
      ]);
      setCurrentSkillId('');
      setCurrentSkillRating(3);
    }
  };

  const handleRemoveSkill = (skillId) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (val !== '' && val !== null) {
          data.append(key, val);
        }
      });

      if (resumeFile) {
        data.append('resume', resumeFile);
      }

      // Append skills array as JSON
      selectedSkills.forEach((s, idx) => {
        data.append(`skills[${idx}][skill_id]`, s.skill_id);
        data.append(`skills[${idx}][rating]`, s.rating);
      });

      const res = await api.post('/candidates', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        router.push(`/admin/candidates/${res.data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create candidate profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link href="/admin/candidates" className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Candidates
        </Link>
      </div>

      <div className="card shadow-sm border-0 p-4">
        <div className="mb-4 border-bottom pb-3">
          <h1 className="h3 fw-bold mb-1">Add Candidate Profile</h1>
          <p className="text-muted small mb-0">
            Record candidate details, upload resumes, and tag technical competencies for algorithmic job matching.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger small mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Primary Details */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Full Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Email Address *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="candidate@example.com"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                className="form-control"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Gender</label>
              <select
                name="gender"
                className="form-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Date of Birth</label>
              <input
                type="date"
                name="dob"
                className="form-control"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Candidate Source</label>
              <select
                name="source_id"
                className="form-select"
                value={formData.source_id}
                onChange={handleChange}
              >
                <option value="">Select Source</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>{src.name}</option>
                ))}
              </select>
            </div>

            {/* Professional Background */}
            <div className="col-12 mt-4 border-top pt-3">
              <h2 className="h6 fw-bold mb-3">Professional Experience & Compensation</h2>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Total Experience (Years)</label>
              <input
                type="number"
                name="experience_years"
                className="form-control"
                value={formData.experience_years}
                onChange={handleChange}
                min="0"
                step="0.5"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Highest Qualification</label>
              <select
                name="qualification_id"
                className="form-select"
                value={formData.qualification_id}
                onChange={handleChange}
              >
                <option value="">Select Qualification</option>
                {qualifications.map((q) => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Notice Period (Days)</label>
              <input
                type="number"
                name="notice_period_days"
                className="form-control"
                value={formData.notice_period_days}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold">Current Employer / Company</label>
              <input
                type="text"
                name="current_company"
                className="form-control"
                value={formData.current_company}
                onChange={handleChange}
                placeholder="e.g. Tata Consultancy Services"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold">Current Designation / Role</label>
              <input
                type="text"
                name="current_designation"
                className="form-control"
                value={formData.current_designation}
                onChange={handleChange}
                placeholder="e.g. Lead Fullstack Engineer"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold">Current Annual Salary (₹)</label>
              <input
                type="number"
                name="current_salary"
                className="form-control"
                value={formData.current_salary}
                onChange={handleChange}
                placeholder="e.g. 900000"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold">Expected Annual Salary (₹)</label>
              <input
                type="number"
                name="expected_salary"
                className="form-control"
                value={formData.expected_salary}
                onChange={handleChange}
                placeholder="e.g. 1400000"
              />
            </div>

            {/* Location */}
            <div className="col-12 mt-4 border-top pt-3">
              <h2 className="h6 fw-bold mb-3">Address & Location</h2>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Street Address</label>
                <textarea
                  name="address"
                  rows="2"
                  className="form-control"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <LocationCascade
                countryId={formData.country_id}
                stateId={formData.state_id}
                cityId={formData.city_id}
                onChange={handleCascadeChange}
              />
            </div>

            {/* Resume Upload */}
            <div className="col-12 mt-4 border-top pt-3">
              <h2 className="h6 fw-bold mb-2">Resume Document</h2>
              <p className="text-muted small mb-2">Upload resume file (PDF, DOC, DOCX up to 5MB).</p>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Skills */}
            <div className="col-12 mt-4 border-top pt-3">
              <h2 className="h6 fw-bold mb-2">Tagged Skills & Competencies</h2>
              <div className="row g-2 align-items-center mb-3">
                <div className="col-md-6">
                  <select
                    className="form-select form-select-sm"
                    value={currentSkillId}
                    onChange={(e) => setCurrentSkillId(e.target.value)}
                  >
                    <option value="">Choose Skill...</option>
                    {availableSkills.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={currentSkillRating}
                    onChange={(e) => setCurrentSkillRating(e.target.value)}
                  >
                    <option value="1">1 - Beginner</option>
                    <option value="2">2 - Elementary</option>
                    <option value="3">3 - Intermediate</option>
                    <option value="4">4 - Advanced</option>
                    <option value="5">5 - Expert</option>
                  </select>
                </div>
                <div className="col-auto">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddSkill}
                    disabled={!currentSkillId}
                  >
                    + Tag Skill
                  </button>
                </div>
              </div>

              {/* Skills pills */}
              <div className="d-flex flex-wrap gap-2">
                {selectedSkills.map((s) => {
                  const sName = availableSkills.find((item) => item.id === s.skill_id)?.name || `Skill #${s.skill_id}`;
                  return (
                    <span
                      key={s.skill_id}
                      className="badge bg-primary d-flex align-items-center gap-2 p-2"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {sName} ({s.rating}★)
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        style={{ fontSize: '0.5rem' }}
                        onClick={() => handleRemoveSkill(s.skill_id)}
                        aria-label="Remove skill"
                      />
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-top text-end">
            <Link href="/admin/candidates" className="btn btn-outline-secondary me-2">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading ? 'Saving Profile...' : 'Create Candidate Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
