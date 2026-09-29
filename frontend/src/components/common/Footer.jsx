import React from 'react';
import { Briefcase } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)', padding: '2.5rem 1.5rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={20} color="#2167D5" />
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#172B4D' }}>Hire<span style={{ color: '#2167D5' }}>Pulse</span></span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          © {new Date().getFullYear()} HirePulse Inc. Enterprise Recruitment & Hiring System. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
