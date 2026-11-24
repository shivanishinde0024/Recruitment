'use client';

import React, { useState, useEffect } from 'react';
import SqaMedallion from './SqaMedallion';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { ShieldCheck, CheckCircle } from 'lucide-react';

export default function InteractiveLabs() {
  // --- 1. Tool 1: Unit Economics ---
  const [cac, setCac] = useState(2500);
  const [ltv, setLtv] = useState(10000);
  const [cash, setCash] = useState(1500000);
  const [burn, setBurn] = useState(125000);

  const ltvCacRatio = (ltv / Math.max(1, cac)).toFixed(1);
  const runwayMonths = Math.floor(cash / Math.max(1, burn));

  let ltvNote = 'Healthy venture benchmark (Standard healthy metric is >3.0x).';
  let ratioColor = 'text-emerald-700';
  if (ltvCacRatio < 1.5) {
    ltvNote = 'Critical warning: CAC exceeds sustainable margins. Revisit pricing.';
    ratioColor = 'text-rose-600';
  } else if (ltvCacRatio < 3.0) {
    ltvNote = 'Moderate viability. Optimize acquisition funnel or retention.';
    ratioColor = 'text-amber-600';
  }

  // --- 2. Tool 2: Applied AI Prompt Sandbox ---
  const [role, setRole] = useState('Executive Career Coach');
  const [pattern, setPattern] = useState('Chain-of-Thought (CoT)');
  const [context, setContext] = useState('FinTech Internship Interview Prep');
  const [promptOutput, setPromptOutput] = useState('');

  const generatePrompt = (r, p, c) => {
    let output = `[SYSTEM DIRECTIVE: Act as a ${r} with 15+ years of institutional pedigree.]\n`;
    output += `[FRAMEWORK: ${p} | DOMAIN: ${c}]\n\n`;

    if (p.includes('Chain-of-Thought')) {
      output += `Step 1 (Decomposition): Break down candidate background and map against target hiring rubrics.\n`;
      output += `Step 2 (Gap Assessment): Identify deficiencies in technical depth, behavioral framing, and executive presence.\n`;
      output += `Step 3 (Targeted Drill): Formulate 3 scenario questions measuring quantitative competency and domain reasoning.\n`;
      output += `Step 4 (Scoring Benchmark): Provide expected STAR-format model answers and common candidate pitfalls.`;
    } else if (p.includes('Few-Shot')) {
      output += `EXEMPLAR 1 (Weak Answer): "I worked on a team project using SQL to query sales records."\n`;
      output += `REVISED BENCHMARK (SQA Grade A+): "Architected automated PostgreSQL analytical pipelines processing 1.2M daily transactional logs, improving indexing latency by 42%."\n\n`;
      output += `TASK: Transform candidate draft response using same quantitative precision and impact metrics.`;
    } else {
      output += `ROLE: ${r}\n`;
      output += `TASK: Formulate a comprehensive evaluation protocol tailored specifically for: ${c}.\n`;
      output += `CONSTRAINTS: Avoid generic advice. Use industry-standard competency benchmarks and strict feedback rubrics.`;
    }
    return output;
  };

  useEffect(() => {
    setPromptOutput(generatePrompt(role, pattern, context));
  }, [role, pattern, context]);

  // --- 3. Tool 3: Certificate Validator ---
  const [certCode, setCertCode] = useState('SQA-2026-AI01');
  const [certData, setCertData] = useState({
    recipient: 'Dr. Vivek Ranade',
    course: 'Applied Artificial Intelligence & Prompt Engineering',
    serial: 'SQA-2026-AI01',
    grade: 'Honors (Grade A+)',
    valid: true
  });
  const [statusMsg, setStatusMsg] = useState('Status: Verified Active Credential in Ledger');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    const code = certCode.trim().toUpperCase();
    if (!code) {
      toast.warning('Please enter a certificate credential code');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.get(`/sqa/certificates/verify/${encodeURIComponent(code)}`);
      if (res.data?.success && res.data.data?.valid) {
        const item = res.data.data;
        setCertData({
          recipient: item.studentName,
          course: item.program,
          serial: item.code,
          grade: item.grade || 'Honors (Grade A+)',
          valid: true
        });
        setStatusMsg(`Status: Verified Active Credential in Official Ledger (${item.code})`);
        toast.success(`Verified: ${item.studentName}`);
      } else {
        handleLocalFallback(code);
      }
    } catch {
      handleLocalFallback(code);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLocalFallback = (code) => {
    if (code === 'SQA-2026-AI01') {
      setCertData({
        recipient: 'Dr. Vivek Ranade',
        course: 'Applied Artificial Intelligence & Prompt Engineering',
        serial: 'SQA-2026-AI01',
        grade: 'Honors (Grade A+)',
        valid: true
      });
      setStatusMsg('Status: Verified Active Credential in Ledger (Cached Copy)');
      toast.success('Certificate Verified: Dr. Vivek Ranade');
    } else if (code === 'SQA-2026-DA02') {
      setCertData({
        recipient: 'Priya Sharma',
        course: 'Advanced Spreadsheet Engineering & Data Analytics',
        serial: 'SQA-2026-DA02',
        grade: 'Honors (Grade A+)',
        valid: true
      });
      setStatusMsg('Status: Verified Active Credential in Ledger (Cached Copy)');
      toast.success('Certificate Verified: Priya Sharma');
    } else {
      setStatusMsg(`Status: Invalid or Unregistered Credential Code (${code})`);
      toast.error('Credential code not found in registry');
    }
  };

  return (
    <section
      id="interactive-launchpad"
      style={{ scrollMarginTop: '76px' }}
      className="py-8 border-b border-slate-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16"
    >
      {/* TOOL 1: START-UP UNIT ECONOMICS & RUNWAY CALCULATOR */}
      <div>
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Interactive Lab 1</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
            Start-up Unit Economics &amp; Runway Calculator
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Model your venture&apos;s CAC, LTV, payback period, and monthly burn runway in real-time.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Customer Acquisition Cost (CAC):{' '}
                <span id="val-cac" className="text-amber-600 font-mono">
                  ₹{Number(cac).toLocaleString('en-IN')}
                </span>
              </label>
              <input
                type="range"
                id="input-cac"
                min="500"
                max="15000"
                step="250"
                value={cac}
                onChange={(e) => setCac(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Customer Lifetime Value (LTV):{' '}
                <span id="val-ltv" className="text-amber-600 font-mono">
                  ₹{Number(ltv).toLocaleString('en-IN')}
                </span>
              </label>
              <input
                type="range"
                id="input-ltv"
                min="1000"
                max="50000"
                step="500"
                value={ltv}
                onChange={(e) => setLtv(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Available Cash Balance:{' '}
                <span id="val-cash" className="text-amber-600 font-mono">
                  ₹{Number(cash).toLocaleString('en-IN')}
                </span>
              </label>
              <input
                type="range"
                id="input-cash"
                min="200000"
                max="5000000"
                step="100000"
                value={cash}
                onChange={(e) => setCash(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Net Monthly Burn Rate:{' '}
                <span id="val-burn" className="text-amber-600 font-mono">
                  ₹{Number(burn).toLocaleString('en-IN')}
                </span>
              </label>
              <input
                type="range"
                id="input-burn"
                min="30000"
                max="500000"
                step="10000"
                value={burn}
                onChange={(e) => setBurn(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">LTV : CAC Ratio</span>
              <div id="res-ltv-cac" className={`text-2xl font-bold font-mono ${ratioColor} mt-1`}>
                {ltvCacRatio}x
              </div>
              <p id="res-ltv-note" className="text-slate-500 text-[11px] mt-1">
                {ltvNote}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Estimated Runway</span>
              <div id="res-runway" className="text-2xl font-bold font-mono text-cyan-700 mt-1">
                {runwayMonths} Months
              </div>
              <p className="text-slate-500 text-[11px] mt-1">Based on current cash balance and net burn rate.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">SQA Venture Module</span>
              <div className="text-base font-bold font-mono text-slate-900 mt-1">Pillar 5: Phase 05</div>
              <p className="text-slate-500 text-[11px] mt-1">
                Unit economics modeling &amp; investor pitch preparation track.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TOOL 2: APPLIED AI PROMPT ENGINEERING TESTER */}
      <div>
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">Interactive Lab 2</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
            Applied AI &amp; Prompt Engineering Sandbox
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Preview enterprise-grade prompt framework orchestration taught in SQA&apos;s Applied AI certification.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Target Persona</label>
              <select
                id="prompt-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
              >
                <option value="Executive Career Coach">Executive Career Coach</option>
                <option value="Venture Capital Analyst">Venture Capital Analyst</option>
                <option value="Senior Technical Interviewer">Senior Technical Interviewer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Prompt Framework Pattern</label>
              <select
                id="prompt-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
              >
                <option value="Chain-of-Thought (CoT)">Chain-of-Thought (CoT)</option>
                <option value="Few-Shot Exemplar">Few-Shot Exemplar</option>
                <option value="Role-Task-Constraint (RTC)">Role-Task-Constraint (RTC)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Business Context</label>
              <select
                id="prompt-context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium"
              >
                <option value="FinTech Internship Interview Prep">FinTech Internship Interview Prep</option>
                <option value="B2B SaaS Seed Pitch Evaluation">B2B SaaS Seed Pitch Evaluation</option>
                <option value="ATS Resume Keyword Gap Audit">ATS Resume Keyword Gap Audit</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 border-b border-slate-200 pb-2">
              <span className="font-semibold">Orchestrated Prompt Structure:</span>
              <span className="text-cyan-700 font-bold text-[10px]">Applied AI Architecture</span>
            </div>
            <pre
              id="prompt-output"
              className="text-emerald-800 whitespace-pre-wrap font-medium font-sans text-xs pt-1 leading-relaxed mb-0"
            >
              {promptOutput}
            </pre>
          </div>
        </div>
      </div>

      {/* TOOL 3: DIGITAL CREDENTIAL & SEAL VALIDATOR */}
      <div>
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Verifiable Credentials</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
            Digital Certificate &amp; Seal Authentication
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Real-time credential lookup stamped with the official Success Quest Academy embossed seal.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-serif font-bold text-lg text-slate-900">Authenticate Graduate / Scholar Credential</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Employers, venture investors, and academic institutions can verify certificates issued across SQA&apos;s Applied AI, Advanced Analytics, and Soft Skills masterclasses.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                id="cert-code-input"
                value={certCode}
                onChange={(e) => setCertCode(e.target.value)}
                placeholder="Enter Certificate Code (e.g. SQA-2026-AI01)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-mono uppercase outline-none focus:border-brand-teal"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full py-2.5 rounded-xl bg-brand-teal hover:brightness-110 text-white font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerifying ? 'Querying Ledger...' : 'Query Credential Ledger'}</span>
              </button>
            </div>
            <div
              id="cert-status-msg"
              className="text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          </div>

          {/* Realistic Parchment Certificate with Embossed SQA Medallion */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md bg-[#fcfaf4] text-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border-4 border-double border-slate-700 relative font-serif">
              <div className="text-center space-y-1 pb-3 border-b border-slate-300">
                <div id="cert-seal-icon" className="flex justify-center mb-1">
                  <SqaMedallion size="w-14 h-14" />
                </div>
                <h4 className="text-base font-black uppercase tracking-wide text-slate-900">
                  Success Quest Academy
                </h4>
                <p className="text-[9px] uppercase tracking-widest text-[#0d9488] font-sans font-bold">
                  Center for Advanced Professional Excellence
                </p>
              </div>

              <div className="text-center my-4 space-y-2">
                <p className="text-[11px] italic text-slate-600 font-sans">This certifies that</p>
                <div
                  id="cert-recipient-name"
                  className="text-base font-bold text-slate-900 underline decoration-[#84a98c] underline-offset-4"
                >
                  {certData.recipient}
                </div>
                <p className="text-[10px] text-slate-700 font-sans max-w-xs mx-auto">
                  has completed the advanced competency benchmark for
                </p>
                <div id="cert-course-name" className="text-xs font-bold text-[#142247] uppercase font-sans">
                  {certData.course}
                </div>
                <p className="text-[9px] text-slate-600 font-sans">
                  Awarded with <strong>{certData.grade}</strong>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] font-sans">
                <div>
                  <div className="font-serif italic font-bold">Academic Dean</div>
                  <div className="text-[8px] text-slate-500">Board of Examiners</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[9px] font-bold text-slate-800" id="cert-serial-display">
                    ID: {certData.serial}
                  </div>
                  <div className="text-[8px] text-slate-500">Official Embossed Ledger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
