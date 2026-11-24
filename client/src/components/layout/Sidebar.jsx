'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ onNavigate, onClose, isDrawer = false }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const routeRole = pathname?.startsWith('/staff') ? 'staff' : (pathname?.startsWith('/company') ? 'company' : 'admin');
  const role = user?.role || routeRole;

  const navItems = {
    admin: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      { label: 'Inquiries & Leads', href: '/admin/inquiries', icon: '📥' },
      { label: 'Companies', href: '/admin/companies', icon: '🏢' },
      { label: 'Job Orders', href: '/admin/jobs', icon: '📋' },
      { label: 'Candidates', href: '/admin/candidates', icon: '👥' },
      { label: 'Staff Management', href: '/admin/staff', icon: '👔' },
      { label: 'Master Tables', href: '/admin/masters/skills', icon: '⚙️' },
      { label: 'Reports & Analytics', href: '/admin/reports', icon: '📈' },
      { label: 'Audit Logs', href: '/admin/audit', icon: '📜' },
      { label: 'Settings', href: '/admin/settings', icon: '🔧' },
      { label: 'Trash Archive', href: '/admin/trash', icon: '🗑️' }
    ],
    staff: [
      { label: 'My Dashboard', href: '/staff/dashboard', icon: '📊' },
      { label: 'Assigned Jobs', href: '/staff/jobs', icon: '📋' },
      { label: 'Company Verification', href: '/staff/companies', icon: '🏢' },
      { label: 'Candidate Pool', href: '/staff/candidates', icon: '👥' },
      { label: 'Bulk Resume Upload', href: '/staff/candidates/bulk-upload', icon: '📤' },
      { label: 'Performance Report', href: '/staff/reports', icon: '📈' }
    ],
    company: [
      { label: 'Hiring Overview', href: '/company/dashboard', icon: '📊' },
      { label: 'Post a Job', href: '/company/jobs/new', icon: '➕' },
      { label: 'My Requirements', href: '/company/jobs', icon: '📋' },
      { label: 'Candidate Review', href: '/company/candidates', icon: '👥' },
      { label: 'Company Profile', href: '/company/profile', icon: '🏢' }
    ]
  };

  const currentNav = navItems[role] || navItems.admin;

  return (
    <aside className={`rp-sidebar ${isDrawer ? 'rp-sidebar-in-drawer' : ''}`}>
      <div className="rp-sidebar-header d-flex align-items-center justify-content-between">
        <Link
          href="/"
          className="d-flex align-items-center gap-2 text-decoration-none text-white rp-brand-link"
          title="Return to SQA Landing Page"
          onClick={() => {
            if (onNavigate) onNavigate();
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
          <span>Recruitment Portal</span>
        </Link>
        {onClose && (
          <button
            type="button"
            className="rp-mobile-drawer-close d-md-none"
            onClick={onClose}
            aria-label="Close menu drawer"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="rp-sidebar-nav">
        {currentNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rp-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (onNavigate) onNavigate();
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="border-top border-secondary border-opacity-25 my-2"></div>
        <Link
          href="/"
          className="rp-nav-item text-info text-decoration-none"
          onClick={() => {
            if (onNavigate) onNavigate();
          }}
        >
          <span>🌐</span>
          <span>SQA Academy Page</span>
        </Link>
      </nav>

      <div className="p-3 border-top border-secondary border-opacity-25 small text-secondary">
        <div>Role: <strong className="text-white text-uppercase">{role}</strong></div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Version 1.0.0 Production</div>
      </div>
    </aside>
  );
}
