'use client';

import React from 'react';

/**
 * Standardized status badge used across all tables, cards, and review interfaces.
 * Never relies on color alone (always renders legible uppercase text).
 */
export default function StatusBadge({ status }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  let badgeClass = 'rp-badge-neutral';
  let label = status.replace(/_/g, ' ');

  switch (normalized) {
    case 'approved':
    case 'confirmed':
    case 'fulfilled':
    case 'active':
      badgeClass = 'rp-badge-success';
      break;

    case 'pending':
    case 'shortlisted':
    case 'need_info':
      badgeClass = 'rp-badge-warning';
      break;

    case 'rejected':
    case 'blocked':
    case 'error':
      badgeClass = 'rp-badge-danger';
      break;

    case 'open':
    case 'in_progress':
    case 'viewed':
    case 'submitted':
      badgeClass = 'rp-badge-info';
      break;

    case 'suspended':
    case 'on_hold':
    case 'hold':
    case 'closed':
    case 'draft':
    case 'inactive':
    default:
      badgeClass = 'rp-badge-neutral';
      break;
  }

  return (
    <span className={`rp-badge ${badgeClass}`}>
      {label}
    </span>
  );
}
