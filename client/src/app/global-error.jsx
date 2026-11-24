'use client';

import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-4">
        <div className="text-center" style={{ maxWidth: '480px' }}>
          <h2 className="h4 text-danger mb-2">Application Error</h2>
          <p className="text-muted small mb-4">{error?.message || 'A critical error occurred.'}</p>
          <button onClick={() => reset()} className="btn btn-primary btn-sm px-4">
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}

