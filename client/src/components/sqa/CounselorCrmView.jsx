'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SqaMedallion from './SqaMedallion';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Shield, UserPlus, Download, Trash2 } from 'lucide-react';

const INITIAL_LEADS = [
  {
    id: 'LEAD-101',
    fullName: 'Dr. Vivek Ranade',
    email: 'v.ranade@univ.ac.in',
    phone: '+91 98450 12345',
    serviceCategory: 'Professional Skill Certifications',
    subStream: 'Applied Artificial Intelligence & Prompt Engineering',
    status: 'ENROLLED'
  },
  {
    id: 'LEAD-102',
    fullName: 'Sahil Kulkarni',
    email: 'sahil.k@gmail.com',
    phone: '+91 98221 44332',
    serviceCategory: 'Career Roadmap',
    subStream: '10 to 12th Pass: Career road map',
    status: 'NEW'
  },
  {
    id: 'LEAD-103',
    fullName: 'Aarav Sharma',
    email: 'aarav.fintech@gmail.com',
    phone: '+91 91580 99887',
    serviceCategory: 'Corporate Internship & placement support',
    subStream: 'Profile Matching & Interview Facilitation',
    status: 'CONTACTED'
  },
  {
    id: 'LEAD-104',
    fullName: 'Neha Deshpande',
    email: 'neha.founder@seedlab.io',
    phone: '+91 98111 22334',
    serviceCategory: 'Start-up & Market Research',
    subStream: 'Problem & Market Size + Unit Economics',
    status: 'NEW'
  }
];

export default function CounselorCrmView({
  onOpenConsultation,
  serverLogs = [],
  onClearLogs
}) {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [filterPillar, setFilterPillar] = useState('ALL');

  // Load leads from localStorage or API
  const fetchLeads = useCallback(async () => {
    try {
      const res = await api.get('/sqa/leads');
      if (res.data?.success && res.data.data?.length > 0) {
        // Map backend schema to UI format
        const apiLeads = res.data.data.map((item, idx) => ({
          id: `LEAD-${100 + idx + 1}`,
          fullName: item.fullName || item.name || 'Anonymous',
          email: item.email || 'N/A',
          phone: item.phone || 'N/A',
          serviceCategory: item.serviceCategory || item.category || 'Career Roadmap',
          subStream: item.subStream || item.details || 'General Inquiry',
          status: item.status || 'NEW'
        }));
        setLeads(apiLeads);
        return;
      }
    } catch {
      // LocalStorage fallback
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('sqa_v3_platform_db');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (parsed.leads && parsed.leads.length > 0) {
              setLeads(parsed.leads);
              return;
            }
          } catch {
            // ignore
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    const updated = leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l));
    setLeads(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem('sqa_v3_platform_db', JSON.stringify({ leads: updated }));
    }

    try {
      await api.patch(`/sqa/leads/${leadId}/status`, { status: newStatus });
      toast.success(`Lead ${leadId} status set to ${newStatus}`);
    } catch {
      toast.info(`Lead status updated to ${newStatus} (Saved Locally)`);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Pillar', 'Program/Track', 'Status'];
    const rows = leads.map((l) => [
      l.id,
      `"${l.fullName}"`,
      l.email,
      l.phone,
      `"${l.serviceCategory}"`,
      `"${l.subStream}"`,
      l.status
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SQA_Counselor_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Leads CSV exported successfully');
  };

  const filteredLeads =
    filterPillar === 'ALL'
      ? leads
      : leads.filter((l) =>
          l.serviceCategory.toLowerCase().includes(filterPillar.toLowerCase())
        );

  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.status === 'NEW').length;
  const contactedCount = leads.filter((l) => l.status === 'CONTACTED').length;
  const enrolledCount = leads.filter((l) => l.status === 'ENROLLED').length;

  return (
    <div id="view-backend" className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div id="backend-header-logo-container">
            <SqaMedallion size="w-14 h-14" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>SQA Counselor CRM &amp; Database Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 mb-0">
              Counselor Back-Office &amp; Lead Management
            </h1>
            <p className="text-xs text-slate-500 mb-0">
              Real-time candidate intake pipeline, tracking inquiries across all 5 official SQA strategic pillars.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenConsultation('Counselor Direct Intake', 'New Applicant')}
            className="px-4 py-2 bg-brand-teal hover:brightness-110 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Lead</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Leads (CSV)</span>
          </button>
          <button
            type="button"
            onClick={onClearLogs}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs border border-slate-300 transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* CRM Statistics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-[10px] font-bold uppercase">Total Leads</span>
          <div id="stat-total-leads" className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalCount}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-[10px] font-bold uppercase">New Inquiries</span>
          <div id="stat-new-leads" className="text-2xl font-bold font-mono text-cyan-700 mt-1">
            {newCount}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-[10px] font-bold uppercase">Contacted</span>
          <div id="stat-contacted-leads" className="text-2xl font-bold font-mono text-amber-600 mt-1">
            {contactedCount}
          </div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-slate-500 text-[10px] font-bold uppercase">Enrolled</span>
          <div id="stat-enrolled-leads" className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {enrolledCount}
          </div>
        </div>
      </div>

      {/* Filter by Strategic Pillar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <span className="text-slate-500 font-bold mr-2">Filter Pillar:</span>
        <button
          type="button"
          onClick={() => setFilterPillar('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterPillar === 'ALL'
              ? 'bg-brand-teal text-white shadow'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Pillars
        </button>
        <button
          type="button"
          onClick={() => setFilterPillar('Career Roadmap')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterPillar === 'Career Roadmap'
              ? 'bg-brand-teal text-white shadow'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Career Roadmap
        </button>
        <button
          type="button"
          onClick={() => setFilterPillar('Professional Skill Certifications')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterPillar === 'Professional Skill Certifications'
              ? 'bg-brand-teal text-white shadow'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Skill Certifications
        </button>
        <button
          type="button"
          onClick={() => setFilterPillar('Personality Development')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterPillar === 'Personality Development'
              ? 'bg-brand-teal text-white shadow'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Soft Skills
        </button>
        <button
          type="button"
          onClick={() => setFilterPillar('Corporate Internship')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterPillar === 'Corporate Internship'
              ? 'bg-brand-teal text-white shadow'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Placements
        </button>
        <button
          type="button"
          onClick={() => setFilterPillar('Start-up & Market Research')}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            filterPillar === 'Start-up & Market Research'
              ? 'bg-brand-teal text-white shadow'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          5. Start-up &amp; Market Research
        </button>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 font-mono text-xs text-slate-300 font-bold flex justify-between items-center">
          <span>TABLE: &quot;candidate_leads&quot; (Direct Express REST API + LocalStorage)</span>
          <span className="text-slate-400 font-normal">Real-Time Sync</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs mb-0">
            <thead className="bg-slate-800 text-slate-300 uppercase font-mono border-b border-slate-700">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Strategic Pillar</th>
                <th className="p-3">Program / Specific Track</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Counselor Action</th>
              </tr>
            </thead>
            <tbody id="crm-leads-table-body" className="divide-y divide-slate-200 text-slate-700">
              {filteredLeads.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono font-bold text-slate-900">{item.id}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{item.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.phone} • {item.email}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.serviceCategory}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">{item.subStream}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'ENROLLED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'CONTACTED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-brand-teal"
                    >
                      <option value="NEW">Mark NEW</option>
                      <option value="CONTACTED">Mark CONTACTED</option>
                      <option value="ENROLLED">Mark ENROLLED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Server HTTP Traffic Log */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-mono text-slate-300 font-bold">
            Live Node/Express Server HTTP Network Log
          </span>
          <span className="text-slate-400 text-[11px]">Direct Express REST Activity</span>
        </div>
        <div id="server-logs-list" className="divide-y divide-slate-100 font-mono text-xs max-h-64 overflow-y-auto">
          {serverLogs.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No recent network activity</div>
          ) : (
            serverLogs.map((log, idx) => (
              <div key={idx} className="p-2.5 px-4 flex items-center justify-between text-slate-700 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[10px]">{log.time}</span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      log.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : log.method === 'PATCH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-cyan-100 text-cyan-800'
                    }`}
                  >
                    {log.method}
                  </span>
                  <span className="font-semibold text-slate-800">{log.endpoint}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-600 font-bold">{log.status} OK</span>
                  <span className="text-slate-400">{log.latency}ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
