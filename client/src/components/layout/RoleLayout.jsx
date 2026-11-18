'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

export default function RoleLayout({ children }) {
  const { loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer automatically when navigating between pages
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

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
    <div className="d-flex min-vh-100 rp-layout-container">
      {/* Desktop Static Sidebar (Visible on md and up) */}
      <div className="d-none d-md-block rp-desktop-sidebar-wrapper">
        <Sidebar />
      </div>

      {/* Mobile Drawer (Left drawer overlay for mobile view) */}
      {sidebarOpen && (
        <div
          className="rp-mobile-drawer-backdrop d-md-none"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`rp-mobile-drawer d-md-none ${sidebarOpen ? 'open' : ''}`}
        aria-label="Navigation Drawer"
        role="dialog"
        aria-modal="true"
      >
        <Sidebar
          isDrawer={true}
          onClose={() => setSidebarOpen(false)}
          onNavigate={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column min-vh-100 rp-main-wrapper" style={{ minWidth: 0 }}>
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-grow-1 p-3 p-md-4" style={{ backgroundColor: 'var(--rp-surface-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
