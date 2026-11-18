'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../services/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('Missing or invalid password reset token. Please request a new recovery link.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify and re-type.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/reset-password', {
        token,
        password
      });

      setStatusMessage(res.data?.message || 'Password has been reset successfully. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="rp-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '2.5rem' }}>🔑</div>
          <h1 className="h4 fw-bold mt-2 mb-1">Set New Password</h1>
          <p className="text-muted small">Choose a strong, secure password for your account</p>
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

        {!token && (
          <div className="alert alert-warning py-2 small mb-3">
            No reset token detected in the URL. Please ensure you followed the full link from your recovery email.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="At least 8 chars (upper, lower, number)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || !token}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting || !token}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2 mt-2 fw-semibold"
            disabled={submitting || !token}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top text-center">
          <Link href="/login" className="small fw-semibold text-decoration-none text-primary">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="d-flex align-items-center justify-content-center min-vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
