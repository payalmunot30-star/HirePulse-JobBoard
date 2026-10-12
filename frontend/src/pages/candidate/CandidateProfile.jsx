import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidate.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  FileText,
  Upload,
  Save,
  Plus,
  Trash2,
  Edit3,
  X,
  ExternalLink,
  Briefcase,
  Mail,
  CheckCircle,
  Download,
  Camera,
} from 'lucide-react';
import {
  formatResumeUrl,
  viewResume,
  downloadResume,
  validatePdfFile,
} from '../../utils/resume';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

export const CandidateProfile = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState(null); // 'VIEW' | 'EDIT'
  const [pageLoading, setPageLoading] = useState(true);
  const [savedProfile, setSavedProfile] = useState(null);

  const [formData, setFormData] = useState({
    phone: '',
    bio: '',
    location: '',
    linkedin_url: '',
    portfolio_url: '',
    skills_input: '',
  });

  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [existingResumeUrl, setExistingResumeUrl] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const hasProfileData = (p) => {
    if (!p) return false;
    const hasPhone = Boolean(p.phone && String(p.phone).trim());
    const hasBio = Boolean(p.bio && String(p.bio).trim());
    const hasLocation = Boolean(p.location && String(p.location).trim());
    const hasLinkedin = Boolean(p.linkedin_url && String(p.linkedin_url).trim());
    const hasPortfolio = Boolean(p.portfolio_url && String(p.portfolio_url).trim());
    const hasSkills = Boolean(Array.isArray(p.skills) && p.skills.length > 0);
    const hasEducation = Boolean(Array.isArray(p.education) && p.education.length > 0);
    const hasExperience = Boolean(Array.isArray(p.experience) && p.experience.length > 0);
    const hasResume = Boolean(p.resume || p.resume_url);
    const hasProfilePicture = Boolean(p.profile_picture || p.profile_picture_url);

    return (
      hasPhone ||
      hasBio ||
      hasLocation ||
      hasLinkedin ||
      hasPortfolio ||
      hasSkills ||
      hasEducation ||
      hasExperience ||
      hasResume ||
      hasProfilePicture
    );
  };

  const populateFormData = (p) => {
    if (!p) return;
    const rawPhone = p.phone || '';
    const cleanPhone = rawPhone
      .replace(/^\+91[\s-]?/, '')
      .replace(/^91[\s-]?/, '')
      .replace(/\D/g, '')
      .slice(0, 10);

    setFormData({
      phone: cleanPhone,
      bio: p.bio || '',
      location: p.location || '',
      linkedin_url: p.linkedin_url || '',
      portfolio_url: p.portfolio_url || '',
      skills_input: '',
    });
    setSkills(Array.isArray(p.skills) ? [...p.skills] : []);
    setEducation(Array.isArray(p.education) ? [...p.education] : []);
    setExperience(Array.isArray(p.experience) ? [...p.experience] : []);
    setExistingResumeUrl(p.resume_url || p.resume || '');
    setResumeFile(null);
    setProfilePictureFile(null);
    setProfilePicturePreview(p.profile_picture_url || p.profile_picture || null);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setPageLoading(true);
        const p = await candidateService.getCandidateProfile();
        if (!isMounted) return;

        if (hasProfileData(p)) {
          setSavedProfile(p);
          populateFormData(p);
          setMode('VIEW');
        } else {
          setSavedProfile(null);
          populateFormData(p || {});
          setMode('EDIT');
        }
      } catch (err) {
        console.error('Failed to load candidate profile:', err);
        const fallback = user?.profile || user?.candidate_profile;
        if (hasProfileData(fallback)) {
          setSavedProfile(fallback);
          populateFormData(fallback);
          setMode('VIEW');
        } else {
          setSavedProfile(null);
          setMode('EDIT');
        }
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEditClick = () => {
    if (savedProfile) {
      populateFormData(savedProfile);
    }
    setMode('EDIT');
  };

  const handleCancel = () => {
    if (savedProfile) {
      populateFormData(savedProfile);
      setMode('VIEW');
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = formData.skills_input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setFormData({ ...formData, skills_input: '' });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddEducation = () => {
    setEducation([...education, { degree: '', institution: '', year: '' }]);
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleAddExperience = () => {
    setExperience([...experience, { title: '', company: '', duration: '', description: '' }]);
  };

  const handleExperienceChange = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleResumeFileChange = (e) => {
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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPEG, PNG, WEBP).', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile picture must be under 5MB.', 'error');
      e.target.value = '';
      return;
    }

    setProfilePictureFile(file);
    const previewUrl = URL.createObjectURL(file);
    setProfilePicturePreview(previewUrl);
    showToast(`Photo selected: ${file.name}`, 'info');
  };

  const handleRemoveSelectedPicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(savedProfile?.profile_picture_url || savedProfile?.profile_picture || null);
  };

  const handleQuickPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPEG, PNG, WEBP).', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile picture must be under 5MB.', 'error');
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
      const payload = new FormData();
      payload.append('profile_picture', file);
      const updated = await candidateService.updateCandidateProfile(payload);
      showToast('Profile picture uploaded successfully!', 'success');
      setSavedProfile(updated);
      populateFormData(updated);
      await refreshUser();
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      const msg =
        err.response?.data?.profile_picture?.[0] ||
        err.response?.data?.detail ||
        'Failed to upload profile picture.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedPhone = formData.phone.trim();
    let formattedPhone = '';
    if (trimmedPhone) {
      const digits = trimmedPhone.replace(/\D/g, '');
      if (digits.length !== 10) {
        showToast('Please enter a valid 10-digit Indian phone number.', 'error');
        return;
      }
      formattedPhone = `+91${digits}`;
    }

    // Validate education graduation years (4-digit numeric year)
    for (let i = 0; i < education.length; i++) {
      const edu = education[i];
      if (edu.year && edu.year.toString().trim()) {
        const yr = Number(edu.year);
        const curYear = new Date().getFullYear();
        if (isNaN(yr) || yr < 1970 || yr > curYear + 6) {
          showToast(`Please enter a valid 4-digit graduation year between 1970 and ${curYear + 6} for education entry #${i + 1}.`, 'error');
          return;
        }
      }
    }

    if (resumeFile) {
      const validation = validatePdfFile(resumeFile);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }
    }

    setLoading(true);

    const payload = new FormData();
    payload.append('phone', formattedPhone);
    payload.append('bio', formData.bio);
    payload.append('location', formData.location);
    payload.append('linkedin_url', formData.linkedin_url);
    payload.append('portfolio_url', formData.portfolio_url);
    payload.append('skills', JSON.stringify(skills));
    payload.append('education', JSON.stringify(education));
    payload.append('experience', JSON.stringify(experience));

    if (resumeFile) {
      payload.append('resume', resumeFile);
    }

    if (profilePictureFile) {
      payload.append('profile_picture', profilePictureFile);
    }

    try {
      await candidateService.updateCandidateProfile(payload);
      showToast('Candidate profile updated successfully!', 'success');
      await refreshUser();
      const updated = await candidateService.getCandidateProfile();
      setSavedProfile(updated);
      populateFormData(updated);
      setMode('VIEW');
    } catch (err) {
      const msg =
        err.response?.data?.profile_picture?.[0] ||
        err.response?.data?.resume?.[0] ||
        err.response?.data?.phone?.[0] ||
        err.response?.data?.detail ||
        'Failed to update profile.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading || mode === null) {
    return (
      <div style={{ maxWidth: '850px', margin: '3rem auto', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
          Loading profile...
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE
  // ==========================================
  if (mode === 'VIEW') {
    const p = savedProfile || {};
    const resumeUrl = p.resume_url || p.resume;

    return (
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        {/* Header with Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Candidate Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Your active career profile visible to recruiters
          </p>
        </div>

        {/* Top Professional Candidate Profile Header per Requirement 8 */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            padding: '1.15rem 1.35rem',
            backgroundColor: '#FFFFFF',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  border: '2px solid #ffffff',
                }}
              >
                {p.profile_picture_url || p.profile_picture ? (
                  <img
                    src={p.profile_picture_url || p.profile_picture}
                    alt={user?.first_name || 'Candidate'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'P'
                )}
              </div>

              {/* Quick Upload Badge on Avatar */}
              <label
                htmlFor="candidate-quick-avatar-upload"
                title="Upload/change profile picture"
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                  border: '2px solid #ffffff',
                  transition: 'all 0.15s ease',
                }}
              >
                <Camera size={12} />
              </label>
              <input
                id="candidate-quick-avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleQuickPhotoUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--heading-color)' }}>
                  {user?.first_name || user?.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : (user?.name || user?.email?.split('@')[0] || 'Candidate')}
                </h2>
                <span className="badge badge-active">Candidate</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  marginTop: '0.35rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={14} color="var(--primary)" /> {user?.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} color="var(--primary)" /> {p.location || 'Location not specified'}
                </span>
                {p.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={14} color="var(--primary)" /> {p.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleEditClick}
            id="edit-candidate-profile-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>

        {/* Basic Information Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Basic Information
          </h3>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} /> Phone Number
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: p.phone ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 500,
                  padding: '0.5rem 0',
                }}
              >
                {p.phone || 'Not provided'}
              </div>
            </div>

            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} /> Location
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: p.location ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 500,
                  padding: '0.5rem 0',
                }}
              >
                {p.location || 'Not provided'}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Linkedin size={14} /> LinkedIn URL
              </span>
              <div style={{ fontSize: '0.95rem', padding: '0.5rem 0' }}>
                {p.linkedin_url ? (
                  <a
                    href={p.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      wordBreak: 'break-all',
                    }}
                  >
                    {p.linkedin_url} <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                )}
              </div>
            </div>

            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={14} /> Portfolio Website
              </span>
              <div style={{ fontSize: '0.95rem', padding: '0.5rem 0' }}>
                {p.portfolio_url ? (
                  <a
                    href={p.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      wordBreak: 'break-all',
                    }}
                  >
                    {p.portfolio_url} <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <span className="form-label">Professional Summary / Bio</span>
            <div
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: p.bio ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.85rem 1rem',
                minHeight: '60px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {p.bio || 'No professional summary provided.'}
            </div>
          </div>
        </div>

        {/* Resume Document Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Resume Document
          </h3>

          {resumeUrl ? (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText color="var(--primary)" size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    Active Candidate Resume (PDF)
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Verified PDF document submitted for job opportunities
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => viewResume(resumeUrl)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ExternalLink size={14} /> View Resume
                </button>
                <button
                  type="button"
                  onClick={() => downloadResume(resumeUrl, `${user?.first_name || 'Candidate'}_Resume.pdf`)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '1.75rem 1.25rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px dashed var(--border-color)',
              }}
            >
              <FileText size={30} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No resume document uploaded yet.
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Switch to Edit mode to upload your PDF resume.
              </div>
            </div>
          )}
        </div>

        {/* Technical Skills Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Technical Skills
          </h3>

          {Array.isArray(p.skills) && p.skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {p.skills.map((skill, index) => (
                <span
                  key={index}
                  className="skill-tag"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No technical skills listed yet.
            </div>
          )}
        </div>

        {/* Work Experience Card */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Work Experience
          </h3>

          {Array.isArray(p.experience) && p.experience.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {p.experience.map((exp, idx) => {
                const isFresher = (exp.company && exp.company.toLowerCase() === 'fresher') ||
                  (exp.duration && exp.duration.toLowerCase() === 'fresher');
                const formattedPrefTypes = exp.description && exp.description.includes('Preferred job types:')
                  ? exp.description.replace(/Preferred job types:\s*/i, '').split(',').map((t) => t.trim()).join(' · ')
                  : null;

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatTitle(exp.title || 'Untitled Role')}
                      </div>
                      {(exp.duration || isFresher) && (
                        <span className="experience-badge">
                          {formatTitle(exp.duration || 'Fresher')}
                        </span>
                      )}
                    </div>

                    {!isFresher && exp.company && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          marginBottom: '0.35rem',
                        }}
                      >
                        <Briefcase size={14} color="var(--primary)" />
                        {formatCompanyName(exp.company)}
                      </div>
                    )}

                    {formattedPrefTypes ? (
                      <div style={{ marginTop: '0.45rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--heading-color)' }}>Preferred job types:</span>{' '}
                        <span>{formattedPrefTypes}</span>
                      </div>
                    ) : exp.description ? (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {exp.description}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No work experience listed yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // EDIT MODE
  // ==========================================
  const isEditingExisting = Boolean(savedProfile && hasProfileData(savedProfile));

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {isEditingExisting ? 'Edit Candidate Profile' : 'Manage Candidate Profile'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Keep your resume and career history up to date for recruiters
          </p>
        </div>
        {isEditingExisting && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            <X size={18} /> Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Details */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Basic Information
          </h3>

          {/* Profile Picture Upload Section in Edit Mode */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar Preview */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.85rem',
                fontWeight: 700,
                overflow: 'hidden',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
                border: '3px solid #ffffff',
                flexShrink: 0,
              }}
            >
              {profilePicturePreview ? (
                <img
                  src={profilePicturePreview}
                  alt="Profile Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'P'
              )}
            </div>

            {/* Upload controls & instructions */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--heading-color)', marginBottom: '0.2rem' }}>
                Candidate Profile Picture
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                Upload a professional headshot or photo (JPG, PNG, WEBP, max 5MB). Recruiters see this on your profile and applications.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <label
                  htmlFor="candidate-profile-picture-input"
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <Camera size={15} />
                  <span>{profilePicturePreview ? 'Change Photo' : 'Upload Photo'}</span>
                </label>
                <input
                  id="candidate-profile-picture-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />

                {profilePictureFile && (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedPicture}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#dc2626',
                    }}
                  >
                    <X size={14} /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.7rem 0.85rem',
                    backgroundColor: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-color)',
                    borderRight: 'none',
                    borderRadius: 'var(--border-radius-sm) 0 0 var(--border-radius-sm)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  +91 <span style={{ color: 'var(--border-color)', margin: '0 0.4rem' }}>|</span>
                </div>
                <input
                  type="tel"
                  className="form-control"
                  style={{ borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0' }}
                  placeholder="98765 43210"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: val });
                  }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="City, Country"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Portfolio Website</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://yourportfolio.com"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Professional Summary / Bio</label>
            <textarea
              className="form-control"
              placeholder="Brief summary of your expertise and background..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        {/* Resume Upload */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Resume Document
          </h3>

          {existingResumeUrl && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText color="var(--primary)" size={20} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Current Resume on File (PDF)</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => viewResume(existingResumeUrl)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ExternalLink size={13} /> View
                </button>
                <button
                  type="button"
                  onClick={() => downloadResume(existingResumeUrl, `${user?.first_name || 'Candidate'}_Resume.pdf`)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Upload / Replace Resume (PDF only, Max 5MB)</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleResumeFileChange}
              className="form-control"
            />
            {resumeFile && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={14} /> Selected PDF: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>
        </div>

        {/* Skills Tagging */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Technical Skills
          </h3>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Python, React, PostgreSQL..."
              value={formData.skills_input}
              onChange={(e) => setFormData({ ...formData, skills_input: e.target.value })}
            />
            <button onClick={handleAddSkill} className="btn btn-secondary" type="button">
              <Plus size={16} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {skills.map((skill, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Work Experience</h3>
            <button
              type="button"
              onClick={handleAddExperience}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={16} /> Add Position
            </button>
          </div>

          {experience.map((exp, idx) => (
            <div
              key={idx}
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--border-radius-sm)',
                marginBottom: '1rem',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Job Title (e.g. Software Engineer)"
                  className="form-control"
                  value={exp.title}
                  onChange={(e) => handleExperienceChange(idx, 'title', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="form-control"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Duration (e.g. 2021 - Present)"
                  className="form-control"
                  value={exp.duration}
                  onChange={(e) => handleExperienceChange(idx, 'duration', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Education History */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Education History</h3>
            <button
              type="button"
              onClick={handleAddEducation}
              className="btn btn-secondary btn-sm"
              id="add-education-btn"
            >
              <Plus size={16} /> Add Degree / School
            </button>
          </div>

          {education.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: 0 }}>
              No education entries added yet. Click &quot;Add Degree / School&quot; to list your educational qualifications.
            </p>
          ) : (
            education.map((edu, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--border-radius-sm)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    placeholder="Degree / Qualification (e.g. B.Tech Computer Science)"
                    className="form-control"
                    value={edu.degree || ''}
                    onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Institution / University (e.g. Pune University)"
                    className="form-control"
                    value={edu.institution || ''}
                    onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Graduation Year (e.g. 2024)"
                    className="form-control"
                    min="1970"
                    max={new Date().getFullYear() + 6}
                    value={edu.year || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      handleEducationChange(idx, 'year', val);
                    }}
                    style={{ maxWidth: '240px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    className="btn btn-danger btn-sm"
                    title="Remove entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        {isEditingExisting ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
              disabled={loading}
              id="save-candidate-profile-btn"
            >
              <Save size={18} /> {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={handleCancel}
              disabled={loading}
              id="cancel-candidate-profile-btn"
            >
              <X size={18} /> Cancel
            </button>
          </div>
        ) : (
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
            id="save-candidate-profile-btn"
          >
            <Save size={18} /> {loading ? 'Saving Profile...' : 'Save Profile'}
          </button>
        )}
      </form>
    </div>
  );
};
