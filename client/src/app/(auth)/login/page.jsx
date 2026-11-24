'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('session_expired') === '1') {
        setSessionExpired(true);
      }
    }
  }, []);

  // If already authenticated, automatically redirect to appropriate dashboard
  useEffect(() => {
    if (!loading && user?.role && !sessionExpired) {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        if (redirectParam && redirectParam.startsWith(`/${user.role}`)) {
          router.replace(redirectParam);
          return;
        }
      }
      router.replace(`/${user.role}/dashboard`);
    }
  }, [user, loading, router, sessionExpired]);

  // While checking session or if already authenticated, display loading state to prevent flash of form
  if (!sessionExpired && (loading || user)) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <div className="text-muted small mt-2">Checking session...</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ email, password });
      toast.success('Signed in successfully');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="rp-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Link
            href="/"
            className="small text-muted text-decoration-none d-inline-flex align-items-center gap-1"
            title="Return to Landing Page"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="text-center mb-4">
          <div style={{ fontSize: '2.5rem' }}>🎯</div>
          <h1 className="h4 fw-bold mt-2 mb-1">Recruitment Portal</h1>
          <p className="text-muted small">Sign in to your enterprise account</p>
        </div>

        {sessionExpired && !errorMsg && (
          <div className="alert alert-warning py-2 small" role="alert">
            Your session has expired. Please sign in to continue.
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-danger py-2 small" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. admin@portal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold mb-0">Password</label>
              <Link href="/forgot-password" className="small text-decoration-none text-primary">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
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
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top text-center">
          <span className="small text-muted">New company looking to hire? </span>
          <Link href="/register" className="small fw-semibold text-decoration-none text-primary">
            Register Company
          </Link>
        </div>
      </div>
    </div>
  );
}
