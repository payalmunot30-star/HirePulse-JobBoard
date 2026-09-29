import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { candidateService } from '../../services/candidate.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Search, UserCheck, Shield, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatTitle } from '../../utils/formatters';

export const UserManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || '';

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const r = searchParams.get('role') || '';
    setRoleFilter(r);
  }, [searchParams]);

  const fetchUsers = async () => {
    setLoading(true);
    const params = {};
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;

    try {
      const data = await candidateService.getUsers(params);
      setUsers(data.results || data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load user list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const handleToggleActive = async (userId, currentStatus) => {
    setActionLoadingId(userId);
    try {
      await candidateService.updateUserStatus(userId, !currentStatus);
      showToast(`User account ${!currentStatus ? 'activated' : 'deactivated'}.`, 'info');
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to change user account status.';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const displayName = (targetUser.first_name || targetUser.last_name)
      ? `${targetUser.first_name} ${targetUser.last_name}`.trim()
      : targetUser.email;

    const confirmMessage = `Are you sure you want to permanently delete the account for "${displayName}" (${targetUser.email})?\n\nThis will remove all associated profile data, applications, and records from the database. This action CANNOT be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      await candidateService.deleteUser(targetUser.id);
      showToast(`User account for ${targetUser.email} has been permanently deleted.`, 'success');
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      const msg = err.response?.data?.detail || 'Failed to delete user account.';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>User Accounts Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Control platform access, account activation, and permanent deletion</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search user email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '250px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <select
            className="form-control"
            style={{ width: '180px' }}
            value={roleFilter}
            onChange={(e) => {
              const val = e.target.value;
              setRoleFilter(val);
              const p = new URLSearchParams(searchParams);
              if (val) p.set('role', val);
              else p.delete('role');
              setSearchParams(p);
            }}
          >
            <option value="">All Roles</option>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading user directory...</div>
        ) : users.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isBusy = actionLoadingId === u.id;
                  const rawName = u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : '';

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: 'var(--heading-color)' }}>
                        {rawName ? formatTitle(rawName) : '—'}
                        {isSelf && (
                          <span
                            style={{
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem',
                              color: 'var(--primary)',
                              backgroundColor: '#E8F3FF',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            You
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-role-admin' : u.role === 'recruiter' ? 'badge-role-recruiter' : 'badge-role-candidate'}`}>
                          {u.role ? u.role.toUpperCase() : 'USER'}
                        </span>
                      </td>
                      <td>
                        {u.is_active ? (
                          <span className="badge badge-active">Active</span>
                        ) : (
                          <span className="badge badge-rejected">Inactive</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        {u.role === 'admin' ? (
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              backgroundColor: '#F3F8FC',
                              border: '1px solid #D9E4F2',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            title="System Administrator accounts cannot be deactivated or deleted"
                          >
                            <Shield size={13} style={{ color: 'var(--primary)' }} /> Protected Admin
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                              disabled={isBusy}
                              className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                            >
                              {isBusy ? 'Processing...' : u.is_active ? 'Deactivate' : 'Activate'}
                            </button>

                            {!u.is_active && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={isBusy}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: '#dc2626',
                                  color: '#ffffff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                                title="Permanently delete this account from database"
                              >
                                <Trash2 size={14} /> Delete Account
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No users match the search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
