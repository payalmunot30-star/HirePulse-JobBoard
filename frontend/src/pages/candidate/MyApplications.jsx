import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../../services/application.service';
import { StatusBadge } from '../../components/common/Badge';
import { FileText, ExternalLink, Download } from 'lucide-react';
import { viewResume, downloadResume } from '../../utils/resume';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

export const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = statusFilter ? { status: statusFilter } : {};
    applicationService.getMyApplications(params)
      .then((data) => {
        setApplications(data.results || data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Job Applications</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track real-time updates and recruitment status</p>
        </div>

        <select
          className="form-control"
          style={{ width: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="applied">Applied</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading applications...</div>
        ) : applications.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Submitted Resume</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{formatTitle(app.job?.title)}</td>
                    <td>{formatCompanyName(app.job?.company_name || app.job?.company?.name || 'HirePulse')}</td>
                    <td>
                      {(app.resume_url || app.resume) ? (
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => viewResume(app.resume_url || app.resume)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="View Resume in new tab"
                          >
                            <FileText size={14} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadResume(app.resume_url || app.resume, `${app.job.title.replace(/\s+/g, '_')}_Resume.pdf`)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.55rem' }}
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Default Profile</span>
                      )}
                    </td>
                    <td><StatusBadge status={app.status} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(app.applied_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/jobs/${app.job.id}`} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        View Job <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No applications match the selected status filter.
          </div>
        )}
      </div>
    </div>
  );
};
