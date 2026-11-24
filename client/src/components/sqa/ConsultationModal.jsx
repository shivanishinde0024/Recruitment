'use client';

import React, { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { X, Send } from 'lucide-react';

export default function ConsultationModal({
  isOpen,
  onClose,
  initialPillar = 'Pillar 1: Career Roadmap',
  initialTrack = 'General Diagnostic',
  onLeadAdded
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceCategory, setServiceCategory] = useState(initialPillar);
  const [subStream, setSubStream] = useState(initialTrack);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      toast.warning('Please enter your name, email, and phone number.');
      return;
    }

    setLoading(true);
    const newLead = {
      id: 'LEAD-' + Math.floor(100 + Math.random() * 900),
      fullName,
      email,
      phone,
      serviceCategory,
      subStream,
      message,
      status: 'NEW'
    };

    try {
      const res = await api.post('/sqa/leads', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        serviceCategory: serviceCategory.trim(),
        subStream: subStream ? subStream.trim() : '',
        goals: message ? message.trim() : null
      });
      toast.success('Consultation request submitted successfully!');
      if (res.data?.data) {
        newLead.id = res.data.data.id || newLead.id;
        newLead.status = res.data.data.status || 'NEW';
      }
    } catch (err) {
      console.error('Failed to submit consultation lead:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit consultation request. Please try again.';
      toast.error(errorMsg);
    }

    if (onLeadAdded) {
      onLeadAdded(newLead);
    }

    setLoading(false);
    onClose();
  };

  return (
    <div
      id="modal-consultation"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm max-w-lg w-full p-6 sm:p-8 relative shadow-2xl space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal">
            Success Quest Academy
          </span>
          <h3 className="font-serif font-bold text-xl text-slate-900 mb-0">Book Guidance &amp; Advisory</h3>
          <p className="text-xs text-slate-500 mb-0">
            Launchpad Counselor Intake Form • Personalized Strategic Roadmap
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Full Name</label>
            <input
              type="text"
              id="lead-name"
              placeholder="e.g. Aarav Mehta"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                id="lead-email"
                placeholder="aarav@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">WhatsApp / Phone</label>
              <input
                type="tel"
                id="lead-phone"
                placeholder="+91 98765 43210"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Primary Pillar of Interest</label>
            <select
              id="lead-category"
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            >
              <option value="Career Roadmap">1. Career Roadmap (10th/12th, UG, PG, Working Pro)</option>
              <option value="Professional Skill Certifications">2. Professional Skill Certifications (AI, Analytics, App Courses)</option>
              <option value="Personality Development & Soft skills">3. Personality Development &amp; Soft skills</option>
              <option value="Corporate Internship & placement support">4. Corporate Internship &amp; placement support</option>
              <option value="Start-up & Market Research">5. Start-up &amp; Market Research (TAM, Discovery, MVP, Unit Economics)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Target Program / Track Detail</label>
            <input
              type="text"
              id="lead-detail"
              placeholder="e.g. Applied AI & Prompt Engineering"
              value={subStream}
              onChange={(e) => setSubStream(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Questions or Specific Goals (Optional)</label>
            <textarea
              id="lead-msg"
              rows={2}
              placeholder="Tell our counselor about your current stage or career objectives..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 outline-none focus:border-brand-teal"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-teal to-brand-accent hover:brightness-110 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : 'Confirm Advisory Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
