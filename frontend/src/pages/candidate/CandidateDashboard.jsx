import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboard.service';
import { candidateService } from '../../services/candidate.service';
import { jobService } from '../../services/job.service';
import { StatusBadge } from '../../components/common/Badge';
import { formatSalaryRange } from '../../utils/currency';
import { formatTitle, formatCompanyName } from '../../utils/formatters';
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MapPin,
  IndianRupee,
  Building2,
  FileText,
} from 'lucide-react';

export const CandidateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: Calculate profile completion percentage (0 - 100%)
  const calculateProfileCompletion = (prof, usr) => {
    const p = prof || usr?.profile || {};
    let score = 0;

    // Basic name & user details
    if (usr?.first_name || p.user?.first_name) score += 15;
    // Phone
    if (p.phone && String(p.phone).trim()) score += 10;
    // Location
    if (p.location && String(p.location).trim()) score += 10;
    // Bio
    if (p.bio && String(p.bio).trim()) score += 10;
    // Skills
    if (Array.isArray(p.skills) && p.skills.length > 0) score += 20;
    // Experience
    if (Array.isArray(p.experience) && p.experience.length > 0) score += 15;
    // Education
    if (Array.isArray(p.education) && p.education.length > 0) score += 10;
    // Resume
    if (p.resume || p.resume_url) score += 10;

    return Math.min(100, Math.max(0, score));
  };

  // Helper: Extract resume updated date
  const getResumeDateText = (prof, usr) => {
    const p = prof || usr?.profile;
    if (!p?.resume && !p?.resume_url) return 'Not uploaded';
    if (p?.updated_at) {
      try {
        const d = new Date(p.updated_at);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch (_) { }
    }
    return 'Uploaded';
  };

  // Helper: Extract preferred job type
  const getPreferredJobType = (prof, userId) => {
    const p = prof || user?.profile;
    if (p?.bio) {
      const match = p.bio.match(/Employment Types:\s*([^|]+)/i);
      if (match && match[1]?.trim()) return match[1].trim();
    }
    if (Array.isArray(p?.experience)) {
      for (const exp of p.experience) {
        if (exp?.description) {
          const match = exp.description.match(/Preferred job types:\s*([^|]+)/i);
          if (match && match[1]?.trim()) return match[1].trim();
        }
      }
    }
    if (userId) {
      try {
        const draft = localStorage.getItem(`candidate_onboarding_draft_${userId}`);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (Array.isArray(parsed.selectedJobTypes) && parsed.selectedJobTypes.length > 0) {
            return parsed.selectedJobTypes.join(', ');
          }
        }
      } catch (_) { }
    }
    return 'Not specified';
  };

  // Helper: Extract preferred location
  const getPreferredLocation = (prof, userId) => {
    const p = prof || user?.profile;
    if (p?.location && String(p.location).trim()) {
      return p.location.trim();
    }
    if (userId) {
      try {
        const draft = localStorage.getItem(`candidate_onboarding_draft_${userId}`);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.locationCity) {
            return parsed.locationCity + (parsed.remoteInterested ? ' (Remote)' : '');
          }
          if (parsed.remoteInterested) return 'Remote';
        }
      } catch (_) { }
    }
    return 'Not specified';
  };

  // Helper: Score & rank jobs based on candidate profile info
  const getRankedRecommendedJobs = (jobsList, prof, usr) => {
    if (!Array.isArray(jobsList) || jobsList.length === 0) return [];

    const candidateSkills = Array.isArray(prof?.skills)
      ? prof.skills.map((s) => String(s).toLowerCase().trim())
      : [];

    const candidateLocation = (prof?.location || '').toLowerCase().trim();
    const prefJobType = getPreferredJobType(prof, usr?.id).toLowerCase();

    const scored = jobsList.map((job) => {
      let score = 0;

      // 1. Skill matching
      if (Array.isArray(job.skills_required) && candidateSkills.length > 0) {
        job.skills_required.forEach((skill) => {
          const s = String(skill).toLowerCase().trim();
          if (candidateSkills.some((cs) => cs === s || cs.includes(s) || s.includes(cs))) {
            score += 3;
          }
        });
      }

      // 2. Title matching
      if (job.title && candidateSkills.length > 0) {
        const titleLower = job.title.toLowerCase();
        if (candidateSkills.some((cs) => titleLower.includes(cs))) {
          score += 2;
        }
      }

      // 3. Location matching
      if (candidateLocation && job.location) {
        const jobLoc = job.location.toLowerCase();
        if (candidateLocation.includes('remote') || jobLoc.includes('remote')) {
          score += 2;
        } else if (jobLoc.includes(candidateLocation) || candidateLocation.includes(jobLoc)) {
          score += 2;
        }
      }

      // 4. Job type matching
      if (prefJobType && prefJobType !== 'not specified' && job.job_type) {
        const jt = job.job_type.toLowerCase();
        if (prefJobType.includes(jt) || jt.includes(prefJobType)) {
          score += 2;
        }
      }

      return { job, score };
    });

    // Sort by recommendation score descending, then by creation date descending
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.job.created_at || 0) - new Date(a.job.created_at || 0);
    });

    return scored.slice(0, 3).map((item) => item.job);
  };

  useEffect(() => {
    if (user?.role === 'candidate') {
      const isOnboarded = localStorage.getItem(`onboarding_completed_${user.id}`) === 'true';
      if (!isOnboarded && !user.profile?.location) {
        navigate('/candidate-onboarding');
        return;
      }
    }

    Promise.all([
      dashboardService.getCandidateDashboard().catch((err) => {
        console.error('Failed to load candidate dashboard:', err);
        return null;
      }),
      candidateService.getCandidateProfile().catch((err) => {
        console.error('Failed to load candidate profile:', err);
        return null;
      }),
      jobService.getJobs({ page_size: 20 }).catch((err) => {
        console.error('Failed to load jobs for recommendations:', err);
        return { results: [] };
      }),
    ])
      .then(([dashData, profData, jobsData]) => {
        if (dashData) setData(dashData);

        const resolvedProfile = profData || user?.profile || null;
        setProfile(resolvedProfile);

        const allJobs = jobsData?.results || (Array.isArray(jobsData) ? jobsData : []);
        const rec = getRankedRecommendedJobs(allJobs, resolvedProfile, user);
        setRecommendedJobs(rec);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading dashboard...
      </div>
    );
  }

  if (!data) return null;

  const { overview, recent_applications } = data;

  // 1. Personalized Welcome Info
  const candidateName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`.trim()
    : (user?.name || user?.email?.split('@')[0] || 'Candidate');

  const completionPercentage = calculateProfileCompletion(profile, user);
  const resumeUpdatedText = getResumeDateText(profile, user);
  const preferredJobType = getPreferredJobType(profile, user?.id);
  const preferredLocation = getPreferredLocation(profile, user?.id);

  // 2. Application Overview Counts (Total, Active, Closed)
  const totalApplications = overview?.total_applied ?? 0;
  const closedApplications = (overview?.rejected ?? 0) + (overview?.hired ?? 0);
  const activeApplications = Math.max(0, totalApplications - closedApplications);

  // Helper for job salary formatting
  const formatJobSalary = (job) => {
    if (
      (job.salary_min !== null && job.salary_min !== undefined) ||
      (job.salary_max !== null && job.salary_max !== undefined)
    ) {
      return formatSalaryRange(job.salary_min, job.salary_max);
    }
    if (job.salary_display) {
      return job.salary_display.replace(/\$/g, '₹');
    }
    return null;
  };

  return (
    <div>
      {/* 1. Welcome Section */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.25rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--heading-color)' }}>
          Welcome back, {candidateName}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.45 }}>
          Track your applications, manage your profile, and discover opportunities that match your skills.
        </p>

        {/* Small profile information bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.25rem',
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
            <span>
              Profile Completion: <strong style={{ color: 'var(--text-primary)' }}>{completionPercentage}%</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <FileText size={16} style={{ color: 'var(--primary)' }} />
            <span>
              Resume: <strong style={{ color: 'var(--text-primary)' }}>{resumeUpdatedText}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <Briefcase size={16} style={{ color: 'var(--primary)' }} />
            <span>
              Preferred Job Type: <strong style={{ color: 'var(--text-primary)' }}>{preferredJobType}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
            <span>
              Preferred Location: <strong style={{ color: 'var(--text-primary)' }}>{preferredLocation}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Profile Completion Section (Hidden when 100% completed) */}
      {completionPercentage < 100 && (
        <div className="card" style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Complete your profile
            </h3>
            <Link to="/candidate/profile" className="btn btn-primary btn-sm">
              Complete Profile
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                flex: 1,
                height: '10px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                minWidth: '45px',
                textAlign: 'right',
                color: 'var(--text-primary)',
              }}
            >
              {completionPercentage}%
            </span>
          </div>
        </div>
      )}

      {/* 3. Application Overview (Total, Active, Closed) */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <div className="stat-value">{totalApplications}</div>
            <div className="stat-label">Total Applications</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="stat-value">{activeApplications}</div>
            <div className="stat-label">Active Applications</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="stat-value">{closedApplications}</div>
            <div className="stat-label">Closed Applications</div>
          </div>
        </div>
      </div>


      {/* 4. Recommended Jobs Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Recommended for You
          </h3>
          <Link
            to="/jobs"
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recommendedJobs.length > 0 ? (
          <div className={recommendedJobs.length > 1 ? 'jobs-grid-2' : 'jobs-single-card'}>
            {recommendedJobs.map((job) => {
              const salary = formatJobSalary(job);
              const expLevel = job.experience_level_display || job.experience_level || job.experience;
              return (
                <div
                  key={job.id}
                  className="candidate-job-card"
                >
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      <Link to={`/jobs/${job.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {formatTitle(job.title)}
                      </Link>
                    </h4>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginBottom: '0.75rem',
                      }}
                    >
                      <Building2 size={15} style={{ color: 'var(--primary)' }} />
                      <span>{formatCompanyName(job.recruiter_name || job.company_name || 'HirePulse')}</span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.825rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {job.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin size={14} /> {job.location}
                        </div>
                      )}
                      {job.job_type && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Briefcase size={14} /> {job.job_type_display || job.job_type}
                        </div>
                      )}
                      {expLevel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} /> {expLevel}
                        </div>
                      )}
                      {salary && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontWeight: 600 }}>
                          <IndianRupee size={14} /> {salary}
                        </div>
                      )}
                    </div>

                    {Array.isArray(job.skills_required) && job.skills_required.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.25rem' }}>
                        {job.skills_required.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#E8F3FF',
                              border: '1px solid #D9E4F2',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              fontWeight: 500,
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills_required.length > 4 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                            +{job.skills_required.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', textAlign: 'center', display: 'block' }}
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No recommended jobs found right now. <Link to="/jobs" style={{ fontWeight: 600 }}>Explore all open positions</Link>
          </div>
        )}
      </div>

      {/* 5. Recent Applications Submissions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recent Submissions</h3>
          <Link to="/candidate/applications" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {recent_applications && recent_applications.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Position</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {recent_applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/jobs/${app.job_id}`} style={{ color: 'inherit' }}>
                        {formatTitle(app.job_title)}
                      </Link>
                    </td>
                    <td>{formatCompanyName(app.company_name)}</td>
                    <td>{app.location}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            You haven't applied to any jobs yet. <Link to="/jobs" style={{ fontWeight: 600 }}>Explore Job Postings</Link>
          </div>
        )}
      </div>
    </div>
  );
};
