import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Bookmark,
  ThumbsDown,
  Zap,
  Users,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { CompanyLogo } from '../common/CompanyBranding';
import { formatSalaryRange } from '../../utils/currency';
import { formatTitle, formatCompanyName, normalizeMediaUrl } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import './JobCard.css';

export const JobCard = ({ job }) => {
  const { showToast } = useToast();

  const rawLogo =
    job?.company?.logo ||
    job?.recruiter_logo ||
    job?.recruiter?.logo_url ||
    job?.recruiter?.company_logo ||
    null;

  const rawBanner =
    job?.company?.banner ||
    job?.recruiter?.banner_url ||
    job?.recruiter?.company_banner ||
    null;

  // Extract company information with fallback support
  const company = {
    name: formatCompanyName(job?.company?.name || job?.company_name || job?.recruiter_name || 'Hiring Company'),
    logo: normalizeMediaUrl(rawLogo),
    banner: normalizeMediaUrl(rawBanner),
    location: job?.location || job?.company?.location || '',
    website: job?.company?.website || '',
    description: job?.company?.description || '',
    brand_color: job?.company?.brand_color || '',
  };

  const companyName = company.name || 'Hiring Company';
  const brandColor =
    company.brand_color ||
    (companyName.toLowerCase().includes('abc')
      ? '#10b981'
      : companyName.toLowerCase().includes('xyz')
      ? '#2563eb'
      : '#3b82f6');

  // Interactive states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [bannerLoadFailed, setBannerLoadFailed] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [birdLogoFailed, setBirdLogoFailed] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hirepulse_saved_jobs') || '[]');
      setIsBookmarked(saved.includes(job.id));
    } catch {
      setIsBookmarked(false);
    }
  }, [job.id]);

  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const saved = JSON.parse(localStorage.getItem('hirepulse_saved_jobs') || '[]');
      let updated;
      if (saved.includes(job.id)) {
        updated = saved.filter((id) => id !== job.id);
        setIsBookmarked(false);
        if (showToast) showToast('Job removed from bookmarks.', 'info');
      } else {
        updated = [...saved, job.id];
        setIsBookmarked(true);
        if (showToast) showToast('Job saved to your bookmarks!', 'success');
      }
      localStorage.setItem('hirepulse_saved_jobs', JSON.stringify(updated));
    } catch {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleDislikeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isDisliked;
    setIsDisliked(next);
    if (showToast) {
      if (next) {
        showToast('Job hidden from your feed.', 'info');
      } else {
        showToast('Job restored.', 'info');
      }
    }
  };

  // Salary formatting
  const salaryText =
    (job.salary_min !== null && job.salary_min !== undefined) ||
    (job.salary_max !== null && job.salary_max !== undefined)
      ? formatSalaryRange(job.salary_min, job.salary_max)
      : job.salary_display
      ? job.salary_display.replace(/\$/g, '₹')
      : null;

  // Applicant count calculation
  const applicantCount = Number(job.application_count) || 0;
  const hiresText =
    applicantCount > 0
      ? `${applicantCount} applicant${applicantCount > 1 ? 's' : ''} in past 30 days`
      : '1 applicant in past 30 days';

  if (isDisliked) {
    return (
      <div className="hp-job-card hp-job-card-disliked">
        <div className="hp-job-card-hidden-overlay">
          <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Job hidden: <strong>{job.title}</strong>
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDislikeToggle}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={14} /> Undo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hp-job-card" id={`job-card-${job.id}`}>
      {/* 1. Full-Width Company Banner with Overlapping Logo */}
      <div className="hp-banner-container">
        <div className="hp-banner-media-wrapper">
          {company.banner && !bannerLoadFailed ? (
            <img
              src={company.banner}
              alt={`${companyName} Banner`}
              className="hp-banner-img"
              onError={() => setBannerLoadFailed(true)}
            />
          ) : (
            <div className="hp-default-banner">
              <img
                src="/job_card_banner.jpg"
                alt="Workspace Banner"
                className="hp-banner-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="hp-banner-overlay-typography">
                <span className="hp-banner-script">Aspire. Learn. Grow.</span>
                <span className="hp-banner-subtext">BUILDING A BRIGHTER TOMORROW</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Company Logo overlapping the bottom-right corner of the banner */}
        <div className="hp-logo-container">
          {company.logo && !logoLoadFailed ? (
            <img
              src={company.logo}
              alt={companyName}
              className="hp-logo-img"
              onError={() => setLogoLoadFailed(true)}
            />
          ) : !birdLogoFailed ? (
            <img
              src="/company_bird_logo.png"
              alt={companyName}
              className="hp-logo-img"
              onError={() => setBirdLogoFailed(true)}
            />
          ) : (
            <CompanyLogo
              src={null}
              name={companyName}
              brandColor={brandColor}
              size={56}
              borderRadius={8}
            />
          )}
        </div>
      </div>

      {/* 2. Job Content Area */}
      <div className="hp-card-content">
        {/* Top: 'Multiple openings' badge on left */}
        <div className="hp-top-badge-row">
          <span className="hp-badge-openings">
            Multiple openings
          </span>
        </div>

        {/* Main Info Row: Left (Title, Company, Location) vs Right (Bookmark & Dislike) */}
        <div className="hp-main-info-row">
          <div className="hp-job-details">
            <Link to={`/jobs/${job.id}`} className="hp-job-title">
              {formatTitle(job.title)}
            </Link>
            <div className="hp-company-name">
              {formatCompanyName(companyName)}
            </div>
            <div className="hp-location">
              <MapPin size={16} strokeWidth={1.8} className="hp-location-icon" />
              <span>{job.location || company.location || 'pune'}</span>
            </div>
          </div>

          <div className="hp-action-buttons">
            <button
              type="button"
              className={`hp-job-action-btn ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmarkToggle}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
              aria-label="Bookmark job"
            >
              <Bookmark
                size={22}
                strokeWidth={1.8}
                fill={isBookmarked ? 'currentColor' : 'none'}
                color={isBookmarked ? '#2563eb' : '#64748b'}
              />
            </button>
            <button
              type="button"
              className="hp-job-action-btn"
              onClick={handleDislikeToggle}
              title="Not interested"
              aria-label="Hide job"
            >
              <ThumbsDown size={22} strokeWidth={1.8} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Tags Row: Job Type, Experience Level, Salary Range */}
        <div className="hp-pills-row">
          {(job.job_type_display || job.job_type) && (
            <span className="hp-pill-tag">
              {formatTitle(job.job_type_display || job.job_type)}
            </span>
          )}

          {(job.experience_level_display || job.experience_level) && (
            <span className="hp-pill-tag">
              {job.experience_level_display || formatTitle(job.experience_level)}
            </span>
          )}

          {salaryText && (
            <span className="hp-pill-tag hp-pill-salary">
              ₹ {salaryText.replace(/^₹\s*/, '')}
            </span>
          )}
        </div>

        {/* Activity / Insights Box at bottom */}
        <div className="hp-activity-box">
          <div className="hp-activity-item">
            <Zap size={16} fill="currentColor" className="hp-activity-icon" />
            <span>Often responds in 1 day</span>
          </div>
          <div className="hp-activity-item">
            <Users size={16} strokeWidth={1.8} className="hp-activity-icon" />
            <span>{hiresText}</span>
          </div>
          <div className="hp-activity-item">
            <Clock size={16} strokeWidth={1.8} className="hp-activity-icon" />
            <span>Be an early applicant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
