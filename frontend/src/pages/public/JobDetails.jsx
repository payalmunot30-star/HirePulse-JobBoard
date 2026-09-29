import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobService } from '../../services/job.service';
import { applicationService } from '../../services/application.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { MapPin, Briefcase, IndianRupee, Building2, Calendar, CheckCircle2, ArrowLeft, Upload, CheckCircle, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { CompanyBanner, CompanyLogo } from '../../components/common/CompanyBranding';
import { validatePdfFile } from '../../utils/resume';
import { formatSalaryRange } from '../../utils/currency';
import { formatCompanyName, normalizeMediaUrl } from '../../utils/formatters';

export const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isCandidate } = useAuth();
  const { showToast } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    jobService.getJobById(id)
      .then(setJob)
      .catch((err) => {
        showToast('Job posting not found.', 'error');
        navigate('/jobs');
      })
      .finally(() => setLoading(false));

    // Check if user already applied
    if (isAuthenticated && isCandidate) {
      applicationService.getMyApplications()
        .then((data) => {
          const applied = (data.results || data).some((app) => app.job.id === parseInt(id));
          setHasApplied(applied);
        })
        .catch(() => { });
    }
  }, [id, isAuthenticated, isCandidate]);

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setResumeFile(null);
      return;
    }
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      e.target.value = '';
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
    showToast(`PDF selected: ${file.name}`, 'info');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();

    if (resumeFile) {
      const validation = validatePdfFile(resumeFile);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }
    }

    setApplying(true);

    const formData = new FormData();
    formData.append('job', id);
    formData.append('cover_letter', coverLetter);
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    try {
      await applicationService.applyJob(formData);
      showToast('Application submitted successfully!', 'success');
      setHasApplied(true);
      setIsApplyModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.resume?.[0] || err.response?.data?.detail || 'Failed to submit application.';
      showToast(msg, 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading job details...</div>;
  }

  if (!job) return null;

  const rawLogo =
    job?.company?.logo ||
    job?.recruiter?.logo_url ||
    job?.recruiter?.company_logo ||
    job?.recruiter_logo ||
    null;

  const rawBanner =
    job?.company?.banner ||
    job?.recruiter?.banner_url ||
    job?.recruiter?.company_banner ||
    null;

  const company = {
    name: formatCompanyName(
      job?.company?.name ||
      job?.company_name ||
      job?.recruiter?.company_name ||
      job?.recruiter_name ||
      'Hiring Company'
    ),
    logo: normalizeMediaUrl(rawLogo),
    banner: normalizeMediaUrl(rawBanner),
    location: job?.location || job?.company?.location || job?.recruiter?.company_location || '',
    website: job?.company?.website || job?.recruiter?.company_website || '',
    description: job?.company?.description || job?.recruiter?.company_description || '',
    brand_color: job?.company?.brand_color || job?.recruiter?.brand_color || '',
  };

  const companyName = company.name || 'Hiring Company';
  const brandColor =
    company.brand_color ||
    (companyName.toLowerCase().includes('abc')
      ? '#059669'
      : companyName.toLowerCase().includes('xyz')
      ? '#2563eb'
      : '#2167D5');

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Job Listings
      </Link>

      <div className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
        {/* Company Header Banner */}
        <CompanyBanner
          src={company.banner}
          name={companyName}
          brandColor={brandColor}
          height={190}
          borderRadius={0}
          fallbackSrc="/job_card_banner.jpg"
        />

        <div style={{ padding: '1.75rem', position: 'relative' }}>
          {/* Company Identity Header with Overlapping Logo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1.25rem',
              marginTop: '-44px',
              marginBottom: '1.5rem',
              position: 'relative',
              zIndex: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.15rem', flexWrap: 'wrap' }}>
              <CompanyLogo
                src={company.logo}
                name={companyName}
                brandColor={brandColor}
                fallbackSrc="/company_bird_logo.png"
                size={74}
                borderRadius={14}
                style={{
                  border: '3px solid #ffffff',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#ffffff',
                }}
              />
              <div style={{ paddingBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {companyName}
                  </h3>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.85rem',
                        color: brandColor,
                        fontWeight: 600,
                      }}
                    >
                      <Globe size={13} /> Website <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                  <MapPin size={13} style={{ color: brandColor }} /> {company.location || 'Remote'}
                  {job.recruiter?.position && (
                    <span>• Posted by {job.recruiter.position}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '44px' }}>
              <StatusBadge status={job.status} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: brandColor, fontWeight: 700, letterSpacing: '0.5px' }}>
              {job.category_display || job.category}
            </span>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{job.title}</h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', padding: '1.25rem', backgroundColor: '#F5F8FC', borderRadius: 'var(--border-radius)', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> Location</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{job.location}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Briefcase size={14} /> Job Type</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{job.job_type_display}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><IndianRupee size={14} /> Salary Range (INR)</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {(job.salary_min !== null && job.salary_min !== undefined) || (job.salary_max !== null && job.salary_max !== undefined)
                  ? formatSalaryRange(job.salary_min, job.salary_max)
                  : (job.salary_display ? job.salary_display.replace(/\$/g, '₹') : 'Not specified')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> Experience</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{job.experience_level_display}</div>
            </div>
          </div>

          {/* Action Button */}
          <div style={{ marginBottom: '2rem' }}>
            {hasApplied ? (
              <div className="badge badge-hired" style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}>
                <CheckCircle2 size={18} style={{ marginRight: '0.5rem' }} /> Application Submitted
              </div>
            ) : job.status !== 'active' ? (
              <div className="badge badge-closed" style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}>
                Position Closed
              </div>
            ) : isAuthenticated ? (
              isCandidate ? (
                <button onClick={() => setIsApplyModalOpen(true)} className="btn btn-primary btn-lg">
                  Apply for this Position
                </button>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  You are logged in as a {user?.role}. Only Candidates can submit job applications.
                </p>
              )
            ) : (
              <Link to="/login" className="btn btn-primary btn-lg">
                Log in to Apply
              </Link>
            )}
          </div>

          {/* Job Description */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>Job Description</h2>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {job.description}
            </div>
          </div>

          {/* Skills Required */}
          {job.skills_required && job.skills_required.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem' }}>Required Skills</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {job.skills_required.map((skill, index) => (
                  <span key={index} style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)', border: '1px solid #8CCBFF', padding: '0.4rem 0.85rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About Company Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} style={{ color: brandColor }} /> About {companyName}
            </h2>
            {company.description ? (
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                {company.description}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {companyName} is hiring for this position on HirePulse.
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {(company.location || job.location) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={16} style={{ color: brandColor }} />
                  <span><strong>HQ / Location:</strong> {company.location || job.location}</span>
                </div>
              )}
              {company.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe size={16} style={{ color: brandColor }} />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: brandColor, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {company.website} <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title={`Apply for ${job.title}`}>
        <form onSubmit={handleApplySubmit}>
          <div className="form-group">
            <label className="form-label">Cover Letter (Optional)</label>
            <textarea
              className="form-control"
              placeholder="Introduce yourself and explain why you're a great fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Custom Resume (PDF only - Max 5MB)</label>
            <div style={{ border: '2px dashed var(--border-color)', padding: '1.5rem', textAlign: 'center', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-surface)' }}>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleResumeChange}
                style={{ display: 'none' }}
                id="resume-modal-input"
              />
              <label htmlFor="resume-modal-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={24} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: resumeFile ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {resumeFile ? `Selected: ${resumeFile.name}` : 'Click to select or upload a custom PDF resume'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  If left blank, your candidate profile resume will be used.
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsApplyModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={applying}>
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
