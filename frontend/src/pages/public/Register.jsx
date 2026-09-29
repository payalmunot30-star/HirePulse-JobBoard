import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserPlus, Mail, Lock } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'candidate',
  });

  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'candidate',
      });
      if (data?.user?.id) {
        localStorage.setItem(`onboarding_completed_${data.user.id}`, 'false');
      }
      showToast('Registration successful! Welcome to HirePulse.', 'success');
      setIsRedirecting(true);
      setTimeout(() => {
        navigate('/candidate-onboarding', { replace: true });
      }, 1200);
    } catch (err) {
      setLoading(false);
      const respData = err.response?.data;
      let msg = 'Registration failed. Please check your inputs.';
      if (typeof respData === 'string') {
        msg = respData;
      } else if (respData && typeof respData === 'object') {
        const firstVal = respData.detail || respData.email?.[0] || respData.password?.[0] || respData.password_confirm?.[0] || respData.role?.[0] || Object.values(respData)[0];
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
    return (
      <div style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1.25rem',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              marginBottom: '1.5rem',
            }}
          >
            <UserPlus size={36} style={{ animation: 'spin 1.5s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Account Created Successfully!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Preparing your candidate onboarding steps...
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
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
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
    <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '0.75rem' }}>
            <UserPlus size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create Candidate Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Join HirePulse to explore jobs and accelerate your career
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="first_name"
                className="form-control"
                placeholder="Jane"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="last_name"
                className="form-control"
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password_confirm"
                className="form-control"
                placeholder="Repeat password"
                value={formData.password_confirm}
                onChange={handleChange}
                required
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Candidate Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already registered? <Link to="/login" style={{ fontWeight: 600 }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};

