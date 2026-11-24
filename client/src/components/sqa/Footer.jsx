'use client';

import React from 'react';
import SqaMedallion from './SqaMedallion';
import { MapPin, Building2, Phone, Mail, Calendar, Shield, Download } from 'lucide-react';

export default function Footer({
  onOpenConsultation,
  onSwitchToBackend,
  onDownloadHtml
}) {
  return (
    <footer
      id="contact-us"
      style={{ scrollMarginTop: '76px' }}
      className="bg-slate-900 border-t border-slate-800 py-14 text-slate-300 text-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div id="footer-logo-container">
                <SqaMedallion size="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-lg font-serif font-black text-white">Success Quest Academy (SQA)</h4>
                <p className="text-[11px] text-brand-tealLight font-bold tracking-wider mt-0.5 mb-0">
                  YOUR CAREER LAUNCHPAD: LEARN, GROW, GET HIRED &amp; BUILD
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-0">
              Nurturing Young Minds • Guiding students and rising professionals from day one to career day—and beyond.
            </p>
          </div>

          {/* Contact Us Details */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="text-sm font-serif font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-0">
              <MapPin className="w-4 h-4 text-brand-tealLight" />
              <span>Contact Us</span>
            </h5>
            <div className="space-y-2.5 text-xs text-slate-300">
              <p className="flex items-start gap-2.5 mb-0">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Mumbai-Pune Expressway, Ravet, Pune 412101</span>
              </p>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-brand-tealLight shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block text-[11px] uppercase tracking-wider">Call</span>
                  <a href="tel:+918956690129" className="hover:text-brand-tealLight transition block text-slate-300">
                    +91 8956690129
                  </a>
                  <a href="tel:+918552870414" className="hover:text-brand-tealLight transition block text-slate-300">
                    +91 8552870414
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block text-[11px] uppercase tracking-wider">Email</span>
                  <a
                    href="mailto:successquestacademy@gmail.com"
                    className="hover:text-brand-accent transition text-slate-300"
                  >
                    successquestacademy@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick System Controls */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="text-sm font-serif font-bold text-white uppercase tracking-wider mb-0">Platform Actions</h5>
            <div className="flex flex-col gap-2.5 text-[11px]">
              <button
                type="button"
                onClick={() => onOpenConsultation('Admissions', 'General Inquiry')}
                className="w-full py-2.5 px-3.5 rounded-xl bg-brand-teal hover:brightness-110 text-white font-bold transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Counseling Session</span>
              </button>
              <button
                type="button"
                onClick={onSwitchToBackend}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition flex items-center justify-center gap-2 font-bold"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Counselor CRM Console</span>
              </button>
              <button
                type="button"
                onClick={onDownloadHtml}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-accent border border-slate-700 transition flex items-center justify-center gap-2 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HTML Website</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p className="mb-0">© 2026 Success Quest Academy (SQA). All rights reserved.</p>
          <p className="mb-0">Mumbai-Pune Expressway, Ravet, Pune 412101</p>
        </div>
      </div>
    </footer>
  );
}
