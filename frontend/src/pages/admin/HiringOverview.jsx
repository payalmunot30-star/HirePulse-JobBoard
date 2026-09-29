import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services/dashboard.service';
import { StatusBadge } from '../../components/common/Badge';
import {
  BarChart2,
  CheckCircle2,
  Users,
  Briefcase,
  FileText,
  Clock,
  Search,
  Filter,
  TrendingUp,
  Building2,
  UserCheck,
  XCircle,
  ArrowUpRight,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

/* ── Helper: format date ── */
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* ── Reusable: Stat Card ── */
const StatCard = ({ icon: Icon, label, value, color, bgColor, subtitle }) => (
  <div
    className="stat-card"
    style={{
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'all 0.2s ease',
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bgColor || '#E8F3FF',
        color: color || 'var(--primary)',
        flexShrink: 0,
      }}
    >
      <Icon size={22} />
    </div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{label}</div>
      {subtitle && <div style={{ fontSize: '0.75rem', color: color || 'var(--primary)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  </div>
);

/* ── Reusable: Section Header ── */
const SectionHeader = ({ icon: Icon, title, subtitle, right }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.25rem',
      flexWrap: 'wrap',
      gap: '0.75rem',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {Icon && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#E8F3FF',
            color: 'var(--primary)',
          }}
        >
          <Icon size={18} />
        </div>
      )}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
    {right && <div>{right}</div>}
  </div>
);

/* ── Pipeline Mini-bar ── */
const PipelineBar = ({ applied = 0, shortlisted = 0, interview = 0, rejected = 0, hired = 0 }) => {
  const total = applied + shortlisted + interview + rejected + hired;
  if (total === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No applicants</span>;

  const segments = [
    { key: 'applied', count: applied, color: '#667085' },
    { key: 'shortlisted', count: shortlisted, color: '#2167D5' },
    { key: 'interview', count: interview, color: '#1558BD' },
    { key: 'hired', count: hired, color: 'var(--success, #16834B)' },
    { key: 'rejected', count: rejected, color: 'var(--danger, #C62828)' },
  ].filter((s) => s.count > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
      <div
        style={{
          display: 'flex',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          background: 'var(--bg-surface)',
        }}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            style={{
              width: `${(s.count / total) * 100}%`,
              backgroundColor: s.color,
              minWidth: 3,
              transition: 'width 0.4s ease',
            }}
            title={`${s.key}: ${s.count}`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        {segments.map((s) => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block' }} />
            {s.count}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ── Collapsible Section Wrapper ── */
const CollapsibleSection = ({ children, defaultOpen = true, title, icon, subtitle, right }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="card"
      style={{ marginBottom: '1.5rem', overflow: 'hidden' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '0.25rem 0',
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <SectionHeader icon={icon} title={title} subtitle={subtitle} right={right} />
        <div style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      {open && <div style={{ marginTop: '0.5rem' }}>{children}</div>}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export const HiringOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [recruiterFilter, setRecruiterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (recruiterFilter) params.recruiter_id = recruiterFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const result = await dashboardService.getAdminHiringPipeline(params);
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Failed to load hiring pipeline data.');
    } finally {
      setLoading(false);
    }
  }, [recruiterFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  /* Loading state */
  if (loading && !data) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Loading hiring pipeline analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <XCircle size={40} style={{ color: 'var(--error)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--error)', fontWeight: 600 }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, recruiter_overview, job_pipeline, applications, recent_activity, recruiter_options } = data;

  return (
    <div>
      {/* ── PAGE HEADER ── */}
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
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={28} style={{ color: 'var(--primary)' }} />
            Hiring Pipeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0' }}>
            Platform-wide recruitment analytics — recruiters, jobs, candidates &amp; application statuses
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={fetchData}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         SECTION 1 — SUMMARY CARDS
         ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard icon={Users} label="Active Recruiters" value={summary.total_recruiters} color="#2167D5" bgColor="#E8F3FF" />
        <StatCard icon={Briefcase} label="Active Jobs" value={summary.total_active_jobs} color="#2167D5" bgColor="#F3F8FF" />
        <StatCard icon={FileText} label="Total Applications" value={summary.total_applications} color="#172B4D" bgColor="#E8F3FF" />
        <StatCard icon={CheckCircle2} label="Total Hired" value={summary.total_hired} color="var(--success)" bgColor="var(--success-bg)" />
      </div>

      {/* Pipeline status progression cards row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '2.5rem',
        }}
      >
        {[
          { label: 'Applied', value: summary.total_applied ?? 0, color: '#2167D5' },
          { label: 'Shortlisted', value: summary.total_shortlisted ?? 0, color: '#2167D5' },
          { label: 'Interview', value: summary.total_interview ?? 0, color: '#1558BD' },
          { label: 'Hired', value: summary.total_hired ?? 0, color: 'var(--success, #16834B)' },
          { label: 'Rejected', value: summary.total_rejected ?? 0, color: 'var(--danger, #C62828)' },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card"
            style={{
              padding: '1rem 1.25rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
         SECTION 2 — RECRUITER HIRING OVERVIEW
         ══════════════════════════════════════════════════════════════ */}
      <CollapsibleSection
        icon={Building2}
        title="Recruiter Hiring Overview"
        subtitle={`${recruiter_overview.length} recruiter${recruiter_overview.length !== 1 ? 's' : ''} on the platform`}
      >
        {recruiter_overview.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recruiters found</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Company</th>
                  <th style={{ textAlign: 'center' }}>Jobs</th>
                  <th style={{ textAlign: 'center' }}>Active</th>
                  <th style={{ textAlign: 'center' }}>Applications</th>
                  <th style={{ textAlign: 'center' }}>Shortlisted</th>
                  <th style={{ textAlign: 'center' }}>Interview</th>
                  <th style={{ textAlign: 'center' }}>Hired</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recruiter_overview.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatTitle(r.name)}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.email}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatCompanyName(r.company)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.jobs_created}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--success)' }}>{r.active_jobs}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{r.total_applications}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#2167D5' }}>{r.shortlisted}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#1558BD' }}>{r.interview}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>{r.hired}</td>
                    <td>
                      <span
                        className={`badge ${r.is_active ? 'badge-active' : 'badge-closed'}`}
                      >
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* ══════════════════════════════════════════════════════════════
         SECTION 3 — JOB-WISE PIPELINE
         ══════════════════════════════════════════════════════════════ */}
      <CollapsibleSection
        icon={Briefcase}
        title="Job-wise Pipeline"
        subtitle={`${job_pipeline.length} job${job_pipeline.length !== 1 ? 's' : ''} with application breakdown`}
      >
        {job_pipeline.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No jobs found</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Recruiter</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ minWidth: 140 }}>Pipeline</th>
                  <th>Posted</th>
                </tr>
              </thead>
              <tbody>
                {job_pipeline.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatTitle(job.title)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTitle(job.category)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatTitle(job.recruiter_name)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatCompanyName(job.company)}</div>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                      {job.total_applications}
                    </td>
                    <td>
                      <PipelineBar
                        applied={job.applied}
                        shortlisted={job.shortlisted}
                        interview={job.interview}
                        rejected={job.rejected}
                        hired={job.hired}
                      />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{fmtDate(job.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* ══════════════════════════════════════════════════════════════
         SECTION 4 — APPLICATION REVIEW
         ══════════════════════════════════════════════════════════════ */}
      <CollapsibleSection
        icon={FileText}
        title="Application Review"
        subtitle={`${applications.length} application${applications.length !== 1 ? 's' : ''} matching filters`}
        right={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 4 }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search candidate / job..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    width: 180,
                  }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm">
                Go
              </button>
            </form>

            {/* Recruiter filter */}
            <select
              value={recruiterFilter}
              onChange={(e) => setRecruiterFilter(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.45rem 0.6rem',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
              }}
            >
              <option value="">All Recruiters</option>
              {(recruiter_options || []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.company})
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.45rem 0.6rem',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>
        }
      >
        {applications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No applications match your filters</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Recruiter / Company</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatTitle(app.candidate_name)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.candidate_email}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatTitle(app.job_title)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatTitle(app.recruiter_name)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatCompanyName(app.company)}</div>
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{fmtDate(app.applied_at)}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{fmtDate(app.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* ══════════════════════════════════════════════════════════════
         SECTION 5 — RECENT ACTIVITY FEED
         ══════════════════════════════════════════════════════════════ */}
      <CollapsibleSection
        icon={Activity}
        title="Recent Activity"
        subtitle="Latest application status changes across the platform"
      >
        {recent_activity.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recent_activity.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#E8F3FF',
                      color: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  >
                    <ArrowUpRight size={14} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {formatTitle(item.candidate_name)}
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> applied to </span>
                      {formatTitle(item.job_title)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      by {formatTitle(item.recruiter_name)} • {formatCompanyName(item.company)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <StatusBadge status={item.status} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <Clock size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {fmtDateTime(item.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* ── Pipeline Legend ── */}
      <div
        style={{
          padding: '1rem 1.25rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ fontWeight: 700 }}>Pipeline Legend:</span>
        {[
          { label: 'Applied', color: '#667085' },
          { label: 'Shortlisted', color: '#2167D5' },
          { label: 'Interview', color: '#1558BD' },
          { label: 'Hired', color: 'var(--success, #16834B)' },
          { label: 'Rejected', color: 'var(--danger, #C62828)' },
        ].map((s) => (
          <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};
