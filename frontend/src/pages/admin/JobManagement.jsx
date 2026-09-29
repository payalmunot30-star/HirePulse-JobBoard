import React, { useState, useEffect } from 'react';
import { jobService } from '../../services/job.service';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/Badge';
import { Briefcase, Building2, MapPin, XCircle } from 'lucide-react';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

export const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getJobs({ page_size: 100 });
      setJobs(data.results || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCloseJob = async (id) => {
    try {
      await jobService.closeJob(id);
      showToast('Job closed by administrator.', 'info');
      fetchJobs();
    } catch (err) {
      showToast('Failed to update job status.', 'error');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>System Job Postings Directory</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Overview of all published job positions across companies</p>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading system jobs...</div>
        ) : jobs.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Posted Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td style={{ fontWeight: 600 }}>{formatTitle(j.title)}</td>
                    <td style={{ fontWeight: 500 }}>{formatCompanyName(j.company_name)}</td>
                    <td>{formatTitle(j.category_display || j.category)}</td>
                    <td>{formatTitle(j.location)}</td>
                    <td>{formatTitle(j.job_type_display)}</td>
                    <td><StatusBadge status={j.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(j.created_at).toLocaleDateString()}</td>
                    <td>
                      {j.status === 'active' && (
                        <button
                          onClick={() => handleCloseJob(j.id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <XCircle size={14} /> Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No jobs found in system database.
          </div>
        )}
      </div>
    </div>
  );
};
