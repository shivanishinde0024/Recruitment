'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import api from '../../../../services/api';
import StatusBadge from '../../../../components/ui/StatusBadge';
import ConfirmModal from '../../../../components/modals/ConfirmModal';
import RemarkModal from '../../../../components/modals/RemarkModal';

export default function AdminCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id;

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Modals state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, title: '', message: '' });
  const [remarkModal, setRemarkModal] = useState({ isOpen: false, action: null, title: '', label: '' });

  const fetchCompanyDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}`);
      if (res.data?.success) {
        setCompany(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  const executeVerification = async (action, remark = '') => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/companies/${companyId}/verify`, {
        action,
        remark: remark || undefined
      });
      if (res.data?.success) {
        setCompany(res.data.data);
        toast.success(res.data?.message || `Company verification status updated to '${res.data?.data?.status || action}'`);
        await fetchCompanyDetails();
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to perform verification action '${action}'`;
      toast.error(msg);
    } finally {
      setActionLoading(false);
      setConfirmModal({ isOpen: false, action: null, title: '', message: '' });
      setRemarkModal({ isOpen: false, action: null, title: '', label: '' });
    }
  };

  const handleApprove = () => {
    setConfirmModal({
      isOpen: true,
      action: 'approve',
      title: 'Approve Company Registration',
      message: `Are you sure you want to approve '${company?.company_name}'? The company will be notified and granted access to post job requirements.`
    });
  };

  const handleReject = () => {
    setRemarkModal({
      isOpen: true,
      action: 'reject',
      title: 'Reject Company Registration',
      label: 'Please state the mandatory compliance reason for rejecting this company registration:'
    });
  };

  const handleNeedInfo = () => {
    setRemarkModal({
      isOpen: true,
      action: 'need_info',
      title: 'Request Additional Information',
      label: 'Specify what documents or details the company must provide:'
    });
  };

  const handleSuspend = () => {
    setRemarkModal({
      isOpen: true,
      action: 'suspend',
      title: 'Suspend Company Account',
      label: 'Mandatory reason for suspending this company profile:'
    });
  };

  const handleReactivate = () => {
    setConfirmModal({
      isOpen: true,
      action: 'reactivate',
      title: 'Reactivate Company Account',
      message: `Are you sure you want to reactivate '${company?.company_name}'? The company will regain active status.`
    });
  };

  if (loading) {
    return (
      <div className="container-fluid p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading company profile...</div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger">{error || 'Company not found'}</div>
        <Link href="/admin/companies" className="btn btn-outline-secondary btn-sm">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Breadcrumb & Navigation */}
      <div className="mb-3">
        <Link href="/admin/companies" className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Companies Directory
        </Link>
      </div>

      {/* Header Profile Bar */}
      <div className="card shadow-sm border-0 mb-4 p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h3 fw-bold mb-0">{company.company_name}</h1>
              <StatusBadge status={company.status} />
              {company.needs_reverification && (
                <span className="badge bg-warning text-dark border border-warning">
                  ⚠ Reverification Required
                </span>
              )}
            </div>
            <p className="text-muted small mb-0">
              {company.industry?.name || 'General Industry'} • Registered on {new Date(company.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons for Compliance Review */}
          <div className="d-flex flex-wrap gap-2">
            {['pending', 'need_info', 'rejected'].includes(company.status) && (
              <button
                type="button"
                className="btn btn-success btn-sm px-3"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                ✓ Approve Company
              </button>
            )}

            {['pending', 'need_info'].includes(company.status) && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-warning btn-sm px-3"
                  onClick={handleNeedInfo}
                  disabled={actionLoading}
                >
                  Need Info
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm px-3"
                  onClick={handleReject}
                  disabled={actionLoading}
                >
                  Reject
                </button>
              </>
            )}

            {company.status === 'approved' && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm px-3"
                onClick={handleSuspend}
                disabled={actionLoading}
              >
                Suspend Account
              </button>
            )}

            {company.status === 'suspended' && (
              <button
                type="button"
                className="btn btn-outline-primary btn-sm px-3"
                onClick={handleReactivate}
                disabled={actionLoading}
              >
                Reactivate Account
              </button>
            )}
          </div>
        </div>

        {company.needs_reverification && (
          <div className="alert alert-warning small mb-0 mt-3">
            <strong>Compliance Alert:</strong> This company edited their legal registration details (Company Name, GST, or PAN) while approved. Please inspect their compliance documents and verify.
          </div>
        )}
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'profile' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Company Profile
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'documents' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents ({company.documents?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'history' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Verification History
          </button>
        </li>
      </ul>

      {/* TAB 1: Profile Overview */}
      {activeTab === 'profile' && (
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h2 className="h5 fw-bold mb-3">Corporate Details</h2>
              <div className="table-responsive">
                <table className="table table-borderless table-sm mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: '40%' }}>Company Name:</td>
                      <td className="fw-semibold">{company.company_name}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Industry:</td>
                      <td>{company.industry?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Company Type:</td>
                      <td>{company.company_type?.name || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">GST Number:</td>
                      <td><code>{company.gst_no || 'Not Provided'}</code></td>
                    </tr>
                    <tr>
                      <td className="text-muted">PAN Number:</td>
                      <td><code>{company.pan_no || 'Not Provided'}</code></td>
                    </tr>
                    <tr>
                      <td className="text-muted">CIN Number:</td>
                      <td><code>{company.cin_no || 'Not Provided'}</code></td>
                    </tr>
                    <tr>
                      <td className="text-muted">Registration Year:</td>
                      <td>{company.registration_year || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Company Size:</td>
                      <td>{company.company_size ? `${company.company_size} employees` : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Website:</td>
                      <td>
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer">
                            {company.website}
                          </a>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h2 className="h5 fw-bold mb-3">Contact & Address</h2>
              <div className="table-responsive mb-4">
                <table className="table table-borderless table-sm mb-0">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: '40%' }}>Contact Person:</td>
                      <td className="fw-semibold">{company.contact_person}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Designation:</td>
                      <td>{company.contact_designation || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Contact Email:</td>
                      <td><a href={`mailto:${company.contact_email}`}>{company.contact_email}</a></td>
                    </tr>
                    <tr>
                      <td className="text-muted">Contact Mobile:</td>
                      <td><a href={`tel:${company.contact_mobile}`}>{company.contact_mobile}</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="h6 fw-bold mb-2">Registered Office Address</h2>
              <p className="text-secondary small mb-0">
                {company.address || 'No street address specified'}
                <br />
                {company.pincode ? `Postal Code: ${company.pincode}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Documents */}
      {activeTab === 'documents' && (
        <div className="card shadow-sm border-0 p-4">
          <h2 className="h5 fw-bold mb-3">Compliance & Verification Documents</h2>
          {(!company.documents || company.documents.length === 0) ? (
            <div className="text-center text-muted py-5 small">
              No documents uploaded by this company yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light small">
                  <tr>
                    <th>Document Type</th>
                    <th>File Name</th>
                    <th>Uploaded Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {company.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="fw-semibold text-uppercase small">{doc.doc_type}</td>
                      <td className="small">{doc.original_name}</td>
                      <td className="small text-muted">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td>
                        <a
                          href={`/api/v1/companies/${company.id}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          Download / View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Verification History Timeline */}
      {activeTab === 'history' && (
        <div className="card shadow-sm border-0 p-4">
          <h2 className="h5 fw-bold mb-3">Verification Audit Trail</h2>
          {(!company.verification_logs || company.verification_logs.length === 0) ? (
            <div className="text-center text-muted py-5 small">
              No verification logs recorded yet.
            </div>
          ) : (
            <div className="timeline">
              {company.verification_logs.map((log) => (
                <div key={log.id} className="border-start border-2 border-primary ps-3 pb-4 position-relative">
                  <div
                    className="position-absolute bg-primary rounded-circle"
                    style={{ width: '10px', height: '10px', left: '-6px', top: '4px' }}
                  />
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold small">
                      Status changed from <StatusBadge status={log.old_status} /> to <StatusBadge status={log.new_status} />
                    </span>
                    <span className="text-muted small">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  {log.user && (
                    <div className="text-muted small mb-1">
                      Action taken by: <strong>{log.user.name}</strong> ({log.user.role})
                    </div>
                  )}
                  {log.remark && (
                    <div className="alert alert-light border small mb-0 mt-2 py-2">
                      <strong>Remark:</strong> {log.remark}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        show={confirmModal.isOpen}
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        confirmVariant={confirmModal.action === 'approve' ? 'success' : 'primary'}
        loading={actionLoading}
        onHide={() => setConfirmModal({ isOpen: false, action: null, title: '', message: '' })}
        onConfirm={() => executeVerification(confirmModal.action)}
        onCancel={() => setConfirmModal({ isOpen: false, action: null, title: '', message: '' })}
      />

      {/* Mandatory Remark Modal */}
      <RemarkModal
        show={remarkModal.isOpen}
        isOpen={remarkModal.isOpen}
        title={remarkModal.title}
        label={remarkModal.label}
        actionLabel={remarkModal.action === 'reject' ? 'Reject Company' : remarkModal.action === 'suspend' ? 'Suspend Account' : 'Submit Request'}
        actionVariant={remarkModal.action === 'reject' || remarkModal.action === 'suspend' ? 'danger' : 'warning'}
        required={true}
        loading={actionLoading}
        onHide={() => setRemarkModal({ isOpen: false, action: null, title: '', label: '' })}
        onSubmit={(remark) => executeVerification(remarkModal.action, remark)}
        onConfirm={(remark) => executeVerification(remarkModal.action, remark)}
        onCancel={() => setRemarkModal({ isOpen: false, action: null, title: '', label: '' })}
      />
    </div>
  );
}

