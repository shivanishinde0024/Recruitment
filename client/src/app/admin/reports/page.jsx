'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import RoleLayout from '../../../components/layout/RoleLayout';
import api from '../../../services/api';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('company-wise');
  const [format, setFormat] = useState('csv');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const reportConfigs = [
    {
      id: 'company-wise',
      title: 'Company-Wise Requisition & Placement Report',
      description: 'Comprehensive overview of corporate clients, active open positions, total candidate submissions, confirmed hires, and fulfillment rates.',
      columns: ['Company Name', 'Industry', 'Status', 'Total Jobs', 'Open Jobs', 'Total Positions', 'Candidates Submitted', 'Confirmed Hires', 'Fulfillment Rate (%)']
    },
    {
      id: 'candidate-pipeline',
      title: 'Candidate Pipeline & Matching Report',
      description: 'Detailed roster of mapped candidates across all requisitions, match percentage scores, pipeline status (submitted, shortlisted, confirmed), and submission dates.',
      columns: ['Candidate Name', 'Candidate Email', 'Candidate Mobile', 'Job Code', 'Job Title', 'Match Score (%)', 'Mapping Status', 'Mapped Date']
    },
    {
      id: 'job-requisitions',
      title: 'Job Requisitions Master Report',
      description: 'Inventory of all job orders, staffing positions required, current lifecycle status, application deadlines, and location criteria.',
      columns: ['Job Code', 'Job Title', 'Company Name', 'Positions Required', 'Status', 'Deadline', 'Location']
    }
  ];

  const handleExport = async () => {
    setDownloading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await api.get(`/reports/export?type=${reportType}&format=${format}`, {
        responseType: 'blob'
      });

      // Create browser blob download link
      const blob = new Blob([response.data], {
        type: format === 'csv'
          ? 'text/csv;charset=utf-8;'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMsg(`Successfully generated and downloaded ${reportType} report (.${format}).`);
    } catch (err) {
      setError('Failed to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const selectedConfig = reportConfigs.find((r) => r.id === reportType);

  return (
    <RoleLayout>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">Data Export & Analytics Reports</h1>
          <p className="text-muted small mb-0">
            Export sanitized CSV and Excel datasets with built-in formula injection defenses
          </p>
        </div>
        <Link href="/admin/dashboard" className="btn btn-outline-secondary btn-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="row g-4">
        {/* Export Configuration Card */}
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h5 className="fw-bold mb-3 text-dark">Export Settings</h5>

            {/* Select Report Type */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">Report Dataset</label>
              <div className="d-flex flex-column gap-2">
                {reportConfigs.map((r) => (
                  <div
                    key={r.id}
                    className={`border rounded p-3 cursor-pointer ${
                      reportType === r.id ? 'border-primary bg-primary-subtle' : 'bg-light'
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setReportType(r.id)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="reportType"
                        checked={reportType === r.id}
                        onChange={() => setReportType(r.id)}
                      />
                      <span className="fw-bold small text-dark">{r.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Format */}
            <div className="mb-4">
              <label className="form-label small fw-semibold">Export File Format</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${format === 'csv' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFormat('csv')}
                >
                  📄 CSV (Comma-Separated)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${format === 'xlsx' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setFormat('xlsx')}
                >
                  📊 Microsoft Excel (.xlsx)
                </button>
              </div>
              <div className="form-text extra-small mt-1 text-muted">
                🛡️ All text cells are strictly sanitized against spreadsheet formula injection (Master §8.4).
              </div>
            </div>

            {/* Download Trigger */}
            <button
              className="btn btn-success w-100 py-2 fw-semibold"
              onClick={handleExport}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Generating Export...
                </>
              ) : (
                `Download ${reportType.toUpperCase()} (.${format})`
              )}
            </button>
          </div>
        </div>

        {/* Dataset Preview and Schema Card */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 p-4 h-100">
            <h5 className="fw-bold mb-2 text-dark">{selectedConfig.title}</h5>
            <p className="text-muted small mb-4">{selectedConfig.description}</p>

            <h6 className="fw-bold small text-dark mb-2">Export Column Fields:</h6>
            <div className="table-responsive border rounded mb-3">
              <table className="table table-sm table-striped mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Column Name</th>
                    <th>Data Type</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedConfig.columns.map((col, idx) => (
                    <tr key={idx}>
                      <td className="text-muted">{idx + 1}</td>
                      <td className="fw-semibold text-dark">{col}</td>
                      <td className="text-muted extra-small">
                        {col.includes('Date') || col.includes('Deadline') ? 'Date (ISO-8601)' : col.includes('Rate') || col.includes('Jobs') || col.includes('Positions') || col.includes('Score') ? 'Numeric / Float' : 'String (Sanitized)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="alert alert-light border small mt-auto mb-0">
              <strong>Enterprise Integrity:</strong> Exports are generated on-the-fly directly from authoritative relational aggregates. No cached data or stale metrics are returned.
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
