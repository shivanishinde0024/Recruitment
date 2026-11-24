'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../ui/StatusBadge';
import NotificationBell from './NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const routeRole = pathname?.startsWith('/admin')
    ? 'admin'
    : pathname?.startsWith('/staff')
    ? 'staff'
    : pathname?.startsWith('/company')
    ? 'company'
    : null;
  const currentRole = user?.role || routeRole || 'admin';
  const displayName = user?.name || (currentRole === 'admin' ? 'System Administrator' : (currentRole === 'staff' ? 'Staff Recruiter' : (currentRole === 'company' ? 'Company Manager' : 'User')));

  return (
    <header className="rp-navbar">
      <div className="d-flex align-items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-md-none"
            onClick={onToggleSidebar}
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
        )}
        <div className="text-muted small d-none d-sm-block">
          Enterprise Staffing & Placement Engine
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {user?.company && (
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-semibold">{user.company.name}</span>
            <StatusBadge status={user.company.status} />
          </div>
        )}

        {user && <NotificationBell />}

        <div className="d-flex align-items-center gap-2">
          <div className="text-end d-none d-sm-block">
            <a
              href={`/${currentRole}/profile`}
              className="fw-semibold small text-decoration-none text-dark hover-primary"
              title="Account Settings & Profile"
            >
              {displayName}
            </a>
            <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {currentRole}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
