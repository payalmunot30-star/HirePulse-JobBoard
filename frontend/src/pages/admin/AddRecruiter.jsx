import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { candidateService } from '../../services/candidate.service';
import { useToast } from '../../context/ToastContext';
import {
  UserPlus,
  ArrowLeft,
  User,
  Mail,
  Building,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const AddRecruiter = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company_name: '',
    password: '',
    password_confirm: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!formData.password_confirm) {
      newErrors.password_confirm = 'Please confirm the password.';
    } else if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the validation errors.', 'error');
      return;
    }

    setLoading(true);
    try {
      await candidateService.createRecruiter({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        company_name: formData.company_name.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
      });

      showToast(`Recruiter account created successfully!`, 'success');
      navigate('/admin/recruiters');
    } catch (err) {
      console.error('Recruiter creation error:', err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fieldErrors = {};
        if (data.email) fieldErrors.email = Array.isArray(data.email) ? data.email[0] : data.email;
        if (data.password) fieldErrors.password = Array.isArray(data.password) ? data.password[0] : data.password;
        if (data.password_confirm) fieldErrors.password_confirm = Array.isArray(data.password_confirm) ? data.password_confirm[0] : data.password_confirm;
        if (data.full_name) fieldErrors.full_name = Array.isArray(data.full_name) ? data.full_name[0] : data.full_name;

        setErrors(fieldErrors);

        const firstMsg =
          fieldErrors.email ||
          fieldErrors.password ||
          fieldErrors.password_confirm ||
          data.detail ||
          'Failed to create recruiter account.';
        showToast(firstMsg, 'error');
      } else {
        showToast('Server error. Could not create recruiter account.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/admin/recruiters"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to Recruiters
        </Link>
      </div>

      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div
            style={{
              padding: '0.85rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserPlus size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              Add New Recruiter
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Create an authorized recruiter account with access to job postings and applicant management.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '8px',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Admin-Enforced Authorization:</strong>{' '}
            Recruiter accounts can only be provisioned by an authenticated platform administrator. The role{' '}
            <code style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
              recruiter
            </code>{' '}
            will be securely assigned on creation.
          </div>
        </div>

        {/* Creation Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Full Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="full_name"
                className="form-control"
                placeholder="e.g. Sarah Jenkins"
                value={formData.full_name}
                onChange={handleChange}
                style={{
                  paddingLeft: '2.5rem',
                  borderColor: errors.full_name ? 'var(--danger)' : undefined,
                }}
              />
              <User
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
            {errors.full_name && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                {errors.full_name}
              </div>
            )}
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Email Address <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="recruiter@company.com"
                value={formData.email}
                onChange={handleChange}
                style={{
                  paddingLeft: '2.5rem',
                  borderColor: errors.email ? 'var(--danger)' : undefined,
                }}
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

          {/* Company / Organization Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Company / Organization Name <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="company_name"
                className="form-control"
                placeholder="e.g. Acme Corporation"
                value={formData.company_name}
                onChange={handleChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Building
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
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              The recruiter can customize their full company profile after signing in.
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    borderColor: errors.password ? 'var(--danger)' : undefined,
                  }}
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {errors.password}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Confirm Password <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="password_confirm"
                  className="form-control"
                  placeholder="Repeat password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  style={{
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                    borderColor: errors.password_confirm ? 'var(--danger)' : undefined,
                  }}
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password_confirm && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {errors.password_confirm}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
            <Link to="/admin/recruiters" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                'Creating Account...'
              ) : (
                <>
                  <UserPlus size={18} /> Create Recruiter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
