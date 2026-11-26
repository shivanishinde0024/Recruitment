'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/ui/StatusBadge';
import LocationCascade from '../../../components/forms/LocationCascade';

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    website: '',
    company_size: '11-50',
    address: '',
    country_id: '',
    state_id: '',
    city_id: '',
    pincode: '',
    gst_no: '',
    pan_no: '',
    contact_person: '',
    contact_designation: '',
    contact_email: '',
    contact_mobile: ''
  });

  // Doc upload state
  const [newDocType, setNewDocType] = useState('gst');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // User me includes companyId or company.id
        const companyId = user?.companyId || user?.company?.id;
        if (!companyId) {
          setLoading(false);
          return;
        }
        const res = await api.get(`/companies/${companyId}`);
        if (res.data?.success) {
          const comp = res.data.data;
          setCompany(comp);
          setFormData({
            company_name: comp.company_name || '',
            website: comp.website || '',
            company_size: comp.company_size || '11-50',
            address: comp.address || '',
            country_id: comp.country_id || '',
            state_id: comp.state_id || '',
            city_id: comp.city_id || '',
            pincode: comp.pincode || '',
            gst_no: comp.gst_no ? comp.gst_no.toUpperCase() : '',
            pan_no: comp.pan_no ? comp.pan_no.toUpperCase() : '',
            contact_person: comp.contact_person || '',
            contact_designation: comp.contact_designation || '',
            contact_email: comp.contact_email || '',
            contact_mobile: comp.contact_mobile || ''
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue = ['gst_no', 'pan_no', 'cin_no'].includes(name)
      ? value.toUpperCase()
      : value;
    setFormData((prev) => ({ ...prev, [name]: normalizedValue }));
  };

  const handleCascadeChange = ({ countryId, stateId, cityId }) => {
    setFormData((prev) => ({
      ...prev,
      country_id: countryId || '',
      state_id: stateId || '',
      city_id: cityId || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.put(`/companies/${company.id}`, formData);
      if (res.data?.success) {
        setCompany(res.data.data);
        setMessage('Company profile updated successfully.');
        if (res.data.data.needs_reverification) {
          setMessage(
            'Profile updated. Core legal information was altered, so your account has been flagged for compliance re-verification.'
          );
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !company) return;

    setUploadingDoc(true);
    setError(null);
    setMessage(null);

    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('doc_type', newDocType);

      const res = await api.post(`/companies/${company.id}/documents`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setMessage('Document uploaded successfully.');
        setSelectedFile(null);
        // Refresh company documents
        const compRes = await api.get(`/companies/${company.id}`);
        if (compRes.data?.success) {
          setCompany(compRes.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="container p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Profile Header */}
      <div className="card shadow-sm border-0 mb-4 p-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h3 fw-bold mb-0">{company?.company_name}</h1>
              <StatusBadge status={company?.status} />
              {company?.needs_reverification && (
                <span className="badge bg-warning text-dark border border-warning">
                  ⚠ Reverification Required
                </span>
              )}
            </div>
            <p className="text-muted small mb-0">
              Manage your company information and compliance documents.
            </p>
          </div>
        </div>

        {company?.status === 'pending' && (
          <div className="alert alert-info small mt-3 mb-0">
            <strong>Verification In Progress:</strong> Your company profile is currently being reviewed by compliance staff.
          </div>
        )}

        {company?.status === 'need_info' && (
          <div className="alert alert-warning small mt-3 mb-0">
            <strong>Action Required:</strong> Compliance staff requested more information: <em>{company?.remark}</em>
          </div>
        )}
      </div>

      {message && <div className="alert alert-success small mb-4">{message}</div>}
      {error && <div className="alert alert-danger small mb-4">{error}</div>}

      <div className="row g-4">
        {/* Form Column */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 p-4">
            <h2 className="h5 fw-bold mb-3">Edit Company Information</h2>
            <form onSubmit={handleSubmit}>
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
                  />
                  <div className="form-text small" style={{ fontSize: '0.75rem' }}>
                    Note: Changing legal name requires compliance re-verification.
                  </div>
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

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">GST Number</label>
                  <input
                    type="text"
                    name="gst_no"
                    className="form-control text-uppercase"
                    value={formData.gst_no}
                    onChange={handleChange}
                    placeholder="27AAAAA0000A1Z5"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">PAN Number</label>
                  <input
                    type="text"
                    name="pan_no"
                    className="form-control text-uppercase"
                    value={formData.pan_no}
                    onChange={handleChange}
                    placeholder="AAAAA0000A"
                  />
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

                <div className="col-12">
                  <label className="form-label small fw-semibold">Office Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    className="form-control"
                    value={formData.address}
                    onChange={handleChange}
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
                  <label className="form-label small fw-semibold">Postal Code</label>
                  <input
                    type="text"
                    name="pincode"
                    className="form-control"
                    value={formData.pincode}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 border-top pt-3 mt-4">
                  <h3 className="h6 fw-bold mb-3">Primary Contact Person</h3>
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Contact Person *</label>
                  <input
                    type="text"
                    name="contact_person"
                    className="form-control"
                    value={formData.contact_person}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Designation</label>
                  <input
                    type="text"
                    name="contact_designation"
                    className="form-control"
                    value={formData.contact_designation}
                    onChange={handleChange}
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
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-top text-end">
                <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Documents Column */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 p-4 mb-4">
            <h2 className="h5 fw-bold mb-3">Upload Documents</h2>
            <form onSubmit={handleDocumentUpload}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Document Type</label>
                <select
                  className="form-select form-select-sm"
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                >
                  <option value="gst">GST Certificate</option>
                  <option value="pan">PAN Card</option>
                  <option value="incorporation">Certificate of Incorporation</option>
                  <option value="other">Other Supporting Document</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">File (PDF or Image, max 5MB)</label>
                <input
                  type="file"
                  className="form-control form-control-sm"
                  accept="application/pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-outline-primary btn-sm w-100"
                disabled={uploadingDoc || !selectedFile}
              >
                {uploadingDoc ? 'Uploading...' : 'Upload Attachment'}
              </button>
            </form>
          </div>

          <div className="card shadow-sm border-0 p-4">
            <h2 className="h6 fw-bold mb-3">Attached Documents</h2>
            {(!company?.documents || company.documents.length === 0) ? (
              <p className="text-muted small mb-0">No documents uploaded yet.</p>
            ) : (
              <ul className="list-group list-group-flush small">
                {company.documents.map((doc) => (
                  <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div>
                      <div className="fw-semibold text-uppercase" style={{ fontSize: '0.75rem' }}>{doc.doc_type}</div>
                      <div className="text-truncate text-muted" style={{ maxWidth: '160px' }}>{doc.original_name}</div>
                    </div>
                    <a
                      href={`/api/v1/companies/${company.id}/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

