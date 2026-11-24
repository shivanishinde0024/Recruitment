'use client';

import React from 'react';
import Link from 'next/link';
import { Layout, Shield, Download, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopSystemBar({
  activeView,
  setActiveView,
  leadsCount = 4,
  onDownloadHtml
}) {
  const { user, logout } = useAuth();
  return (
    <nav
      id="top-system-bar"
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-xs shadow-sm"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
        {/* System Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
          <span className="text-slate-600 font-medium whitespace-nowrap">
            <strong className="text-slate-900 font-serif">SQA Full-Stack System</strong>
            <span className="text-slate-400 hidden xl:inline">
              : Front-End Launchpad + Express REST API Active
            </span>
          </span>
        </div>

        {/* Control Group: Switch Modes & Download File */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto no-scrollbar">
          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              id="btn-mode-frontend"
              type="button"
              onClick={() => setActiveView('frontend')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeView === 'frontend'
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Front-End Launchpad</span>
            </button>

            <button
              id="btn-mode-backend"
              type="button"
              onClick={() => setActiveView('backend')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeView === 'backend'
                  ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Back-End CRM Console</span>
              <span
                id="badge-leads-count"
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  activeView === 'backend'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/20 text-amber-700'
                }`}
              >
                {leadsCount}
              </span>
            </button>
          </div>

          {/* Download HTML File Button */}
          <button
            type="button"
            onClick={onDownloadHtml}
            title="Download this complete self-contained HTML website"
            className="px-3 py-1.5 rounded-xl font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow transition flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download HTML File</span>
            <span className="sm:hidden">Save</span>
          </button>

          {/* Auth State: Show User Profile & Dashboard link if logged in, else Portal Login */}
          {user ? (
            <div className="flex items-center bg-slate-900 text-white rounded-xl p-0.5 shadow transition border border-slate-800 shrink-0">
              <Link
                href={`/${user.role || 'admin'}/dashboard`}
                className="px-2.5 py-1.5 rounded-lg font-bold hover:bg-slate-800 transition flex items-center gap-1.5 text-decoration-none text-white text-xs whitespace-nowrap"
                title={`Open ${user.role?.toUpperCase()} Dashboard (${user.name || 'User'})`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span className="capitalize">{user.role || 'Admin'} Dashboard</span>
              </Link>
              <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
              <button
                type="button"
                onClick={logout}
                className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition flex items-center"
                title="Sign out of portal"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow transition flex items-center gap-1.5 text-decoration-none shrink-0 whitespace-nowrap"
              title="Corporate Staffing Portal"
            >
              <LogIn className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Portal Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
