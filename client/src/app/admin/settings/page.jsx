'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../../services/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    auto_approve_company: 'false',
    default_lock_minutes: '15',
    max_failed_logins: '5',
    jwt_access_expiry_minutes: '15',
    hide_candidate_contact_until_confirmed: 'true',
    smtp_host: 'smtp.example.com',
    smtp_port: '587',
    smtp_user: 'no-reply@portal.com',
    smtp_pass: '',
    mail_from: 'Recruitment Portal <no-reply@portal.com>'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/settings');
      if (res.data?.success) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.put('/settings', settings);
      if (res.data?.success) {
        setMessage('System configuration saved and applied successfully.');
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      alert('Please enter a valid email address to receive the test message.');
      return;
    }

    setTestEmailLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.post('/settings/test-email', {
        to: testEmailRecipient,
        subject: 'Recruitment Portal SMTP Test Probe'
      });

      if (res.data?.success) {
        setMessage(`Test email successfully sent to ${testEmailRecipient}.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'SMTP test email failed');
    } finally {
      setTestEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading system settings...</div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">System Configuration & Policies</h1>
          <p className="text-muted small mb-0">
            Runtime platform controls, security lockout thresholds, and SMTP mail delivery routing
          </p>
        </div>
        <Link href="/admin/dashboard" className="btn btn-outline-secondary btn-sm">
          ← Dashboard
        </Link>
      </div>

      {message && <div className="alert alert-success alert-dismissible fade show">{message}</div>}
      {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}

      <form onSubmit={handleSave}>
        <div className="row g-4 mb-4">
          {/* Security & Access Policies */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h5 className="fw-bold text-dark mb-3">🛡️ Security & Authentication Controls</h5>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Max Failed Login Attempts</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.max_failed_logins}
                  onChange={(e) => handleChange('max_failed_logins', e.target.value)}
                  min="3"
                  max="20"
                  required
                />
                <div className="form-text extra-small text-muted">
                  Consecutive password failures before account is locked with HTTP 423 (Flow F12).
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Lockout Duration (Minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.default_lock_minutes}
                  onChange={(e) => handleChange('default_lock_minutes', e.target.value)}
                  min="5"
                  max="1440"
                  required
                />
                <div className="form-text extra-small text-muted">
                  Account remains locked until this time expires.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">JWT Access Token Expiry (Minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.jwt_access_expiry_minutes}
                  onChange={(e) => handleChange('jwt_access_expiry_minutes', e.target.value)}
                  min="5"
                  max="60"
                  required
                />
              </div>

              <div className="form-check form-switch mt-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="maskContactSwitch"
                  checked={settings.hide_candidate_contact_until_confirmed === 'true'}
                  onChange={(e) => handleChange('hide_candidate_contact_until_confirmed', String(e.target.checked))}
                />
                <label className="form-check-label small fw-semibold" htmlFor="maskContactSwitch">
                  Mask Candidate Contact Until Hired (Master §9.7)
                </label>
                <div className="form-text extra-small text-muted">
                  Prevents employers from circumventing the portal by masking candidate emails and phone numbers.
                </div>
              </div>
            </div>
          </div>

          {/* Employer Verification Rules */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm border-0 p-4 h-100">
              <h5 className="fw-bold text-dark mb-3">🏢 Employer Verification Rules</h5>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="autoApproveSwitch"
                  checked={settings.auto_approve_company === 'true'}
                  onChange={(e) => handleChange('auto_approve_company', String(e.target.checked))}
                />
                <label className="form-check-label small fw-semibold" htmlFor="autoApproveSwitch">
                  Auto-Approve Company Registrations
                </label>
                <div className="form-text extra-small text-muted">
                  When enabled, newly registered companies are automatically approved without staff review.
                </div>
              </div>

              <div className="alert alert-light border small mt-3">
                <strong>Legal Reverification Rule:</strong> If an approved company alters its legal entity identifier (GST or PAN), the system immediately resets verification status and flags <code>needs_reverification = true</code> (Ruling 3.9).
              </div>
            </div>
          </div>

          {/* SMTP & Email Delivery Settings */}
          <div className="col-12">
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold text-dark mb-3">✉️ SMTP Notification Transport</h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">SMTP Host</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.smtp_host}
                    onChange={(e) => handleChange('smtp_host', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">SMTP Port</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.smtp_port}
                    onChange={(e) => handleChange('smtp_port', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">SMTP Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.smtp_user}
                    onChange={(e) => handleChange('smtp_user', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">SMTP Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={settings.smtp_pass}
                    onChange={(e) => handleChange('smtp_pass', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Default Sender Address (From)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.mail_from}
                    onChange={(e) => handleChange('mail_from', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Live SMTP Probe Test */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="fw-bold small text-dark mb-2">Live SMTP Connectivity Test</h6>
                <div className="input-group" style={{ maxWidth: '500px' }}>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    placeholder="recipient@example.com"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    disabled={testEmailLoading}
                    onClick={handleSendTestEmail}
                  >
                    {testEmailLoading ? 'Sending...' : 'Send Test Probe'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2">
          <button
            type="submit"
            className="btn btn-primary px-4 py-2 fw-semibold"
            disabled={saving}
          >
            {saving ? 'Saving System Policies...' : 'Save Configuration Changes'}
          </button>
        </div>
      </form>
    </>
  );
}

