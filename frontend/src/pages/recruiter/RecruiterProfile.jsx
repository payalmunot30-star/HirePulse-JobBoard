import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidate.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Building,
  Globe,
  MapPin,
  Phone,
  Save,
  Briefcase,
  Edit3,
  X,
  ExternalLink,
  Mail,
  User,
  Upload,
  Image,
  Palette,
  Check,
  Sparkles,
} from 'lucide-react';
import { CompanyBanner, CompanyLogo } from '../../components/common/CompanyBranding';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

const THEME_PRESETS = [
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'HirePulse Blue', hex: '#2167D5' },
  { name: 'Indigo Pulse', hex: '#4f46e5' },
  { name: 'Purple Violet', hex: '#7c3aed' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Dark Slate', hex: '#334155' },
];

export const RecruiterProfile = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState(null); // 'VIEW' | 'EDIT'
  const [pageLoading, setPageLoading] = useState(true);
  const [savedProfile, setSavedProfile] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
    phone: '',
    position: '',
    brand_color: '#2167D5',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  const hasProfileData = (p) => {
    if (!p) return false;
    return Boolean(
      (p.company_name && String(p.company_name).trim()) ||
      (p.position && String(p.position).trim()) ||
      (p.company_website && String(p.company_website).trim()) ||
      (p.company_location && String(p.company_location).trim()) ||
      (p.phone && String(p.phone).trim()) ||
      (p.company_description && String(p.company_description).trim()) ||
      p.logo_url ||
      p.company_logo ||
      p.banner_url ||
      p.company_banner
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
      company_name: p.company_name || '',
      company_description: p.company_description || '',
      company_website: p.company_website || '',
      company_location: p.company_location || '',
      phone: cleanPhone,
      position: p.position || '',
      brand_color: p.brand_color || '#2167D5',
    });

    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview(p.logo_url || p.company_logo || null);
    setBannerPreview(p.banner_url || p.company_banner || null);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setPageLoading(true);
        const p = await candidateService.getRecruiterProfile();
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
        console.error('Failed to load recruiter profile:', err);
        const fallback = user?.profile || user?.recruiter_profile;
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Logo file size must be under 5MB.', 'error');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('Banner file size must be under 8MB.', 'error');
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
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

    setLoading(true);

    try {
      const data = new FormData();
      data.append('company_name', formData.company_name);
      data.append('company_description', formData.company_description || '');
      data.append('company_website', formData.company_website || '');
      data.append('company_location', formData.company_location || '');
      data.append('position', formData.position || '');
      data.append('brand_color', formData.brand_color || '');
      if (formattedPhone) {
        data.append('phone', formattedPhone);
      }
      if (logoFile) {
        data.append('company_logo', logoFile);
      }
      if (bannerFile) {
        data.append('company_banner', bannerFile);
      }

      const updated = await candidateService.updateRecruiterProfile(data);
      showToast('Company branding and profile updated successfully!', 'success');
      await refreshUser();
      setSavedProfile(updated);
      populateFormData(updated);
      setMode('VIEW');
    } catch (err) {
      const msg =
        err.response?.data?.phone?.[0] ||
        err.response?.data?.detail ||
        'Failed to update recruiter profile.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading || mode === null) {
    return (
      <div style={{ maxWidth: '840px', margin: '3rem auto', textAlign: 'center' }}>
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
    const effectiveBrandColor = p.brand_color || '#2167D5';

    return (
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Header with Title and Primary Edit Profile Button */}
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
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Recruiter & Company Profile</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your company branding is automatically inherited by all jobs you post
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleEditClick}
            id="edit-recruiter-profile-btn"
          >
            <Edit3 size={18} /> Edit Profile & Branding
          </button>
        </div>

        {/* Corporate Branding Showcase Card */}
        <div
          className="card"
          style={{
            marginBottom: '1.75rem',
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Company Banner */}
          <CompanyBanner
            src={p.banner_url || p.company_banner}
            name={p.company_name || 'Hiring Company'}
            brandColor={effectiveBrandColor}
            height={160}
            borderRadius={0}
          />

          {/* Company Logo & Basic Meta Overlap */}
          <div
            style={{
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              marginTop: '-42px',
              position: 'relative',
              flexWrap: 'wrap',
            }}
          >
            {/* Logo with clean white backing */}
            <CompanyLogo
              src={p.logo_url || p.company_logo}
              name={p.company_name || 'Company'}
              brandColor={effectiveBrandColor}
              size={76}
              borderRadius={16}
              style={{
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                border: '3px solid var(--bg-card)',
              }}
            />

            <div style={{ flex: 1, minWidth: '220px', marginTop: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  {p.company_name ? formatCompanyName(p.company_name) : 'Your Company Name'}
                </h2>
                <span
                  style={{
                    backgroundColor: `${effectiveBrandColor}18`,
                    color: effectiveBrandColor,
                    border: `1px solid ${effectiveBrandColor}44`,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Sparkles size={12} /> Company Brand
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  marginTop: '0.4rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  flexWrap: 'wrap',
                }}
              >
                {p.position && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Briefcase size={15} style={{ color: effectiveBrandColor }} /> {formatTitle(p.position)}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={15} style={{ color: effectiveBrandColor }} /> {user?.first_name ? formatTitle(`${user.first_name} ${user.last_name || ''}`) : (user?.name || 'Recruiter')}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={15} style={{ color: effectiveBrandColor }} /> {user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Details Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Company Information & Branding
          </h3>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building size={14} /> Company Name
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: p.company_name ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 600,
                  padding: '0.5rem 0',
                }}
              >
                {p.company_name ? formatCompanyName(p.company_name) : 'Not provided'}
              </div>
            </div>

            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Palette size={14} /> Brand Theme Accent
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0' }}>
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    backgroundColor: effectiveBrandColor,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {effectiveBrandColor}
                </span>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={14} /> Company Website
              </span>
              <div style={{ fontSize: '0.95rem', padding: '0.5rem 0' }}>
                {p.company_website ? (
                  <a
                    href={p.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600,
                      wordBreak: 'break-all',
                      color: effectiveBrandColor,
                    }}
                  >
                    {p.company_website} <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Not provided</span>
                )}
              </div>
            </div>

            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} /> Company Location / HQ
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: p.company_location ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 500,
                  padding: '0.5rem 0',
                }}
              >
                {p.company_location ? formatTitle(p.company_location) : 'Not provided'}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Briefcase size={14} /> Recruiter Position / Title
              </span>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: p.position ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: 500,
                  padding: '0.5rem 0',
                }}
              >
                {p.position ? formatTitle(p.position) : 'Not provided'}
              </div>
            </div>

            <div>
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} /> Contact Phone
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
          </div>

          <div>
            <span className="form-label">Company Overview / Tagline</span>
            <div
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: p.company_description ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.85rem 1rem',
                minHeight: '70px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {p.company_description || 'No company overview provided.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EDIT MODE
  // ==========================================
  const isEditingExisting = Boolean(savedProfile && hasProfileData(savedProfile));

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
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
            {isEditingExisting ? 'Edit Company Profile & Branding' : 'Set Up Recruiter & Company Profile'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            This branding will automatically be applied to all your job postings
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

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* --- Section 1: Visual Identity & Assets --- */}
          <div style={{ marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Visual Identity & Assets
            </h3>

            {/* Banner Upload */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Image size={15} /> Company Banner / Header Image
              </label>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Displayed at the top of candidate job cards and your job details page (recommended 600x200 or 16:9).
              </p>

              {bannerPreview && (
                <div style={{ marginBottom: '0.75rem', borderRadius: '10px', overflow: 'hidden', height: '110px', border: '1px solid var(--border-color)' }}>
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <input
                type="file"
                id="company-banner-input"
                accept="image/*"
                onChange={handleBannerChange}
                className="form-control"
              />
            </div>

            {/* Logo Upload */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building size={15} /> Company Logo
              </label>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Clean square or landscape logo. If left blank, your company initials will be displayed automatically.
              </p>

              {logoPreview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: '4px',
                    }}
                  >
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Logo preview
                  </span>
                </div>
              )}

              <input
                type="file"
                id="company-logo-input"
                accept="image/*"
                onChange={handleLogoChange}
                className="form-control"
              />
            </div>

            {/* Brand Theme Color */}
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Palette size={15} /> Company Brand Color
              </label>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Used for company fallback initials, highlight accents, and branding consistency across your job cards.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {THEME_PRESETS.map((preset) => {
                  const isSelected = formData.brand_color?.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, brand_color: preset.hex })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        border: isSelected
                          ? `2px solid ${preset.hex}`
                          : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? `${preset.hex}18` : 'var(--bg-surface)',
                        color: isSelected ? preset.hex : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 700 : 500,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: preset.hex,
                          display: 'inline-block',
                        }}
                      />
                      {preset.name}
                      {isSelected && <Check size={13} />}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="color"
                  value={formData.brand_color || '#2167D5'}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                  style={{
                    width: '42px',
                    height: '38px',
                    padding: '2px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                  }}
                  title="Pick custom color"
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '140px', fontFamily: 'monospace' }}
                  placeholder="#2167D5"
                  value={formData.brand_color}
                  onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* --- Section 2: Company Information --- */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Company Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. ABC Technologies"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Recruiter Position / Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Senior Talent Acquisition Manager"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Company Website</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://abctechnologies.com"
                value={formData.company_website}
                onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Location / HQ</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Pune, Maharashtra"
                value={formData.company_location}
                onChange={(e) => setFormData({ ...formData, company_location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
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

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Company Description / Tagline</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Tell candidates about your company culture, mission, and benefits..."
              value={formData.company_description}
              onChange={(e) =>
                setFormData({ ...formData, company_description: e.target.value })
              }
            />
          </div>

          {/* Action Buttons */}
          {isEditingExisting ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
                disabled={loading}
                id="save-recruiter-profile-btn"
              >
                <Save size={18} /> {loading ? 'Saving Changes...' : 'Save Branding & Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={handleCancel}
                disabled={loading}
                id="cancel-recruiter-profile-btn"
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
              id="save-recruiter-profile-btn"
            >
              <Save size={18} /> {loading ? 'Saving Profile...' : 'Save Company Profile'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
