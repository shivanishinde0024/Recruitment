'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../../../services/api';

export default function BulkCandidateUploadPage() {
  const [excelFile, setExcelFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = () => {
    // Generate simple CSV/Excel structure as data URI
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Name,Email,Mobile,Gender,Experience,Current Company,Current Designation,Current Salary,Expected Salary,Notice Period,Skills,Resume File\n' +
      'Arun Kumar,arun@example.com,9876543201,male,4,Infosys,Senior Developer,700000,1000000,30,"Node.js, React",arun_resume.pdf\n' +
      'Pooja Verma,pooja@example.com,9876543202,female,6,TCS,Lead Architect,1200000,1600000,60,"Python, AWS",pooja_resume.pdf\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Candidate_Bulk_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setError('Please select an Excel (.xlsx or .csv) spreadsheet file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = new FormData();
      data.append('file', excelFile);
      if (zipFile) {
        data.append('resumes_zip', zipFile);
      }

      const res = await api.post('/candidates/bulk', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk candidate upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <div className="mb-3">
        <Link href="/admin/candidates" className="btn btn-link btn-sm text-decoration-none p-0 text-muted">
          ← Back to Candidates
        </Link>
      </div>

      <div className="card shadow-sm border-0 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 border-bottom pb-3">
          <div>
            <h1 className="h3 fw-bold mb-1">Bulk Candidate Import</h1>
            <p className="text-muted small mb-0">
              Import hundreds of candidate profiles at once via Excel spreadsheet and zip archive of resume attachments.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleDownloadTemplate}
          >
            ⬇ Download Sample Template
          </button>
        </div>

        {error && (
          <div className="alert alert-danger small mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleUploadSubmit}>
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="border border-2 border-dashed rounded p-4 text-center bg-light">
                <span style={{ fontSize: '2rem' }}>📊</span>
                <h2 className="h6 fw-bold mt-2 mb-1">1. Excel Spreadsheet (.xlsx) *</h2>
                <p className="text-muted small mb-3">
                  Upload spreadsheet containing candidate details (up to 200 rows per batch).
                </p>
                <input
                  type="file"
                  className="form-control form-control-sm"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  required
                />
                {excelFile && (
                  <div className="text-success small fw-semibold mt-2">
                    ✓ Selected: {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <div className="border border-2 border-dashed rounded p-4 text-center bg-light">
                <span style={{ fontSize: '2rem' }}>📦</span>
                <h2 className="h6 fw-bold mt-2 mb-1">2. Resumes Archive (.zip) (Optional)</h2>
                <p className="text-muted small mb-3">
                  Zip file containing resume documents referenced in the spreadsheet.
                </p>
                <input
                  type="file"
                  className="form-control form-control-sm"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                />
                {zipFile && (
                  <div className="text-success small fw-semibold mt-2">
                    ✓ Selected: {zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top">
            <span className="text-muted small">
              Duplicate records (matching email or mobile) are automatically isolated in the error summary.
            </span>
            <button
              type="submit"
              className="btn btn-primary px-4"
              disabled={loading || !excelFile}
            >
              {loading ? 'Processing Import...' : 'Start Bulk Import'}
            </button>
          </div>
        </form>
      </div>

      {/* Upload Results Summary */}
      {result && (
        <div className="card shadow-sm border-0 p-4">
          <h2 className="h5 fw-bold mb-3">Import Execution Report</h2>
          <div className="row g-3 mb-4 text-center">
            <div className="col-sm-4">
              <div className="border rounded p-3">
                <span className="text-muted small text-uppercase fw-semibold">Total Evaluated</span>
                <div className="h3 fw-bold text-dark mt-1 mb-0">{result.total_rows}</div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="border rounded p-3 bg-light">
                <span className="text-muted small text-uppercase fw-semibold text-success">Imported Successfully</span>
                <div className="h3 fw-bold text-success mt-1 mb-0">{result.imported_count}</div>
              </div>
            </div>
            <div className="col-sm-4">
              <div className="border rounded p-3">
                <span className="text-muted small text-uppercase fw-semibold text-danger">Skipped / Errors</span>
                <div className="h3 fw-bold text-danger mt-1 mb-0">{result.skipped_count}</div>
              </div>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div>
              <h3 className="h6 fw-bold text-danger mb-2">Skipped Rows Breakdown</h3>
              <div className="table-responsive">
                <table className="table table-bordered table-sm small align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80px' }}>Row #</th>
                      <th>Candidate Email</th>
                      <th>Failure Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold text-center">{err.row}</td>
                        <td><code>{err.email}</code></td>
                        <td className="text-danger">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-3 text-end">
            <Link href="/admin/candidates" className="btn btn-outline-primary btn-sm">
              View Candidate Directory →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

