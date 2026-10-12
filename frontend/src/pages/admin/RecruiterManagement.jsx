import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidate.service';
import { useToast } from '../../context/ToastContext';
import { Search, Building, Mail, Calendar, CheckCircle, XCircle, ShieldCheck, Trash2 } from 'lucide-react';
import { formatTitle, formatCompanyName } from '../../utils/formatters';

export const RecruiterManagement = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { showToast } = useToast();

  const fetchRecruiters = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== '') params.is_active = statusFilter;

      const data = await candidateService.getRecruiters(params);
      setRecruiters(data.results || data);
    } catch (err) {
      console.error('Error fetching recruiters:', err);
      showToast('Failed to load recruiters list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecruiters();
  };

  const handleToggleStatus = async (recruiter) => {
    const newStatus = !recruiter.is_active;
    setActionLoadingId(recruiter.id);
    try {
      await candidateService.updateUserStatus(recruiter.id, newStatus);
      showToast(
        `Recruiter ${recruiter.full_name || recruiter.email} ${newStatus ? 'activated' : 'deactivated'}.`,
        'success'
      );
      setRecruiters((prev) =>
        prev.map((r) => (r.id === recruiter.id ? { ...r, is_active: newStatus } : r))
      );
    } catch (err) {
      showToast('Failed to update recruiter account status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRecruiter = async (recruiter) => {
    const displayName = recruiter.full_name || recruiter.email;
    const confirmMessage = `Are you sure you want to permanently delete the recruiter account for "${displayName}" (${recruiter.email})?\n\nThis will remove their profile, posted jobs, and applicant links from the system. This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoadingId(recruiter.id);
    try {
      await candidateService.deleteUser(recruiter.id);
      showToast(`Recruiter account for ${recruiter.email} permanently deleted.`, 'success');
      fetchRecruiters();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete recruiter account.';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalRecruiters = recruiters.length;
  const activeRecruiters = recruiters.filter((r) => r.is_active).length;

  return (
    <div>
      {/* Header with Title and Add Recruiter Button */}
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
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Recruiter Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Admin-only management for authorized recruiter accounts and hiring entities
          </p>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Total Recruiters
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--heading-color)', lineHeight: 1 }}>
            {totalRecruiters}
          </div>
        </div>

        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Active Accounts
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--success)', lineHeight: 1 }}>
            {activeRecruiters}
          </div>
        </div>

        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            Restricted / Inactive
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--danger)', lineHeight: 1 }}>
            {totalRecruiters - activeRecruiters}
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by recruiter name, email, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search
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

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Recruiter Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading recruiter accounts...
          </div>
        ) : recruiters.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Recruiter</th>
                  <th>Email</th>
                  <th>Company / Organization</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                          }}
                        >
                          {(r.first_name?.[0] || r.email?.[0] || 'R').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {formatTitle(r.full_name?.trim() ? r.full_name : `${r.first_name} ${r.last_name}`.trim() || 'Recruiter')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ID: #{r.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        {r.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{r.company_name ? formatCompanyName(r.company_name) : '—'}</span>
                      </div>
                    </td>
                    <td>
                      {r.is_active ? (
                        <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="badge badge-rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} />
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleToggleStatus(r)}
                          disabled={actionLoadingId === r.id}
                          className={`btn btn-sm ${r.is_active ? 'btn-danger' : 'btn-success'}`}
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                        >
                          {actionLoadingId === r.id
                            ? 'Updating...'
                            : r.is_active
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>

                        {!r.is_active && (
                          <button
                            onClick={() => handleDeleteRecruiter(r)}
                            disabled={actionLoadingId === r.id}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#dc2626',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.75rem',
                            }}
                            title="Permanently delete this recruiter account from database"
                          >
                            <Trash2 size={13} /> Delete Account
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Building size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              No Recruiters Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
              {search || statusFilter
                ? 'No recruiter accounts match the specified filters.'
                : 'There are currently no recruiter accounts registered in the platform.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
