import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  UserPlus,
  Mail,
  Lock,
  Building2,
  User,
  Phone,
  Globe,
  Briefcase,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate';

  const [activeRole, setActiveRole] = useState(initialRole);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    // Recruiter-specific fields
    company_name: '',
    company_website: '',
    position: '',
    company_location: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [registeredRole, setRegisteredRole] = useState('candidate');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'recruiter' || roleParam === 'candidate') {
      setActiveRole(roleParam);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole) => {
    setActiveRole(newRole);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    // Only numbers up to 10 digits
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: cleaned }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required.';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters.';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (formData.phone) {
      if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit Indian mobile number (starts with 6-9).';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match.';
    }

    // Role-specific validation
    if (activeRole === 'recruiter') {
      if (!formData.company_name.trim()) {
        newErrors.company_name = 'Company or organization name is required.';
      } else if (formData.company_name.trim().length < 2) {
        newErrors.company_name = 'Company name must be at least 2 characters.';
      }

      if (formData.company_website.trim()) {
        if (!/^https?:\/\/.+\..+/.test(formData.company_website.trim())) {
          newErrors.company_website = 'Please enter a valid URL starting with http:// or https://';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    setLoading(true);

    const payload = {
      email: formData.email.trim().toLowerCase(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      password: formData.password,
      password_confirm: formData.password_confirm,
      role: activeRole,
      phone: formData.phone.trim(),
    };

    if (activeRole === 'recruiter') {
      payload.company_name = formData.company_name.trim();
      payload.company_website = formData.company_website.trim();
      payload.position = formData.position.trim();
      payload.company_location = formData.company_location.trim();
    }

    try {
      const data = await register(payload);
      setRegisteredRole(activeRole);

      if (activeRole === 'candidate') {
        if (data?.user?.id) {
          localStorage.setItem(`onboarding_completed_${data.user.id}`, 'false');
        }
        showToast('Candidate account created! Welcome to HirePulse.', 'success');
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/candidate-onboarding', { replace: true });
        }, 1200);
      } else {
        showToast(`Recruiter account created for ${formData.company_name}! Welcome to HirePulse.`, 'success');
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/recruiter/dashboard', { replace: true });
        }, 1200);
      }
    } catch (err) {
      setLoading(false);
      const respData = err.response?.data;
      let msg = 'Registration failed. Please check your inputs.';

      if (typeof respData === 'string') {
        msg = respData;
      } else if (respData && typeof respData === 'object') {
        const serverErrors = {};
        Object.keys(respData).forEach((key) => {
          const val = respData[key];
          serverErrors[key] = Array.isArray(val) ? val[0] : val;
        });
        setErrors((prev) => ({ ...prev, ...serverErrors }));

        const firstVal =
          respData.detail ||
          respData.email?.[0] ||
          respData.company_name?.[0] ||
          respData.phone?.[0] ||
          respData.password?.[0] ||
          respData.password_confirm?.[0] ||
          respData.role?.[0] ||
          Object.values(respData)[0];

        if (Array.isArray(firstVal)) {
          msg = firstVal[0];
        } else if (typeof firstVal === 'string') {
          msg = firstVal;
        }
      }
      showToast(msg, 'error');
    }
  };

  if (isRedirecting) {
    const isCandidateRedirect = registeredRole === 'candidate';

    return (
      <div style={{ maxWidth: '520px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3.5rem 2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1.25rem',
              borderRadius: '50%',
              backgroundColor: isCandidateRedirect ? 'var(--primary-light)' : '#EFF6FF',
              color: isCandidateRedirect ? 'var(--primary)' : '#2563EB',
              marginBottom: '1.5rem',
            }}
          >
            <CheckCircle2 size={42} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Account Created Successfully!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            {isCandidateRedirect
              ? 'Setting up your profile workspace and candidate onboarding steps...'
              : `Welcome! Preparing your recruiter portal for ${formData.company_name}...`}
          </p>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: '9999px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '60%',
                backgroundColor: 'var(--primary)',
                borderRadius: '9999px',
                animation: 'loadingProgress 1.2s ease-in-out infinite',
              }}
            />
          </div>
          <style>{`
            @keyframes loadingProgress {
              0% { transform: translateX(-100%); width: 30%; }
              50% { transform: translateX(50%); width: 70%; }
              100% { transform: translateX(180%); width: 30%; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '620px', margin: '2.5rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem 2.25rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.85rem',
              borderRadius: '50%',
              backgroundColor: activeRole === 'candidate' ? 'var(--primary-light)' : '#E0E7FF',
              color: activeRole === 'candidate' ? 'var(--primary)' : '#4F46E5',
              marginBottom: '1rem',
            }}
          >
            <UserPlus size={30} />
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Create Your HirePulse Account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Choose your account type to access tailored tools and opportunities
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            padding: '0.35rem',
            backgroundColor: 'var(--bg-surface-hover, #F8FAFC)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
            marginBottom: '2rem',
          }}
        >
          <button
            type="button"
            id="role-tab-candidate"
            onClick={() => handleRoleChange('candidate')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--border-radius-sm)',
              border: activeRole === 'candidate' ? '1px solid var(--primary)' : '1px solid transparent',
              backgroundColor: activeRole === 'candidate' ? '#FFFFFF' : 'transparent',
              color: activeRole === 'candidate' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeRole === 'candidate' ? 700 : 500,
              boxShadow: activeRole === 'candidate' ? '0 2px 8px rgba(33, 103, 213, 0.12)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <User size={18} />
            <span>Job Seeker (Candidate)</span>
          </button>

          <button
            type="button"
            id="role-tab-recruiter"
            onClick={() => handleRoleChange('recruiter')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--border-radius-sm)',
              border: activeRole === 'recruiter' ? '1px solid #4F46E5' : '1px solid transparent',
              backgroundColor: activeRole === 'recruiter' ? '#FFFFFF' : 'transparent',
              color: activeRole === 'recruiter' ? '#4F46E5' : 'var(--text-secondary)',
              fontWeight: activeRole === 'recruiter' ? 700 : 500,
              boxShadow: activeRole === 'recruiter' ? '0 2px 8px rgba(79, 70, 229, 0.12)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Building2 size={18} />
            <span>Employer / Recruiter</span>
          </button>
        </div>

        {/* Dynamic Context Notice */}
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: activeRole === 'candidate' ? 'rgba(33, 103, 213, 0.05)' : 'rgba(79, 70, 229, 0.05)',
            borderLeft: `3px solid ${activeRole === 'candidate' ? 'var(--primary)' : '#4F46E5'}`,
            borderRadius: '4px',
            marginBottom: '1.75rem',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
          }}
        >
          {activeRole === 'candidate' ? (
            <span>
              <strong>Job Seeker Account:</strong> Search verified vacancies, submit PDF applications with 1 click, and track your application milestones.
            </span>
          ) : (
            <span>
              <strong>Employer Account:</strong> Post job openings, manage applicant pipelines, review resumes, and showcase your employer brand.
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="first_name"
                className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                placeholder="Jane"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              {errors.first_name && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {errors.first_name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="last_name"
                className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              {errors.last_name && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {errors.last_name}
                </div>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label">
              {activeRole === 'recruiter' ? 'Work Email Address *' : 'Email Address *'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder={activeRole === 'recruiter' ? 'recruiter@company.com' : 'jane.doe@example.com'}
                value={formData.email}
                onChange={handleChange}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
            {errors.email && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">
              Mobile Number (10 digits) {activeRole === 'recruiter' ? '*' : '(Optional)'}
            </label>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  borderRight: 'none',
                  borderRadius: 'var(--border-radius-sm) 0 0 var(--border-radius-sm)',
                  padding: '0 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                }}
              >
                +91
              </div>
              <input
                type="tel"
                name="phone"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                style={{ borderRadius: '0 var(--border-radius-sm) var(--border-radius-sm) 0' }}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={10}
              />
            </div>
            {errors.phone && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                {errors.phone}
              </div>
            )}
          </div>

          {/* Recruiter-Specific Fields */}
          {activeRole === 'recruiter' && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem',
                backgroundColor: 'rgba(79, 70, 229, 0.03)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid rgba(79, 70, 229, 0.15)',
                marginBottom: '1.25rem',
              }}
            >
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#4F46E5',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Building2 size={16} /> Company & Organizational Profile
              </h4>

              <div className="form-group">
                <label className="form-label">Company / Organization Name *</label>
                <input
                  type="text"
                  name="company_name"
                  className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Acme Corporation or Innovate Labs"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                />
                {errors.company_name && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    {errors.company_name}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Your Role / Designation</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="position"
                      className="form-control"
                      placeholder="e.g. Lead Technical Recruiter"
                      value={formData.position}
                      onChange={handleChange}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <Briefcase
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Company Location / HQ</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="company_location"
                      className="form-control"
                      placeholder="e.g. Pune, Maharashtra"
                      value={formData.company_location}
                      onChange={handleChange}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <MapPin
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Company Website (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    name="company_website"
                    className={`form-control ${errors.company_website ? 'is-invalid' : ''}`}
                    placeholder="https://company.com"
                    value={formData.company_website}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Globe
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                </div>
                {errors.company_website && (
                  <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    {errors.company_website}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Passwords */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
              {errors.password && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {errors.password}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password_confirm"
                  className={`form-control ${errors.password_confirm ? 'is-invalid' : ''}`}
                  placeholder="Repeat password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
              {errors.password_confirm && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {errors.password_confirm}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              marginTop: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              backgroundColor: activeRole === 'recruiter' ? '#4F46E5' : 'var(--primary)',
              borderColor: activeRole === 'recruiter' ? '#4F46E5' : 'var(--primary)',
            }}
            disabled={loading}
          >
            {loading ? (
              'Creating Account...'
            ) : activeRole === 'candidate' ? (
              <>
                <span>Create Candidate Account</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Register Company & Recruiter Profile</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
};
