'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App Router Caught Error:', error);
  }, [error]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
      <div className="card shadow-sm p-4 border-0" style={{ maxWidth: '480px', width: '100%', borderRadius: '16px' }}>
        <div style={{ fontSize: '2.5rem' }}>⚠️</div>
        <h2 className="h5 fw-bold text-dark mt-2 mb-1">Temporary Loading Issue</h2>
        <p className="text-muted small mb-4">
          {error?.message || 'An error occurred while rendering this page.'}
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <button
            onClick={() => reset()}
            className="btn btn-primary btn-sm px-3"
          >
            Try Again
          </button>
          <Link href="/" className="btn btn-outline-secondary btn-sm px-3">
            Go to Landing Page
          </Link>
          <Link href="/login" className="btn btn-outline-primary btn-sm px-3">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

