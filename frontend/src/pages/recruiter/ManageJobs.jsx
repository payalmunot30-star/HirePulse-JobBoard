import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { jobService } from '../../services/job.service';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/Badge';
import { PlusCircle, Edit3, XCircle, Users, CheckCircle2, Archive } from 'lucide-react';
import { formatTitle } from '../../utils/formatters';

export const ManageJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const statusFilter = searchParams.get('status') || 'all';

  const fetchRecruiterJobs = async () => {
    try {
      const data = await jobService.getRecruiterJobs();
      setJobs(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiterJobs();
  }, []);

  const handleStatusChange = (newStatus) => {
    const newParams = new URLSearchParams(searchParams);
    if (newStatus === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', newStatus);
    }
    setSearchParams(newParams);
  };

  const handleCloseJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job posting? Candidates will no longer be able to apply.')) {
      return;
    }
    try {
      await jobService.closeJob(jobId);
      showToast('Job posting closed.', 'info');
      fetchRecruiterJobs();
    } catch (err) {
      showToast('Failed to close job posting.', 'error');
    }
  };

  // Counts for each filter status
  const counts = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => j.status === 'active').length;
    const closed = jobs.filter((j) => j.status === 'closed').length;
    return { total, active, closed };
  }, [jobs]);

  // Filtered jobs list based on statusFilter
  const filteredJobs = useMemo(() => {
    if (statusFilter === 'active') {
      return jobs.filter((j) => j.status === 'active');
    }
    if (statusFilter === 'closed') {
      return jobs.filter((j) => j.status === 'closed');
    }
    return jobs;
  }, [jobs, statusFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Manage Job Postings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Showing {filteredJobs.length} {statusFilter === 'all' ? 'total' : statusFilter} {filteredJobs.length === 1 ? 'vacancy' : 'vacancies'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Active / Closed Filter Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.4rem',
              backgroundColor: 'var(--bg-surface)',
              padding: '0.35rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: 600, padding: '0.45rem 0.85rem' }}
              onClick={() => handleStatusChange('all')}
            >
              All ({counts.total})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, padding: '0.45rem 0.85rem' }}
              onClick={() => handleStatusChange('active')}
            >
              <CheckCircle2 size={15} /> Active ({counts.active})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'closed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, padding: '0.45rem 0.85rem' }}
              onClick={() => handleStatusChange('closed')}
            >
              <Archive size={15} /> Closed ({counts.closed})
            </button>
          </div>

          <Link to="/recruiter/create-job" className="btn btn-primary">
            <PlusCircle size={18} /> Post New Position
          </Link>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading posted vacancies...</div>
        ) : filteredJobs.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 600 }}>{formatTitle(job.title)}</td>
                    <td>{formatTitle(job.category_display || job.category)}</td>
                    <td>{formatTitle(job.location)}</td>
                    <td>{formatTitle(job.job_type_display || job.job_type)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      <Link to={`/recruiter/applicants?job=${job.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Users size={14} /> {job.applicant_count || 0}
                      </Link>
                    </td>
                    <td><StatusBadge status={job.status} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link to={`/recruiter/jobs/${job.id}/edit`} className="btn btn-secondary btn-sm" title="Edit Job">
                          <Edit3 size={14} /> Edit
                        </Link>
                        {job.status === 'active' && (
                          <button
                            onClick={() => handleCloseJob(job.id)}
                            className="btn btn-danger btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                            title="Close Job"
                          >
                            <XCircle size={14} /> Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            You haven't posted any jobs yet. <Link to="/recruiter/create-job" style={{ fontWeight: 600 }}>Create your first posting</Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No {statusFilter} job postings found.{' '}
            <button
              onClick={() => handleStatusChange('all')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Show all jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
