import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applicationService } from '../../services/application.service';
import { jobService } from '../../services/job.service';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { FileText, User, Mail, Phone, MapPin, ExternalLink, Download } from 'lucide-react';
import { viewResume, downloadResume } from '../../utils/resume';
import { formatTitle } from '../../utils/formatters';

export const ApplicantsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobFilter = searchParams.get('job') || '';
  const initialStatusFilter = searchParams.get('status') || '';

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(initialJobFilter);
  const [selectedStatus, setSelectedStatus] = useState(initialStatusFilter);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    jobService.getRecruiterJobs().then((data) => setJobs(data.results || data)).catch(() => {});
  }, []);

  // Synchronize state when URL query params change
  useEffect(() => {
    setSelectedJob(searchParams.get('job') || '');
    setSelectedStatus(searchParams.get('status') || '');
  }, [searchParams]);

  const fetchApplications = async () => {
    setLoading(true);
    const params = {};
    if (selectedJob) params.job = selectedJob;
    if (selectedStatus) params.status = selectedStatus;

    try {
      const data = await applicationService.getRecruiterApplications(params);
      setApplications(data.results || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedJob, selectedStatus]);

  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams);
  };

  const handleJobFilterChange = (jobId) => {
    setSelectedJob(jobId);
    const newParams = new URLSearchParams(searchParams);
    if (jobId) {
      newParams.set('job', jobId);
    } else {
      newParams.delete('job');
    }
    setSearchParams(newParams);
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationService.updateStatus(appId, newStatus);
      showToast(`Applicant status updated to '${newStatus}'. Notification and email sent!`, 'success');
      fetchApplications();
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Applicant Review & Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review candidate profiles and update application status</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: '220px' }}
            value={selectedJob}
            onChange={(e) => handleJobFilterChange(e.target.value)}
          >
            <option value="">All Posted Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{formatTitle(j.title)}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={selectedStatus}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading applicants...</div>
        ) : applications.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Title</th>
                  <th>Submitted Resume</th>
                  <th>Current Status</th>
                  <th>Update Status</th>
                  <th>Applied On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{formatTitle(app.candidate_name)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.candidate_email}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatTitle(app.job?.title || app.job_title)}</td>
                    <td>
                      {app.resume ? (
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
                            onClick={() => downloadResume(app.resume_url || app.resume, `${app.candidate_name.replace(/\s+/g, '_')}_Resume.pdf`)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.55rem' }}
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No File</span>
                      )}
                    </td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      >
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(app.applied_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => setSelectedApp(app)} className="btn btn-secondary btn-sm">
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No applicants found matching the selected filter criteria.
          </div>
        )}
      </div>

      {/* Candidate Details Modal */}
      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Candidate Application Record">
        {selectedApp && (
          <div>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{formatTitle(selectedApp.candidate_name)}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{selectedApp.candidate_email}</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>Position: <strong>{formatTitle(selectedApp.job?.title || selectedApp.job_title)}</strong></span>
                <span>Applied: <strong>{new Date(selectedApp.applied_at).toLocaleDateString()}</strong></span>
              </div>
            </div>

            {selectedApp.cover_letter && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Cover Letter</h5>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-line', backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                  {selectedApp.cover_letter}
                </p>
              </div>
            )}

            {selectedApp.resume && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => viewResume(selectedApp.resume_url || selectedApp.resume)}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={16} /> View Resume PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadResume(selectedApp.resume_url || selectedApp.resume, `${selectedApp.candidate_name.replace(/\s+/g, '_')}_Resume.pdf`)}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
