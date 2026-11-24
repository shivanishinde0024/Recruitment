'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SqaMedallion from './SqaMedallion';
import { Sparkles, Rocket, Menu, X, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({
  onOpenConsultation,
  onOpenWizard,
  onSwitchToFrontend
}) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (anchorId) => {
    if (onSwitchToFrontend) onSwitchToFrontend();
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <header
      id="main-brand-header"
      className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 transition-[top] duration-150 w-full"
    >
      <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Logo & Motto (V3 Official Medallion) */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('hero');
          }}
          className="flex items-center gap-2 sm:gap-3 group shrink-0 text-decoration-none min-w-0"
        >
          <div id="header-logo-container" className="shrink-0 group-hover:scale-105 transition-transform">
            <SqaMedallion size="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11" />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-base sm:text-lg font-black font-serif tracking-tight text-slate-900 whitespace-nowrap">
                Success Quest
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-brand-teal px-1 sm:px-1.5 py-0.5 rounded bg-brand-teal/20 border border-brand-teal/40">
                Academy
              </span>
            </div>
            <p className="text-[10px] tracking-wider text-slate-400 font-semibold uppercase whitespace-nowrap mb-0 hidden lg:block">
              Nurturing Young Minds • Your Career Launchpad
            </p>
          </div>
        </a>

        {/* Desktop Navigation for About Us, 5 Pillars & Contact Us */}
        <nav className="hidden xl:flex items-center gap-0.5 bg-slate-100 p-1 rounded-full border border-slate-200 text-[10.5px] font-semibold text-slate-600 shrink min-w-0">
          <a
            href="#about-us"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('about-us');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-brand-teal transition font-bold text-slate-800"
          >
            About
          </a>
          <a
            href="#pillar-roadmap"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-roadmap');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-slate-900 transition"
          >
            Roadmap
          </a>
          <a
            href="#pillar-certifications"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-certifications');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-slate-900 transition"
          >
            <span className="hidden 2xl:inline">Skill </span>Certs
          </a>
          <a
            href="#pillar-softskills"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-softskills');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-slate-900 transition"
          >
            Soft Skills
          </a>
          <a
            href="#pillar-placements"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-placements');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-slate-900 transition"
          >
            <span className="hidden 2xl:inline">Internships &amp; </span>Placements
          </a>
          <a
            href="#pillar-startup"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-startup');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-slate-900 transition"
          >
            Start-up<span className="hidden 2xl:inline"> &amp; Research</span>
          </a>
          <a
            href="#interactive-launchpad"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('interactive-launchpad');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-emerald-700 transition text-emerald-700 font-bold"
          >
            Tools
          </a>
          <a
            href="#contact-us"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('contact-us');
            }}
            className="px-2 py-1 rounded-full whitespace-nowrap hover:bg-white hover:text-brand-teal transition font-bold text-slate-800"
          >
            Contact
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenWizard}
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Diagnostic</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenConsultation('Comprehensive Advisory', 'Launchpad Admission')}
            className="hidden sm:flex px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-gradient-to-r from-brand-teal to-brand-accent hover:brightness-110 shadow-sm transition items-center gap-1 whitespace-nowrap"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Launch Career</span>
          </button>

          {/* Portal Login / Dashboard Button */}
          {user ? (
            <div className="flex items-center bg-slate-900 text-white rounded-xl p-0.5 shadow transition border border-slate-800 shrink-0 text-xs">
              <Link
                href={`/${user.role || 'admin'}/dashboard`}
                className="px-2 sm:px-2.5 py-1.5 rounded-lg font-bold hover:bg-slate-800 transition flex items-center gap-1.5 text-decoration-none text-white text-xs whitespace-nowrap"
                title={`Open ${user.role?.toUpperCase()} Dashboard (${user.name || 'User'})`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0"></span>
                <span className="capitalize hidden md:inline">{user.role || 'Admin'} Dashboard</span>
                <span className="capitalize md:hidden">Dashboard</span>
              </Link>
              <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
              <button
                type="button"
                onClick={logout}
                className="px-1.5 sm:px-2 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition flex items-center"
                title="Sign out of portal"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow transition flex items-center gap-1.5 text-decoration-none shrink-0 text-xs whitespace-nowrap"
              title="Corporate Staffing Portal"
            >
              <LogIn className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="hidden sm:inline">Portal Login</span>
              <span className="sm:hidden">Login</span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-2 shadow-lg">
          <a
            href="#about-us"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('about-us');
            }}
            className="block py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-teal"
          >
            About Us
          </a>
          <a
            href="#pillar-roadmap"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-roadmap');
            }}
            className="block py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-teal"
          >
            1. Career Roadmap
          </a>
          <a
            href="#pillar-certifications"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-certifications');
            }}
            className="block py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-teal"
          >
            2. Skill Certifications
          </a>
          <a
            href="#pillar-softskills"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-softskills');
            }}
            className="block py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-teal"
          >
            3. Soft Skills
          </a>
          <a
            href="#pillar-placements"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-placements');
            }}
            className="block py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-teal"
          >
            4. Internships &amp; Placements
          </a>
          <a
            href="#pillar-startup"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('pillar-startup');
            }}
            className="block py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-teal"
          >
            5. Start-up &amp; Market Research
          </a>
          <a
            href="#interactive-launchpad"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('interactive-launchpad');
            }}
            className="block py-1.5 text-xs font-bold text-emerald-700"
          >
            Interactive Tools &amp; Labs
          </a>
          <a
            href="#contact-us"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('contact-us');
            }}
            className="block py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-teal"
          >
            Contact Us
          </a>

          {/* Mobile CTA and Auth Controls */}
          <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenWizard) onOpenWizard();
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Career Diagnostic</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenConsultation) onOpenConsultation('Comprehensive Advisory', 'Launchpad Admission');
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-brand-teal to-brand-accent flex items-center justify-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Launch Career Consult</span>
            </button>

            {user ? (
              <div className="flex items-center justify-between py-1 px-1">
                <Link
                  href={`/${user.role || 'admin'}/dashboard`}
                  className="text-xs font-bold text-slate-900 flex items-center gap-1.5 text-decoration-none"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className="capitalize">{user.role || 'Admin'} Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="text-xs text-rose-600 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block text-center py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-bold text-decoration-none"
                onClick={() => setMobileMenuOpen(false)}
              >
                Portal Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
