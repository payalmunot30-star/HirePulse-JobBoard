import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (st) => {
    switch (st?.toLowerCase()) {
      case 'applied':
        return 'badge-applied';
      case 'shortlisted':
        return 'badge-shortlisted';
      case 'interview':
        return 'badge-interview';
      case 'hired':
        return 'badge-hired';
      case 'rejected':
        return 'badge-rejected';
      case 'active':
        return 'badge-active';
      case 'closed':
        return 'badge-closed';
      default:
        return 'badge-applied';
    }
  };

  const displayText = status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : '';

  return <span className={`badge ${getBadgeClass(status)}`}>{displayText}</span>;
};
