'use client';

import React from 'react';
import SqaMedallion from './SqaMedallion';
import { Compass, TrendingUp, Sliders, ChevronRight } from 'lucide-react';

export default function HeroSection({
  onOpenWizard
}) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      style={{ scrollMarginTop: '76px' }}
      className="relative overflow-hidden bg-gradient-to-br from-[#f0fdf4] via-[#f8fafc] to-[#ecfeff] pt-6 pb-16 border-b border-slate-200"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80"
          alt="Students, Coders and Innovators Collaborating"
          className="w-full h-full object-cover filter brightness-50"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-white/70 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full whitespace-nowrap bg-white border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping"></span>
              <span>Official Institutional Platform • Success Quest Academy</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-slate-900 leading-[1.12]">
              Your Career Launchpad: <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700">
                Learn, Grow, Get Hired &amp; Build
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
              We guide students and rising professionals from day one to career day—and beyond. Whether you are navigating your first career roadmap, acquiring industry-grade skill certifications, mastering executive presence, securing marquee corporate internships, or building and validating your own venture, we provide the strategic launchpad to turn raw ambition into measurable success.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#pillar-roadmap"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('pillar-roadmap');
                }}
                className="px-5 py-3 rounded-xl bg-brand-teal hover:brightness-110 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 text-decoration-none"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Career Roadmaps</span>
              </a>
              <a
                href="#pillar-startup"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('pillar-startup');
                }}
                className="px-5 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs transition flex items-center gap-2 text-decoration-none"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Start-up &amp; Market Research</span>
              </a>
              <a
                href="#interactive-launchpad"
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo('interactive-launchpad');
                }}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm font-bold text-xs transition flex items-center gap-2 text-decoration-none"
              >
                <Sliders className="w-4 h-4 text-brand-accent" />
                <span>Interactive Calculators &amp; AI Tools</span>
              </a>
            </div>

            {/* Stats Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-2xl font-black text-slate-900 font-serif">Day 1 to Hire</div>
                <div className="text-[11px] text-slate-500 font-medium">Holistic Lifecycle</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-2xl font-black text-emerald-700 font-serif">GenAI &amp; Analytics</div>
                <div className="text-[11px] text-slate-500 font-medium">Employer-Grade Certs</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-2xl font-black text-teal-700 font-serif">1-on-1 Labs</div>
                <div className="text-[11px] text-slate-500 font-medium">Executive Presence</div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-2xl font-black text-amber-600 font-serif">TAM &amp; MVP</div>
                <div className="text-[11px] text-slate-500 font-medium">Venture Validation</div>
              </div>
            </div>
          </div>

          {/* Hero Overview Card with Official Embossed Medallion Showcase */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center relative shadow-xl space-y-4 group">
              <div className="flex justify-center my-1 transform group-hover:scale-105 transition-transform duration-500">
                <div id="hero-seal-showcase" className="shrink-0 drop-shadow-2xl">
                  <SqaMedallion size="w-36 h-36 sm:w-40 sm:h-40" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-accent bg-brand-accent/20 px-3 py-1 rounded-full border border-brand-accent/40">
                  Official Institutional Seal
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900 pt-1">Nurturing Young Minds</h3>
                <p className="text-xs text-slate-600 leading-relaxed text-left">
                  &ldquo;Guiding students toward their natural calling, grooming graduates for premier corporate careers, and empowering scholars and founders with verifiable credentials.&rdquo;
                </p>
              </div>

              <div className="space-y-2 text-left text-xs pt-1">
                <a
                  href="#pillar-roadmap"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo('pillar-roadmap');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-800 hover:border-brand-teal transition block text-decoration-none"
                >
                  <span className="font-bold">1. Career Roadmap</span>
                  <ChevronRight className="w-4 h-4 text-brand-teal" />
                </a>
                <a
                  href="#pillar-certifications"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo('pillar-certifications');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-800 hover:border-brand-accent transition block text-decoration-none"
                >
                  <span className="font-bold">2. Professional Skill Certs</span>
                  <ChevronRight className="w-4 h-4 text-brand-accent" />
                </a>
                <a
                  href="#pillar-softskills"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo('pillar-softskills');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-800 hover:border-emerald-400 transition block text-decoration-none"
                >
                  <span className="font-bold">3. Personality &amp; Soft Skills</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </a>
                <a
                  href="#pillar-placements"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo('pillar-placements');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-800 hover:border-teal-400 transition block text-decoration-none"
                >
                  <span className="font-bold">4. Corporate Placement Support</span>
                  <ChevronRight className="w-4 h-4 text-teal-400" />
                </a>
                <a
                  href="#pillar-startup"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo('pillar-startup');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-800 hover:border-amber-400 transition block text-decoration-none"
                >
                  <span className="font-bold">5. Start-up &amp; Market Research</span>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </a>
              </div>

              <button
                type="button"
                onClick={onOpenWizard}
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-accent text-white font-bold text-xs transition shadow-lg"
              >
                Run Diagnostic Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
