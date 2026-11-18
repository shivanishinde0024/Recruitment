'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import LocationCascade from '../../../../components/forms/LocationCascade';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Masters Data
  const [categories, setCategories] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    job_category_id: '',
    employment_type_id: '',
    qualification_id: '',
    experience_min: 1,
    experience_max: 3,
    salary_min: '',
    salary_max: '',
    salary_negotiable: false,
    positions_required: 1,
    last_date: '',
    country_id: '',
    state_id: '',
    city_id: '',
    description: '',
    responsibilities: '',
    benefits: ''
  });

  // Selected Skills State: [{ skill_id: number, is_mandatory: boolean }]
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [currentSkillId, setCurrentSkillId] = useState('');
  const [currentSkillMandatory, setCurrentSkillMandatory] = useState(false);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [catRes, empRes, qualRes, skillRes] = await Promise.all([
          api.get('/masters/job-categories?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/masters/employment-types?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/masters/qualifications?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/masters/skills?limit=100').catch(() => ({ data: { data: [] } }))
        ]);
        setCategories(catRes.data?.data || []);
        setEmploymentTypes(empRes.data?.data || []);
        setQualifications(qualRes.data?.data || []);
        setAvailableSkills(skillRes.data?.data || []);
      } catch {
        // Fallback silently
      }
    };
    fetchMasters();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
        { skill_id: parseInt(currentSkillId, 10), is_mandatory: currentSkillMandatory }
      ]);
      setCurrentSkillId('');
      setCurrentSkillMandatory(false);
    }
  };

  const handleRemoveSkill = (skillId) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend validation
    if (Number(formData.experience_max) < Number(formData.experience_min)) {
      setError('Maximum experience cannot be less than minimum experience');
      return;
    }
    if (formData.salary_min && formData.salary_max && Number(formData.salary_max) < Number(formData.salary_min)) {
      setError('Maximum salary cannot be less than minimum salary');
      return;
    }
    if (Number(formData.positions_required) < 1) {
      setError('Positions required must be at least 1');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        skills: selectedSkills
      };

      const res = await api.post('/jobs', payload);
      if (res.data?.success) {
        router.push(`/company/jobs/${res.data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job requirement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link href="/company/jobs" className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Jobs
        </Link>
      </div>

      <div className="card shadow-sm border-0 p-4">
        <div className="mb-4 border-bottom pb-3">
          <h1 className="h3 fw-bold mb-1">Post New Job Requirement</h1>
          <p className="text-muted small mb-0">
            Define requirements, skills, experience, and compensation to begin receiving matched candidate submissions.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger small mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* 1. Job Title */}
            <div className="col-md-8">
              <label className="form-label small fw-semibold">Job Title *</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Senior Frontend Engineer (React/Next.js)"
              />
            </div>

            {/* 2. Category */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Job Category</label>
              <select
                name="job_category_id"
                className="form-select"
                value={formData.job_category_id}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 3. Employment Type & Qualification */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Employment Type</label>
              <select
                name="employment_type_id"
                className="form-select"
                value={formData.employment_type_id}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                {employmentTypes.map((et) => (
                  <option key={et.id} value={et.id}>{et.name}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold">Minimum Qualification</label>
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

            {/* 4. Experience & Positions */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Experience Min (Years)</label>
              <input
                type="number"
                name="experience_min"
                className="form-control"
                value={formData.experience_min}
                onChange={handleChange}
                min="0"
                step="0.5"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Experience Max (Years)</label>
              <input
                type="number"
                name="experience_max"
                className="form-control"
                value={formData.experience_max}
                onChange={handleChange}
                min="0"
                step="0.5"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Positions Required *</label>
              <input
                type="number"
                name="positions_required"
                className="form-control"
                value={formData.positions_required}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            {/* 5. Compensation */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold">Salary Min (Annual)</label>
              <input
                type="number"
                name="salary_min"
                className="form-control"
                value={formData.salary_min}
                onChange={handleChange}
                placeholder="e.g. 500000"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-semibold">Salary Max (Annual)</label>
              <input
                type="number"
                name="salary_max"
                className="form-control"
                value={formData.salary_max}
                onChange={handleChange}
                placeholder="e.g. 1000000"
              />
            </div>

            <div className="col-md-4 d-flex align-items-center">
              <div className="form-check mt-3">
                <input
                  type="checkbox"
                  id="salary_negotiable"
                  name="salary_negotiable"
                  className="form-check-input"
                  checked={formData.salary_negotiable}
                  onChange={handleChange}
                />
                <label htmlFor="salary_negotiable" className="form-check-label small fw-semibold">
                  Salary Negotiable
                </label>
              </div>
            </div>

            {/* 6. Location & Deadline */}
            <div className="col-12 mt-4">
              <h2 className="h6 fw-bold mb-2">Job Location</h2>
              <LocationCascade
                countryId={formData.country_id}
                stateId={formData.state_id}
                cityId={formData.city_id}
                onChange={handleCascadeChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-semibold">Last Date to Apply</label>
              <input
                type="date"
                name="last_date"
                className="form-control"
                value={formData.last_date}
                onChange={handleChange}
              />
            </div>

            {/* 7. Skills Selector */}
            <div className="col-12 mt-4 border-top pt-3">
              <h2 className="h6 fw-bold mb-2">Required Skills & Technologies</h2>
              <div className="row g-2 align-items-center mb-3">
                <div className="col-md-6">
                  <select
                    className="form-select form-select-sm"
                    value={currentSkillId}
                    onChange={(e) => setCurrentSkillId(e.target.value)}
                  >
                    <option value="">Select a skill to add...</option>
                    {availableSkills.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-auto">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="currentSkillMandatory"
                      className="form-check-input"
                      checked={currentSkillMandatory}
                      onChange={(e) => setCurrentSkillMandatory(e.target.checked)}
                    />
                    <label htmlFor="currentSkillMandatory" className="form-check-label small">
                      Mandatory Skill
                    </label>
                  </div>
                </div>
                <div className="col-auto">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleAddSkill}
                    disabled={!currentSkillId}
                  >
                    + Add Skill
                  </button>
                </div>
              </div>

              {/* Selected skills pills */}
              <div className="d-flex flex-wrap gap-2">
                {selectedSkills.map((s) => {
                  const skillName = availableSkills.find((item) => item.id === s.skill_id)?.name || `Skill #${s.skill_id}`;
                  return (
                    <span
                      key={s.skill_id}
                      className={`badge d-flex align-items-center gap-2 p-2 ${
                        s.is_mandatory ? 'bg-primary' : 'bg-secondary'
                      }`}
                      style={{ fontSize: '0.85rem' }}
                    >
                      {skillName} {s.is_mandatory && '★'}
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

            {/* 8. Rich Text Descriptions */}
            <div className="col-12 mt-4 border-top pt-3">
              <h2 className="h6 fw-bold mb-3">Job Description & Details</h2>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Job Description</label>
                <textarea
                  name="description"
                  rows="4"
                  className="form-control"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Overview of the role and objectives..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Roles & Responsibilities</label>
                <textarea
                  name="responsibilities"
                  rows="3"
                  className="form-control"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  placeholder="Key responsibilities and day-to-day deliverables..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Benefits & Perks</label>
                <textarea
                  name="benefits"
                  rows="2"
                  className="form-control"
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="Health insurance, remote flexibility, learning stipends..."
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-top text-end">
            <Link href="/company/jobs" className="btn btn-outline-secondary me-2">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary px-4" disabled={loading}>
              {loading ? 'Creating Requirement...' : 'Publish Job Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
