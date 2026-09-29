import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { StatusBadge } from '../../components/common/Badge';
import { Briefcase, Users, CheckCircle2, Clock, PlusCircle, ArrowRight } from 'lucide-react';
import { formatTitle } from '../../utils/formatters';

export const RecruiterDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getRecruiterDashboard()
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading recruiter analytics...</div>;
  if (!data) return null;

  const { overview, status_distribution, jobs_breakdown, recent_applications } = data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Recruiter Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Overview of active job postings and recruitment pipeline</p>
        </div>
        <Link to="/recruiter/create-job" className="btn btn-primary">
          <PlusCircle size={18} /> Post New Position
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <Link
          to="/recruiter/jobs?status=active"
          className="stat-card"
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          title="View Active Job Postings"
        >
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}><Briefcase /></div>
          <div>
            <div className="stat-value">{overview.active_jobs}</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Active Job Postings <ArrowRight size={13} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
        </Link>

        {/* 2. Total Applicants */}
        <Link
          to="/recruiter/applicants"
          className="stat-card"
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          title="View All Applicants"
        >
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}><Users /></div>
          <div>
            <div className="stat-value">{overview.total_applicants}</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Total Applicants <ArrowRight size={13} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
        </Link>

        {/* 3. Shortlisted Candidates */}
        <Link
          to="/recruiter/applicants?status=shortlisted"
          className="stat-card"
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          title="View Shortlisted Candidates"
        >
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}><Clock /></div>
          <div>
            <div className="stat-value">{overview.shortlisted_count}</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Shortlisted Candidates <ArrowRight size={13} style={{ color: 'var(--primary)' }} />
            </div>
          </div>
        </Link>

        {/* 4. Successful Hires */}
        <Link
          to="/recruiter/applicants?status=hired"
          className="stat-card"
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
          title="View Successful Hires"
        >
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}><CheckCircle2 /></div>
          <div>
            <div className="stat-value">{overview.hired_count}</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Successful Hires <ArrowRight size={13} style={{ color: 'var(--success)' }} />
            </div>
          </div>
        </Link>
      </div>

      {/* Pipeline Status Distribution Cards */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Pipeline Status Breakdown</h3>
        <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          <div className="stat-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <span className="badge badge-applied">Applied</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.6rem', color: '#172B4D' }}>{status_distribution.applied}</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <span className="badge badge-shortlisted">Shortlisted</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.6rem', color: '#172B4D' }}>{status_distribution.shortlisted}</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <span className="badge badge-interview">Interview</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.6rem', color: '#172B4D' }}>{status_distribution.interview}</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <span className="badge badge-hired">Hired</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.6rem', color: '#172B4D' }}>{status_distribution.hired}</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
            <span className="badge badge-rejected">Rejected</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.6rem', color: '#172B4D' }}>{status_distribution.rejected}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Active Jobs with Applicant Counts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Job Postings Summary</h3>
            <Link to="/recruiter/jobs" className="btn btn-secondary btn-sm">Manage All</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Applicants</th>
                </tr>
              </thead>
              <tbody>
                {jobs_breakdown.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 600 }}>{formatTitle(job.title)}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{job.applicant_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Applicants */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Candidate Submissions</h3>
            <Link to="/recruiter/applicants" className="btn btn-secondary btn-sm">Review Applicants</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Position</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{formatTitle(app.candidate_name)}</td>
                    <td>{formatTitle(app.job_title)}</td>
                    <td><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
