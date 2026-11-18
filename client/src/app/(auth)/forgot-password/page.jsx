'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMsg(null);

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/forgot-password', { email });
      setStatusMessage(
        res.data?.message || 'If that email is registered, a password reset link has been sent.'
      );
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit password reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="rp-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '2.5rem' }}>🔐</div>
          <h1 className="h4 fw-bold mt-2 mb-1">Reset Password</h1>
          <p className="text-muted small">Enter your email to receive a secure recovery link</p>
        </div>

        {statusMessage && (
          <div className="alert alert-success py-2 small" role="alert">
            {statusMessage}
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger py-2 small" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Registered Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 mt-2 fw-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sending Reset Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top text-center">
          <Link href="/login" className="small fw-semibold text-decoration-none text-primary">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

