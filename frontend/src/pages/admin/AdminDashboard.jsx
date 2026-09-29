import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { StatusBadge } from '../../components/common/Badge';
import { Users, Briefcase, CheckCircle2, ShieldAlert, BarChart2, UserCheck } from 'lucide-react';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getAdminDashboard()
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading platform analytics...</div>;
  if (!data) return null;

  const { overview, status_distribution, category_distribution, recent_users, recent_jobs } = data;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Platform Control Center</h1>
        <p style={{ color: 'var(--text-secondary)' }}>System-wide oversight, user roles management, and recruitment metrics</p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <Link to="/admin/users" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div className="stat-icon"><Users /></div>
          <div>
            <div className="stat-value">{overview.total_users}</div>
            <div className="stat-label">Total Users →</div>
          </div>
        </Link>

        <Link to="/admin/users?role=candidate" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}><UserCheck /></div>
          <div>
            <div className="stat-value">{overview.total_candidates}</div>
            <div className="stat-label" style={{ color: 'var(--primary)' }}>Candidates →</div>
          </div>
        </Link>

        <Link to="/admin/recruiters" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}><Briefcase /></div>
          <div>
            <div className="stat-value">{overview.total_recruiters}</div>
            <div className="stat-label" style={{ color: 'var(--primary)' }}>Recruiters →</div>
          </div>
        </Link>

        <Link to="/admin/applications?status=hired" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}><CheckCircle2 /></div>
          <div>
            <div className="stat-value">{overview.successful_hires}</div>
            <div className="stat-label" style={{ color: 'var(--success)' }}>Successful Hires →</div>
          </div>
        </Link>
      </div>

      {/* Jobs & Applications Counter Row with approved subtle hover */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <Link to="/admin/jobs" className="card card-clickable" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Job Vacancies</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.4rem 0', color: 'var(--heading-color)' }}>{overview.total_jobs_posted}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>{overview.active_jobs} Active Postings →</div>
        </Link>

        <Link to="/admin/applications" className="card card-clickable" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Total Applications</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.4rem 0', color: 'var(--heading-color)' }}>{overview.total_applications}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Across all jobs →</div>
        </Link>

        <Link to="/admin/users?role=admin" className="card card-clickable" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Admins</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, margin: '0.4rem 0', color: 'var(--heading-color)' }}>{overview.total_admins}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>System administrators →</div>
        </Link>
      </div>

      <div className="grid-2">
        {/* Recent Registrations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Recent Registrations</h3>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">Manage Users</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_users.map((u) => {
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--heading-color)' }}>
                          {formatTitle(fullName || u.email)}
                        </div>
                        {fullName && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {u.email}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-role-admin' : u.role === 'recruiter' ? 'badge-role-recruiter' : 'badge-role-candidate'}`}>
                          {u.role ? u.role.toUpperCase() : 'USER'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Job Postings */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Recent Job Postings</h3>
            <Link to="/admin/jobs" className="btn btn-secondary btn-sm">Manage Jobs</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_jobs.map((j) => (
                  <tr key={j.id}>
                    <td style={{ fontWeight: 600, color: 'var(--heading-color)' }}>{formatTitle(j.title)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCompanyName(j.recruiter__company_name || 'HirePulse')}</td>
                    <td><StatusBadge status={j.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
