'use client';

import React from 'react';

export default function FilterBar({
  search = '',
  onSearchChange = null,
  filters = [],
  onReset = null,
  actions = null
}) {
  return (
    <div className="rp-card mb-4 p-3">
      <div className="row g-2 align-items-center">
        {onSearchChange && (
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {filters.map((f, idx) => (
          <div key={idx} className="col-auto">
            <select
              className="form-select form-select-sm"
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
            >
              <option value="">{f.label}</option>
              {f.options.map((opt, oIdx) => (
                <option key={oIdx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onReset && (
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onReset}
            >
              Reset
            </button>
          </div>
        )}

        {actions && (
          <div className="col text-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
