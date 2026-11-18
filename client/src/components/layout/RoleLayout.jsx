'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

export default function RoleLayout({ children }) {
  const { loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-2 text-muted small">Loading session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex min-vh-100">
      <div className="d-none d-md-block">
        <Sidebar />
      </div>

      <div className="flex-grow-1 d-flex flex-column min-vh-100" style={{ maxWidth: '100vw' }}>
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow-1 p-4" style={{ backgroundColor: 'var(--rp-surface-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
