'use client';

import React from 'react';
import { Eye, Target, Compass, Award, Handshake, Lightbulb } from 'lucide-react';

export default function AboutSection() {
  return (
    <section
      id="about-us"
      style={{ scrollMarginTop: '76px' }}
      className="py-8 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-teal">Who We Are</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">About Us</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Nurturing Young Minds • Guiding students and rising professionals from day one to career day—and beyond.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Our Vision Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 via-slate-900 to-brand-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 border border-brand-tealLight/40 text-brand-tealLight flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-tealLight block">
              Institutional Purpose
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-white">Our Vision</h3>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              To be a premier catalyst for career excellence, corporate readiness, and entrepreneurial innovation—empowering individuals and emerging ventures with future-ready skills, strategic placements, and data-driven market intelligence.
            </p>
          </div>
          <div className="pt-8 mt-8 border-t border-white/15 flex items-center justify-between text-xs text-slate-300 relative z-10">
            <span className="font-serif italic">&ldquo;Nurturing Young Minds&rdquo;</span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-brand-tealLight font-bold text-[10px] uppercase">
              SQA Charter
            </span>
          </div>
        </div>

        {/* Our Mission Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">
                  Action Framework
                </span>
                <h3 className="text-2xl font-serif font-black text-slate-900">Our Mission</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Navigate */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-brand-teal transition">
              <div className="flex items-center gap-2 text-brand-teal font-bold text-sm">
                <Compass className="w-4 h-4" />
                <span>Navigate</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deliver personalized, milestone-based career roadmaps that guide students from foundational school choices to executive leadership transitions.
              </p>
            </div>

            {/* Upskill */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-brand-teal transition">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Award className="w-4 h-4" />
                <span>Upskill</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bridge the gap between classroom education and industry demands through applied technical certifications, executive presence coaching, and behavioral readiness.
              </p>
            </div>

            {/* Connect */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-brand-teal transition">
              <div className="flex items-center gap-2 text-cyan-700 font-bold text-sm">
                <Handshake className="w-4 h-4" />
                <span>Connect</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Build direct, profile-driven recruitment pathways that match validated talent with curated corporate opportunities and dedicated interview drives.
              </p>
            </div>

            {/* Innovate */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:border-brand-teal transition">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <Lightbulb className="w-4 h-4" />
                <span>Innovate</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Empower entrepreneurs and organizations with actionable market research, consumer insights, feasibility studies, and strategic startup advisory.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
