// Generated Pillars Section from SQA HTML
'use client';

import React from 'react';
import {
  Compass,
  GraduationCap,
  Briefcase,
  Award,
  Cpu,
  FileSpreadsheet,
  Layers,
  Mic,
  MessageSquare,
  Users,
  Sparkles,
  Brain,
  BookOpen,
  FileText,
  Crosshair,
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Check,
  ChevronRight
} from 'lucide-react';

export default function PillarsSection({ onOpenConsultation, onOpenApply }) {
  return (
    <>
      {/* Strategic Pillar 1: Career Roadmap */}
      <section id="pillar-roadmap" style={{ scrollMarginTop: '76px' }} className="py-8 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Strategic Pillar 1</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">Career Roadmap</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">&ldquo;Eliminate guesswork with structured, industry-aligned career mapping designed around your strengths and emerging market trends.&rdquo;</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/*  10 to 12th Pass  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden shadow-xl flex flex-col justify-between hover:border-brand-accent transition group">
          <div>
            <div className="relative h-44 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80" alt="10 to 12th Pass Career Roadmap" className="w-full h-full object-cover group-hover:scale-105 transition duration-500 filter brightness-90" />
              <span className="absolute top-3 left-3 bg-white/95 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">Secondary Milestone</span>
            </div>
            <div className="p-6 space-y-2">
              <h3 className="font-serif font-bold text-base text-slate-900">10 to 12th Pass: Career Road Map</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Foundational stream selection, psychometric aptitude alignment, undergraduate degree benchmarking, and national entrance roadmaps.
              </p>
              <ul className="text-[11px] text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> Science vs Commerce vs Arts Mapping</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> College Tier &amp; Entrance Strategy</li>
              </ul>
            </div>
          </div>
          <div className="p-6 pt-0">
            <button onClick={() => onOpenConsultation('Career Roadmap', '10 to 12th Pass: Career road map')} className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition">
              Map Secondary Path
            </button>
          </div>
        </div>

        {/*  Graduates (UG): Early Career & Masters  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden shadow-xl flex flex-col justify-between hover:border-brand-accent transition group">
          <div>
            <div className="relative h-44 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80" alt="Graduates Early Career & Masters" className="w-full h-full object-cover group-hover:scale-105 transition duration-500 filter brightness-90" />
              <span className="absolute top-3 left-3 bg-white/95 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">Undergraduates</span>
            </div>
            <div className="p-6 space-y-2">
              <h3 className="font-serif font-bold text-base text-slate-900">Graduates (UG): Early Career &amp; Masters</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strategic decision-making between immediate corporate campus recruitment, high-growth startup roles, or Master’s admissions (MBA / MS).
              </p>
              <ul className="text-[11px] text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> Corporate Placement Bootcamps</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> CAT/GMAT/GRE Master’s Roadmap</li>
              </ul>
            </div>
          </div>
          <div className="p-6 pt-0">
            <button onClick={() => onOpenConsultation('Career Roadmap', 'Graduates (UG): Early Career & Masters')} className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition">
              Plan Graduate Transition
            </button>
          </div>
        </div>

        {/*  Postgraduates: Internship & Job Opportunities  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden shadow-xl flex flex-col justify-between hover:border-brand-accent transition group">
          <div>
            <div className="relative h-44 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80" alt="Postgraduates Internship & Job" className="w-full h-full object-cover group-hover:scale-105 transition duration-500 filter brightness-90" />
              <span className="absolute top-3 left-3 bg-white/95 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">Postgraduates</span>
            </div>
            <div className="p-6 space-y-2">
              <h3 className="font-serif font-bold text-base text-slate-900">Postgraduates: Internship &amp; Job</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Specialized industry transitions, managerial internships, lateral corporate hiring, and doctoral research positioning.
              </p>
              <ul className="text-[11px] text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> Marquee Corporate Placement</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> Advanced Specialized Skill Matching</li>
              </ul>
            </div>
          </div>
          <div className="p-6 pt-0">
            <button onClick={() => onOpenConsultation('Career Roadmap', 'Postgraduates: Internship & Job Opportunities')} className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition">
              Accelerate PG Careers
            </button>
          </div>
        </div>

        {/*  Working Professionals  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden shadow-xl flex flex-col justify-between hover:border-brand-accent transition group">
          <div>
            <div className="relative h-44 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80" alt="Working Professionals Career Shift" className="w-full h-full object-cover group-hover:scale-105 transition duration-500 filter brightness-90" />
              <span className="absolute top-3 left-3 bg-white/95 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">Executives</span>
            </div>
            <div className="p-6 space-y-2">
              <h3 className="font-serif font-bold text-base text-slate-900">Working Professionals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mid-career pivot strategies, executive leadership development, upskilling into GenAI / data analytics, and transition into consulting.
              </p>
              <ul className="text-[11px] text-slate-700 space-y-1.5 pt-2">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> Lateral Role Pivot Audits</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" /> Executive Compensation Positioning</li>
              </ul>
            </div>
          </div>
          <div className="p-6 pt-0">
            <button onClick={() => onOpenConsultation('Career Roadmap', 'Working Professionals')} className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition">
              Executive Career Pivot
            </button>
          </div>
        </div>
      </div>
    </section>

      {/* Strategic Pillar 2: Professional Skill Certifications */}
      <section id="pillar-certifications" style={{ scrollMarginTop: '76px' }} className="py-8 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-teal">Strategic Pillar 2</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">Professional Skill Certifications</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">&ldquo;Gain tangible, employer-demanded technical and managerial credentials that validate your competence from day one.&rdquo;</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/*  1. Applied Artificial Intelligence & Prompt Engineering  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:border-brand-accent transition group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 text-brand-accent flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-slate-900">Applied Artificial Intelligence &amp; Prompt Engineering</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Master state-of-the-art Large Language Models (LLMs), structured prompt architectures (Chain-of-Thought, Few-Shot), automated agentic workflows, and GenAI productivity integration across business operations.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> Enterprise Prompt Engineering Patterns</div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> GenAI Workflow Orchestration</div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> Capstone Project with API Integration</div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
            <span className="text-xs font-mono text-brand-accent font-bold">Certification Track</span>
            <button onClick={() => onOpenConsultation('Professional Skill Certifications', 'Applied Artificial Intelligence & Prompt Engineering')} className="px-4 py-2 bg-brand-accent hover:brightness-110 text-brand-950 font-bold text-xs rounded-xl transition">
              Enroll in Applied AI
            </button>
          </div>
        </div>

        {/*  2. Advanced Spreadsheet Engineering & Data Analytics  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:border-brand-accent transition group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-teal/20 text-brand-teal flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-slate-900">Advanced Spreadsheet Engineering &amp; Data Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transform raw corporate datasets into executive business intelligence. Master dynamic array modeling, financial forecasting, Power Query ETL pipelines, statistical dashboards, and PowerBI integration.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> Advanced Excel Dynamic Arrays &amp; Formulas</div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> Financial &amp; Valuation Models</div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> PowerBI Dashboards &amp; Interactive Reports</div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
            <span className="text-xs font-mono text-brand-teal font-bold">Certification Track</span>
            <button onClick={() => onOpenConsultation('Professional Skill Certifications', 'Advanced Spreadsheet Engineering & Data Analytics')} className="px-4 py-2 bg-brand-teal hover:brightness-110 text-white font-bold text-xs rounded-xl transition">
              Enroll in Analytics
            </button>
          </div>
        </div>

        {/*  3. Industry aligned application-based courses  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-7 flex flex-col justify-between hover:border-brand-accent transition group shadow-xl">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-slate-900">Industry Aligned Application-Based Courses</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pragmatic, case-study-driven certifications aligned with immediate enterprise needs: FinTech operations, modern product management, digital marketing performance funnels, and enterprise SaaS toolchains.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> Real Corporate Datasets &amp; Scenarios</div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> Functional Case Study Execution</div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-teal" /> Verifiable Credential on LinkedIn &amp; Resume</div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-200 mt-6 flex items-center justify-between">
            <span className="text-xs font-mono text-amber-400 font-bold">Application Track</span>
            <button onClick={() => onOpenConsultation('Professional Skill Certifications', 'Industry aligned application-based courses')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-brand-950 font-bold text-xs rounded-xl transition">
              Explore Courses
            </button>
          </div>
        </div>
      </div>
    </section>

      {/* Strategic Pillar 3: Personality Development & Soft skills */}
      <section id="pillar-softskills" style={{ scrollMarginTop: '76px' }} className="py-8 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Strategic Pillar 3</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">Personality Development &amp; Soft skills</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">&ldquo;Master high-stakes communication, leadership dynamics, emotional intelligence, and executive presence to lead in any room.&rdquo;</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/*  1. Presentation Skill  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col justify-between hover:border-emerald-400 transition group shadow-xl">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">01</div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Presentation Skill</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Storyboarding, slide economy, narrative pacing, persuasive rhetoric, and dynamic vocal projection to capture attention and influence decisions.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <div>• Executive Pitch Structuring</div>
              <div>• Handling Tough Q&amp;A Sessions</div>
            </div>
          </div>
          <button onClick={() => onOpenConsultation('Personality Development & Soft skills', 'Presentation Skill')} className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Join Presentation Lab</span> &rarr;
          </button>
        </div>

        {/*  2. Mock Interview Labs  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col justify-between hover:border-emerald-400 transition group shadow-xl">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">02</div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Mock Interview Labs</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rigorous 1-on-1 simulated interviews with recorded video playback. Drill technical deep dives, behavioral STAR questions, and stress-testing.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <div>• STAR Behavioral Framework Drills</div>
              <div>• Recorded Video Playback Diagnostics</div>
            </div>
          </div>
          <button onClick={() => onOpenConsultation('Personality Development & Soft skills', 'Mock Interview Labs')} className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Book Mock Interview Slot</span> &rarr;
          </button>
        </div>

        {/*  3. Group Discussion (GD) Prep  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col justify-between hover:border-emerald-400 transition group shadow-xl">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">03</div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Group Discussion (GD) Prep</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Master structured interventions, topic framing, consensus moderation, socio-economic debates, and assertiveness without aggression.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <div>• Spontaneous Extempore Debates</div>
              <div>• Panel Moderation &amp; Summaries</div>
            </div>
          </div>
          <button onClick={() => onOpenConsultation('Personality Development & Soft skills', 'Group Discussion (GD) Prep')} className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Join GD Cohort</span> &rarr;
          </button>
        </div>

        {/*  4. Professional Presence  */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col justify-between hover:border-emerald-400 transition group shadow-xl">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">04</div>
            <h3 className="font-serif font-bold text-lg text-slate-900">Professional Presence</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Executive business communication, corporate attire, workplace ethics, digital etiquette on LinkedIn, and cross-cultural demeanor.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <div>• Executive Poise &amp; Demeanor</div>
              <div>• Corporate Networking Agility</div>
            </div>
          </div>
          <button onClick={() => onOpenConsultation('Personality Development & Soft skills', 'Professional Presence')} className="mt-6 text-xs font-bold text-emerald-700 hover:text-emerald-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Master Presence</span> &rarr;
          </button>
        </div>
      </div>
    </section>

      {/* Strategic Pillar 4: Corporate Internship & placement support */}
      <section id="pillar-placements" style={{ scrollMarginTop: '76px' }} className="py-8 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-teal">Strategic Pillar 4</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">Corporate Internship &amp; placement support</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">&ldquo;Move seamlessly from preparation to performance with curated corporate exposure, live internship pipelines, and dedicated placement support.&rdquo;</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {/*  1. Aptitude & Reasoning  */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3 flex flex-col justify-between hover:border-brand-teal transition">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center font-bold">01</div>
            <h3 className="font-serif font-bold text-sm text-slate-900">Aptitude &amp; Reasoning</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Quantitative aptitude, logical deduction, data interpretation, and speed math drills to ace primary recruitment filter rounds.
            </p>
          </div>
          <button onClick={() => onOpenConsultation('Corporate Internship & placement support', 'Aptitude & Reasoning')} className="text-xs font-bold text-teal-700 hover:text-teal-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Practice Drills</span> &rarr;
          </button>
        </div>

        {/*  2. Domain Specific Knowledge  */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3 flex flex-col justify-between hover:border-brand-teal transition">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center font-bold">02</div>
            <h3 className="font-serif font-bold text-sm text-slate-900">Domain Specific Knowledge</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Core functional competencies tailored for specific roles: Financial analysis, Marketing tech stacks, Full-stack coding, and HR operations.
            </p>
          </div>
          <button onClick={() => onOpenConsultation('Corporate Internship & placement support', 'Domain Specific Knowledge')} className="text-xs font-bold text-teal-700 hover:text-teal-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Deep Dive</span> &rarr;
          </button>
        </div>

        {/*  3. Resume & Portfolio Studio  */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3 flex flex-col justify-between hover:border-brand-teal transition">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center font-bold">03</div>
            <h3 className="font-serif font-bold text-sm text-slate-900">Resume &amp; Portfolio Studio</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              ATS keyword architecture, CAR (Context-Action-Result) impact bullets, GitHub code repositories, and online portfolio audits.
            </p>
          </div>
          <button onClick={() => onOpenConsultation('Corporate Internship & placement support', 'Resume & Portfolio Studio')} className="text-xs font-bold text-teal-700 hover:text-teal-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Audit Resume</span> &rarr;
          </button>
        </div>

        {/*  4. Profile Matching  */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3 flex flex-col justify-between hover:border-brand-teal transition">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center font-bold">04</div>
            <h3 className="font-serif font-bold text-sm text-slate-900">Profile Matching</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Algorithmic candidate profiling matching verified skills, certifications, and target compensation against employer vacancies.
            </p>
          </div>
          <button onClick={() => onOpenApply('Profile Matching Intake')} className="text-xs font-bold text-teal-700 hover:text-teal-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Submit Profile</span> &rarr;
          </button>
        </div>

        {/*  5. Interview Facilitation  */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3 flex flex-col justify-between hover:border-brand-teal transition">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-brand-teal/20 text-brand-teal flex items-center justify-center font-bold">05</div>
            <h3 className="font-serif font-bold text-sm text-slate-900">Interview Facilitation</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Direct HR liaison, candidate pitching to hiring managers, dedicated interview scheduling, and post-interview feedback coordination.
            </p>
          </div>
          <button onClick={() => onOpenApply('Interview Facilitation Scheduling')} className="text-xs font-bold text-teal-700 hover:text-teal-950 flex items-center gap-1 transition-colors cursor-pointer group-hover:translate-x-0.5">
            <span>Connect to HR</span> &rarr;
          </button>
        </div>
      </div>
    </section>

      {/* Strategic Pillar 5: Start-up & Market Research */}
      <section id="pillar-startup" style={{ scrollMarginTop: '76px' }} className="py-8 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Strategic Pillar 5</span>
        <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">Start-up &amp; Market Research</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">&ldquo;Turn commercial concepts into validated ventures with deep customer discovery, competitive mapping, and real-world market intelligence.&rdquo;</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/*  1. Problem & Market Size  */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-amber-400 transition">
          <div className="font-mono text-xs font-bold text-amber-400">PHASE 01</div>
          <h4 className="font-serif font-bold text-slate-900 text-sm">Problem &amp; Market Size</h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Pain point qualification, TAM (Total Addressable), SAM (Serviceable), and SOM (Obtainable) sizing methodologies.
          </p>
        </div>

        {/*  2. Customer Discovery through market research  */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-amber-400 transition">
          <div className="font-mono text-xs font-bold text-amber-400">PHASE 02</div>
          <h4 className="font-serif font-bold text-slate-900 text-sm">Customer Discovery</h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Primary user interviewing, Mom Test validation, willingness-to-pay surveys, and buyer persona mapping.
          </p>
        </div>

        {/*  3. Competitive Advantage  */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-amber-400 transition">
          <div className="font-mono text-xs font-bold text-amber-400">PHASE 03</div>
          <h4 className="font-serif font-bold text-slate-900 text-sm">Competitive Advantage</h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Moat construction, perceptual positioning matrices, barrier to entry audits, and differentiated value propositions.
          </p>
        </div>

        {/*  4. Minimum Viable Product & Validation  */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-amber-400 transition">
          <div className="font-mono text-xs font-bold text-amber-400">PHASE 04</div>
          <h4 className="font-serif font-bold text-slate-900 text-sm">MVP &amp; Validation</h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            No-code prototyping, smoke tests, rapid beta testing loops, early adopter retention, and iteration cadence.
          </p>
        </div>

        {/*  5. Unit Economics & Pitch  */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2 hover:border-amber-400 transition">
          <div className="font-mono text-xs font-bold text-amber-400">PHASE 05</div>
          <h4 className="font-serif font-bold text-slate-900 text-sm">Unit Economics &amp; Pitch</h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            CAC, LTV, Gross Margins, runway calculation, financial projections, investor-ready pitch decks, and mock demo days.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => onOpenConsultation('Start-up & Market Research', 'Venture Validation & Investor Pitch Clinic')} className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-brand-950 font-bold text-xs shadow-lg transition">
          Validate Your Venture with SQA Incubator
        </button>
      </div>
    </section>
    </>
  );
}
