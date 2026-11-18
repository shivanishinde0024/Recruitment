'use client';

import React from 'react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  pagination = null,
  onPageChange = null,
  emptyMessage = 'No records found matching your criteria.'
}) {
  if (loading) {
    return (
      <div className="rp-card p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="rp-table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx}>
                      <div className="rp-skeleton py-2" style={{ width: '80%' }}>&nbsp;</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rp-card text-center py-5">
        <div style={{ fontSize: '2.5rem' }}>🔍</div>
        <h5 className="fw-semibold mt-2 mb-1">No Records Found</h5>
        <p className="text-muted small mb-0">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rp-card p-0 overflow-hidden">
      <div className="table-responsive">
        <table className="rp-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} style={col.width ? { width: col.width } : {}}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={row.id || rIdx}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <div className="small text-muted">
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
          </div>
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

