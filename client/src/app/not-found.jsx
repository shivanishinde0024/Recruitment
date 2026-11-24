import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
      <h1 className="display-4 fw-bold text-primary">404</h1>
      <h2 className="h5 mb-2 text-dark">Page Not Found</h2>
      <p className="text-muted small mb-4">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="d-flex gap-2 justify-content-center">
        <Link href="/" className="btn btn-primary btn-sm px-3">
          Landing Page
        </Link>
        <Link href="/login" className="btn btn-outline-secondary btn-sm px-3">
          Login
        </Link>
      </div>
    </div>
  );
}

