'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import LocationCascade from '../../../components/forms/LocationCascade';

const TOTAL_STEPS = 5;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Master dropdown data
  const [industries, setIndustries] = useState([]);
  const [companyTypes, setCompanyTypes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',

    // Step 2: Company Info
    company_name: '',
    industry_id: '',
    company_type_id: '',
    gst_no: '',
    pan_no: '',
    cin_no: '',
    company_size: '11-50',
    registration_year: new Date().getFullYear(),
    website: '',

    // Step 3: Location
    address: '',
    country_id: '',
    state_id: '',
    city_id: '',
    pincode: '',

    // Step 4: Contact Person
    contact_person: '',
    contact_designation: '',
    contact_email: '',
    contact_mobile: ''
  });

  // Files state
  const [files, setFiles] = useState({
    logo: null,
    gst_doc: null,
    pan_doc: null,
    incorporation_doc: null
  });

  useEffect(() => {
    // Fetch industries and company types for dropdowns
    const fetchMasters = async () => {
      try {
        const [indRes, typeRes] = await Promise.all([
          api.get('/masters/industries?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/masters/company-types?limit=100').catch(() => ({ data: { data: [] } }))
        ]);
        setIndustries(indRes.data?.data || []);
        setCompanyTypes(typeRes.data?.data || []);
      } catch {
        // Fallback gracefully
      }
    };
    fetchMasters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleCascadeChange = ({ countryId, stateId, cityId }) => {
    setFormData((prev) => ({
      ...prev,
      country_id: countryId || '',
      state_id: stateId || '',
      city_id: cityId || ''
    }));
  };

  const validateCurrentStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
        setError('Please fill in all required account fields.');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.company_name) {
        setError('Company name is required.');
        return false;
      }
    } else if (step === 4) {
      if (!formData.contact_person || !formData.contact_email || !formData.contact_mobile) {
        setError('Please fill in all required contact person fields.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      // Append text fields
      Object.entries(formData).forEach(([key, val]) => {
        if (key !== 'confirmPassword' && val !== '' && val !== null) {
          data.append(key, val);
        }
      });

      // Append file attachments
      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          data.append(key, file);
        }
      });

      const res = await api.post('/auth/register-company', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your submission.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-6">
            <div className="card shadow-sm border-0 p-4 text-center">
              <div className="text-success mb-3" style={{ fontSize: '3rem' }}>✓</div>
              <h2 className="h4 fw-bold mb-2">Registration Submitted</h2>
              <p className="text-muted small mb-4">
                Thank you for registering <strong>{formData.company_name}</strong>. Your account has been created with status <strong>Pending Verification</strong>.
                Our compliance and verification team will review your business credentials and uploaded documents.
              </p>
              <div className="alert alert-info small text-start mb-4">
                <strong>Next Steps:</strong>
                <ul className="mb-0 ps-3 mt-1">
                  <li>You will receive an email once your verification status is updated.</li>
                  <li>Once approved, you will be able to sign in and start posting job requirements.</li>
                </ul>
              </div>
              <Link href="/login" className="btn btn-primary px-4 py-2">
                Return to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4">
            {/* Header & Stepper */}
            <div className="mb-4">
              <h1 className="h3 fw-bold mb-1">Company Registration</h1>
              <p className="text-muted small mb-3">
                Join our enterprise recruitment portal to find and hire top talent.
              </p>

              {/* Step indicator */}
              <div className="d-flex justify-content-between position-relative mb-4">
                {['Account', 'Company', 'Address', 'Contact', 'Documents'].map((label, idx) => {
                  const stepNum = idx + 1;
                  const isActive = step === stepNum;
                  const isDone = step > stepNum;
                  return (
                    <div key={label} className="text-center position-relative" style={{ zIndex: 1, flex: 1 }}>
                      <div
                        className={`rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold mb-1 ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : isDone
                            ? 'bg-success text-white'
                            : 'bg-light text-secondary border'
                        }`}
                        style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                      >
                        {isDone ? '✓' : stepNum}
                      </div>
                      <span className={`small ${isActive ? 'fw-bold text-primary' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small mb-4" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={step === TOTAL_STEPS ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
              {/* STEP 1: User Account */}
              {step === 1 && (
                <div>
                  <h2 className="h5 fw-bold mb-3">1. Portal Admin Account</h2>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Account Owner Name *</label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Work Email (Login ID) *</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="hr@company.com"
                      />
                    </div>
                    <div className="col-md-6">
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
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Password *</label>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Min 8 characters"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Company Details */}
              {step === 2 && (
                <div>
                  <h2 className="h5 fw-bold mb-3">2. Company Profile</h2>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Company Name *</label>
                      <input
                        type="text"
                        name="company_name"
                        className="form-control"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Acme Corporation"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Industry Sector</label>
                      <select
                        name="industry_id"
                        className="form-select"
                        value={formData.industry_id}
                        onChange={handleChange}
                      >
                        <option value="">Select Industry</option>
                        {industries.map((ind) => (
                          <option key={ind.id} value={ind.id}>{ind.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Company Type</label>
                      <select
                        name="company_type_id"
                        className="form-select"
                        value={formData.company_type_id}
                        onChange={handleChange}
                      >
                        <option value="">Select Type</option>
                        {companyTypes.map((ct) => (
                          <option key={ct.id} value={ct.id}>{ct.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Company Size</label>
                      <select
                        name="company_size"
                        className="form-select"
                        value={formData.company_size}
                        onChange={handleChange}
                      >
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">GST Number</label>
                      <input
                        type="text"
                        name="gst_no"
                        className="form-control text-uppercase"
                        value={formData.gst_no}
                        onChange={handleChange}
                        placeholder="27AAAAA0000A1Z5"
                        maxLength="15"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">PAN Number</label>
                      <input
                        type="text"
                        name="pan_no"
                        className="form-control text-uppercase"
                        value={formData.pan_no}
                        onChange={handleChange}
                        placeholder="AAAAA0000A"
                        maxLength="10"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">CIN Number</label>
                      <input
                        type="text"
                        name="cin_no"
                        className="form-control text-uppercase"
                        value={formData.cin_no}
                        onChange={handleChange}
                        placeholder="U12345MH2020PTC123456"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Registration Year</label>
                      <input
                        type="number"
                        name="registration_year"
                        className="form-control"
                        value={formData.registration_year}
                        onChange={handleChange}
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Website</label>
                      <input
                        type="url"
                        name="website"
                        className="form-control"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Address & Location */}
              {step === 3 && (
                <div>
                  <h2 className="h5 fw-bold mb-3">3. Location & Registered Office</h2>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Street Address</label>
                      <textarea
                        name="address"
                        className="form-control"
                        rows="2"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Suite / Floor, Building, Street address"
                      />
                    </div>
                    <div className="col-12">
                      <LocationCascade
                        countryId={formData.country_id}
                        stateId={formData.state_id}
                        cityId={formData.city_id}
                        onChange={handleCascadeChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">PIN / Postal Code</label>
                      <input
                        type="text"
                        name="pincode"
                        className="form-control"
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="e.g. 400001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Contact Person */}
              {step === 4 && (
                <div>
                  <h2 className="h5 fw-bold mb-3">4. Authorized Contact Person</h2>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Contact Person Name *</label>
                      <input
                        type="text"
                        name="contact_person"
                        className="form-control"
                        value={formData.contact_person}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Jane Smith"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Designation / Role</label>
                      <input
                        type="text"
                        name="contact_designation"
                        className="form-control"
                        value={formData.contact_designation}
                        onChange={handleChange}
                        placeholder="e.g. Head of Talent Acquisition"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Contact Email *</label>
                      <input
                        type="email"
                        name="contact_email"
                        className="form-control"
                        value={formData.contact_email}
                        onChange={handleChange}
                        required
                        placeholder="jane@company.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Contact Mobile *</label>
                      <input
                        type="tel"
                        name="contact_mobile"
                        className="form-control"
                        value={formData.contact_mobile}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 9876543211"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Verification Documents */}
              {step === 5 && (
                <div>
                  <h2 className="h5 fw-bold mb-3">5. Verification Documents & Review</h2>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Company Logo (JPG/PNG, max 2MB)</label>
                      <input
                        type="file"
                        name="logo"
                        className="form-control"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">GST Certificate (PDF/Image)</label>
                      <input
                        type="file"
                        name="gst_doc"
                        className="form-control"
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">PAN Card Document (PDF/Image)</label>
                      <input
                        type="file"
                        name="pan_doc"
                        className="form-control"
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Certificate of Incorporation (PDF/Image)</label>
                      <input
                        type="file"
                        name="incorporation_doc"
                        className="form-control"
                        accept="application/pdf,image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="border rounded p-3 bg-light mb-3">
                    <h3 className="h6 fw-bold mb-2">Review Submission Summary</h3>
                    <div className="row small">
                      <div className="col-sm-6 mb-1"><strong>Company:</strong> {formData.company_name}</div>
                      <div className="col-sm-6 mb-1"><strong>Owner:</strong> {formData.name} ({formData.email})</div>
                      <div className="col-sm-6 mb-1"><strong>GST / PAN:</strong> {formData.gst_no || 'N/A'} / {formData.pan_no || 'N/A'}</div>
                      <div className="col-sm-6 mb-1"><strong>Contact Person:</strong> {formData.contact_person} ({formData.contact_email})</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                {step > 1 ? (
                  <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>
                    ← Back
                  </button>
                ) : (
                  <Link href="/login" className="btn btn-link text-decoration-none small">
                    Already registered? Sign in
                  </Link>
                )}

                {step < TOTAL_STEPS ? (
                  <button type="button" className="btn btn-primary px-4" onClick={nextStep}>
                    Continue →
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? 'Submitting Registration...' : 'Complete Registration'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
