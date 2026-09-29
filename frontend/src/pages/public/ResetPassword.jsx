import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';
import { Lock, CheckCircle } from 'lucide-react';

export const ResetPassword = () => {
  const { uid: paramUid, token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const uid = paramUid || searchParams.get('uid') || '';
  const token = paramToken || searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid || !token) {
      showToast('Missing password reset link parameters. Please request a new link.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      await authService.confirmPasswordReset({
        uid,
        token,
        new_password: password,
        new_password_confirm: confirmPassword,
      });
      showToast('Password reset successful. Please log in with your new password.', 'success');
      navigate('/login');
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.token?.[0] ||
        err.response?.data?.uid?.[0] ||
        err.response?.data?.new_password?.[0] ||
        'Invalid or expired password reset token.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Set New Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose a strong password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
