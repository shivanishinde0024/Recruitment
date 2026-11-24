'use client';

import React, { useState } from 'react';
import { X, Briefcase, Award, TrendingUp } from 'lucide-react';

export default function WizardModal({
  isOpen,
  onClose,
  onFinish
}) {
  const [stage, setStage] = useState('Undergraduate (UG)');
  const [objective, setObjective] = useState('Placement & Marquee Corporate Internship');

  if (!isOpen) return null;

  const handleFinish = () => {
    let pillar = 'Pillar 1: Career Roadmap';
    if (objective.includes('Placement')) {
      pillar = 'Corporate Internship & placement support';
    } else if (objective.includes('AI') || objective.includes('Certification')) {
      pillar = 'Professional Skill Certifications';
    } else if (objective.includes('Start-up') || objective.includes('Venture')) {
      pillar = 'Start-up & Market Research';
    }

    onFinish(pillar, `${stage} - ${objective}`);
    onClose();
  };

  return (
    <div
      id="modal-wizard"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm max-w-md w-full p-6 sm:p-8 relative shadow-2xl space-y-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
            SQA Career &amp; Venture Diagnostic
          </span>
          <h3 className="font-serif font-bold text-lg text-slate-900 mb-0">
            Find Your Strategic SQA Program
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <label className="text-slate-600 font-bold block mb-1">1. What is your current profile stage?</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '10th / 12th Pass', val: 'School / High School Pass' },
              { label: 'Undergraduate (UG)', val: 'College Undergraduate' },
              { label: 'Postgraduate (PG)', val: 'Postgraduate Candidate' },
              { label: 'Working / Founder', val: 'Early Career / Founder' }
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setStage(item.val)}
                className={`p-2.5 rounded-xl border text-left font-medium transition text-[11px] ${
                  stage === item.val
                    ? 'border-brand-teal bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-teal'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <label className="text-slate-600 font-bold block mb-1">2. What is your primary objective?</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                label: 'Corporate Placement & Internship',
                val: 'Placement & Marquee Corporate Internship',
                icon: <Briefcase className="w-3.5 h-3.5 text-brand-teal" />
              },
              {
                label: 'Applied AI & Analytics Certification',
                val: 'Skill Certifications (Applied AI / Analytics)',
                icon: <Award className="w-3.5 h-3.5 text-brand-accent" />
              },
              {
                label: 'Start-up Incubation & Validation',
                val: 'Launch or Validate a Tech Venture',
                icon: <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              }
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setObjective(item.val)}
                className={`p-2.5 rounded-xl border text-left font-medium transition text-[11px] flex justify-between items-center ${
                  objective === item.val
                    ? 'border-brand-teal bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-teal'
                }`}
              >
                <span>{item.label}</span>
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-teal to-brand-accent hover:brightness-110 text-white font-bold text-xs shadow-lg transition"
        >
          Generate Recommended SQA Path →
        </button>
      </div>
    </div>
  );
}
