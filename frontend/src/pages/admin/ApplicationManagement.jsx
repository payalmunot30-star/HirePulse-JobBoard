import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { applicationService } from '../../services/application.service';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  FileText,
  Building,
  User,
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { viewResume, downloadResume } from '../../utils/resume';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const ApplicationManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const initialRecruiter = searchParams.get('recruiter') || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [recruiterFilter, setRecruiterFilter] = useState(initialRecruiter);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal detail state
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Sync state if URL query params change
  useEffect(() => {
    setStatusFilter(searchParams.get('status') || '');
    setRecruiterFilter(searchParams.get('recruiter') || '');
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (recruiterFilter) params.recruiter_id = recruiterFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await dashboardService.getAdminHiringPipeline(params);
      setData(res);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, recruiterFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams);
  };

  const handleRecruiterChange = (recruiterId) => {
    setRecruiterFilter(recruiterId);
    const newParams = new URLSearchParams(searchParams);
    if (recruiterId) {
      newParams.set('recruiter', recruiterId);
    } else {
      newParams.delete('recruiter');
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setRecruiterFilter('');
    setSearchInput('');
    setSearchTerm('');
    setSearchParams({});
  };

  const handleOpenDetail = async (appSummary) => {
    setSelectedApp(appSummary);
    setDetailLoading(true);
    try {
      const fullDetail = await applicationService.getApplicationById(appSummary.id);
      setSelectedApp((prev) => ({ ...prev, ...fullDetail }));
    } catch (err) {
      console.error('Failed to fetch application details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const summary = data?.summary || {};
  const applications = data?.applications || [];
  const recruiterOptions = data?.recruiter_options || [];

  return (
    <div>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Applications Management</h1>
            {summary.total_applications !== undefined && (
              <span
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                }}
              >
                {summary.total_applications} Total
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0' }}>
            Monitor candidate job applications, associated job postings, assigned recruiters, and real-time application statuses
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Interactive Metric Filters ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          { key: '', label: 'All Applications', value: summary.total_applications ?? 0, color: 'var(--text-primary)' },
          { key: 'applied', label: 'Applied', value: summary.total_applied ?? 0, color: '#667085' },
          { key: 'shortlisted', label: 'Shortlisted', value: summary.total_shortlisted ?? 0, color: '#2167D5' },
          { key: 'interview', label: 'Interview', value: summary.total_interview ?? 0, color: '#1558BD' },
          { key: 'hired', label: 'Hired', value: summary.total_hired ?? 0, color: '#16834B' },
          { key: 'rejected', label: 'Rejected', value: summary.total_rejected ?? 0, color: '#C62828' },
        ].map((item) => {
          const isActive = statusFilter === item.key;
          return (
            <div
              key={item.key}
              onClick={() => handleStatusChange(item.key)}
              className={`metric-filter-card ${isActive ? 'active' : ''}`}
            >
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: item.color, lineHeight: 1 }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px', maxWidth: '450px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search candidate, job title, company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0 1rem' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recruiter Selector */}
          <select
            className="form-control"
            value={recruiterFilter}
            onChange={(e) => handleRecruiterChange(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="">All Recruiters</option>
            {recruiterOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.company})
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>

          {(statusFilter || recruiterFilter || searchTerm) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--danger)' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Applications Table ── */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 1rem',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
            Loading applications directory...
          </div>
        ) : applications.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Post</th>
                  <th>Recruiter & Company</th>
                  <th>Application Status</th>
                  <th>Applied On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    {/* Candidate Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {(app.candidate_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatTitle(app.candidate_name || 'Candidate')}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {app.candidate_email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Job Post */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatTitle(app.job_title)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <Briefcase size={12} /> Job #{app.job_id}
                      </div>
                    </td>

                    {/* Recruiter & Company */}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatCompanyName(app.company || 'Direct Hiring')}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <Building size={12} /> {formatTitle(app.recruiter_name)}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={app.status} />
                    </td>

                    {/* Applied Date */}
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {fmtDate(app.applied_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(app)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              No applications found
            </h3>
            <p style={{ fontSize: '0.875rem' }}>
              {statusFilter || recruiterFilter || searchTerm
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'No candidate applications have been submitted to the platform yet.'}
            </p>
            {(statusFilter || recruiterFilter || searchTerm) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1rem' }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Application Detail Modal ── */}
      <Modal
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
      >
        {selectedApp && (
          <div>
            {/* Header info */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                    {formatTitle(selectedApp.candidate_name)}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={13} /> {selectedApp.candidate_email}
                  </div>
                </div>
                <StatusBadge status={selectedApp.status} />
              </div>
            </div>

            {/* Grid detail */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Job Position
                </div>
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{formatTitle(selectedApp.job_title)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Job ID: #{selectedApp.job_id}</div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Recruiter & Company
                </div>
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{formatCompanyName(selectedApp.company)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTitle(selectedApp.recruiter_name)}</div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Applied Date
                </div>
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{fmtDate(selectedApp.applied_at)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated: {fmtDate(selectedApp.updated_at)}</div>
              </div>
            </div>

            {/* Cover Letter if any */}
            {selectedApp.cover_letter && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Cover Letter / Notes
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    padding: '1rem',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-primary)',
                    maxHeight: '150px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedApp.cover_letter}
                </div>
              </div>
            )}

            {/* Resume actions if available */}
            {(selectedApp.resume || selectedApp.resume_url) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText size={22} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Candidate Resume (PDF)</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified uploaded document</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => viewResume(selectedApp.resume_url || selectedApp.resume)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <ExternalLink size={14} /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadResume(selectedApp.resume_url || selectedApp.resume, `${selectedApp.candidate_name || 'candidate'}_resume.pdf`)}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
