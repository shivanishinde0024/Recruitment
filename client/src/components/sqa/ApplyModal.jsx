'use client';

import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { X, Send } from 'lucide-react';

export default function ApplyModal({
  isOpen,
  onClose,
  targetRole = 'Placement Candidate Drive',
  onApplicationAdded
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      toast.warning('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/sqa/applications', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        serviceCategory: 'Corporate Internship & placement support',
        targetRole: targetRole.trim(),
        experienceLevel: 'Fresher / Rising Professional',
        resumeUrl: resumeUrl || null,
        statement: 'Direct SQA Candidate Application from Placement Desk'
      });
      toast.success('Application submitted to Corporate Placement Desk!');
    } catch (err) {
      console.error('Failed to submit application:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      toast.error(errorMsg);
    }

    if (onApplicationAdded) {
      onApplicationAdded({
        fullName,
        email,
        phone,
        targetRole
      });
    }

    setLoading(false);
    onClose();
  };

  return (
    <div
      id="modal-apply"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm max-w-md w-full p-6 sm:p-8 relative shadow-2xl space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
            Corporate Placement &amp; Internship Desk
          </span>
          <h3 id="apply-modal-title" className="font-serif font-bold text-lg text-slate-900 mb-0">
            {targetRole}
          </h3>
          <p className="text-xs text-slate-500 mb-0">Direct fast-track submission to 50+ hiring partner networks.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Full Legal Name</label>
            <input
              type="text"
              id="app-name"
              placeholder="e.g. Sahil Kulkarni"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Email Address</label>
            <input
              type="email"
              id="app-email"
              placeholder="sahil@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Phone / WhatsApp</label>
            <input
              type="tel"
              id="app-phone"
              placeholder="+91 98221 44332"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Resume Link / Portfolio URL (LinkedIn/GitHub/Drive)
            </label>
            <input
              type="url"
              id="app-resume"
              placeholder="https://drive.google.com/... or linkedin.com/in/..."
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Submit Placement Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
