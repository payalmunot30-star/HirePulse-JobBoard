import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';
import {
  Briefcase,
  Bell,
  User,
  Building,
  Shield,
  LogOut,
  PlusCircle,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { formatTitle } from '../../utils/formatters';

export const Header = () => {
  const { user, isAuthenticated, isCandidate, isRecruiter, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobilePublicNavOpen, setMobilePublicNavOpen] = useState(false);

  const notificationDropdownRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch notifications for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      notificationService
        .getNotifications()
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.results || [];
          setNotifications(list);
          const count = list.filter((n) => !n.is_read).length;
          setUnreadCount(count);
        })
        .catch(() => { });
    }
  }, [isAuthenticated, location.pathname]);

  // Close dropdowns on outside click or Escape key press
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setNotificationsOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  const rawDisplayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`.trim()
    : (user?.name || (isAdmin ? 'System Administrator' : user?.email?.split('@')[0] || (isRecruiter ? 'Recruiter' : 'Candidate')));
  const displayName = formatTitle(rawDisplayName);

  // Shared Notifications Bell & Dropdown component
  const renderNotifications = () => (
    <li ref={notificationDropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="nav-link"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.35rem 0.6rem',
          borderRadius: '6px',
          color: notificationsOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        title="Notifications"
      >
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-7px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '9999px',
                padding: '0.05rem 0.35rem',
                minWidth: '15px',
                height: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {unreadCount}
            </span>
          )}
        </span>
        <span className="navbar-btn-text">Notifications</span>
      </button>

      {/* Notifications Dropdown Panel */}
      {notificationsOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.6rem)',
            width: 'min(320px, calc(100vw - 20px))',
            maxWidth: 'calc(100vw - 20px)',
            maxHeight: '400px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: n.is_read ? 500 : 700, color: 'var(--text-primary)' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );

  return (
    <header className="navbar">
      {/* Hire Pulse logo on the left -> / */}
      <Link to="/" className="navbar-brand">
        <Briefcase className="w-6 h-6 text-primary" style={{ color: '#2167D5' }} />
        Hire<span>Pulse</span>
      </Link>

      <nav>
        <ul className="nav-links">
          {/* Public Home Link (hidden once authenticated) */}
          {!isAuthenticated && (
            <li>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
            </li>
          )}

          {/* Browse Jobs -> /jobs */}
          <li>
            <Link to="/jobs" className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}>
              Browse Jobs
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              {/* ──────────────── 1. CANDIDATE NAVBAR ──────────────── */}
              {isCandidate && (
                <>
                  {renderNotifications()}

                  {/* Candidate Username Dropdown */}
                  <li ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: dropdownOpen ? 'var(--bg-surface-hover)' : undefined,
                      }}
                    >
                      <User size={15} />
                      <span>{displayName}</span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 0.6rem)',
                          width: 'min(240px, calc(100vw - 20px))',
                          maxWidth: 'calc(100vw - 20px)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius)',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 1000,
                          padding: '0.5rem 0',
                        }}
                      >
                        <Link
                          to="/candidate/profile"
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.65rem 1rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <User size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Profile & Resume</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View & edit profile</div>
                          </div>
                        </Link>

                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.4rem 0' }} />

                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            width: '100%',
                            padding: '0.65rem 1rem',
                            color: 'var(--danger, #ef4444)',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <LogOut size={16} style={{ flexShrink: 0 }} />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </li>
                </>
              )}

              {/* ──────────────── 2. RECRUITER NAVBAR ──────────────── */}
              {isRecruiter && (
                <>
                  {/* + Post a Job -> /recruiter/create-job (highlighted in blue) */}
                  <li>
                    <Link to="/recruiter/create-job" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <PlusCircle size={16} /> Post a Job
                    </Link>
                  </li>

                  {renderNotifications()}

                  {/* Recruiter Username Dropdown */}
                  <li ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: dropdownOpen ? 'var(--bg-surface-hover)' : undefined,
                      }}
                    >
                      <Building size={15} />
                      <span>{displayName}</span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 0.6rem)',
                          width: 'min(240px, calc(100vw - 20px))',
                          maxWidth: 'calc(100vw - 20px)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius)',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 1000,
                          padding: '0.5rem 0',
                        }}
                      >
                        <Link
                          to="/recruiter/profile"
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            padding: '0.65rem 1rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Building size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Company Profile</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage company details</div>
                          </div>
                        </Link>

                        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.4rem 0' }} />

                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            width: '100%',
                            padding: '0.65rem 1rem',
                            color: 'var(--danger, #ef4444)',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <LogOut size={16} style={{ flexShrink: 0 }} />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </li>
                </>
              )}

              {/* ──────────────── 3. ADMIN NAVBAR ──────────────── */}
              {isAdmin && (
                <>
                  {renderNotifications()}

                  {/* Admin Account Dropdown */}
                  <li ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: dropdownOpen ? 'var(--bg-surface-hover)' : undefined,
                      }}
                    >
                      <Shield size={15} />
                      <span>{displayName}</span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 0.6rem)',
                          width: 'min(240px, calc(100vw - 20px))',
                          maxWidth: 'calc(100vw - 20px)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius)',
                          boxShadow: 'var(--shadow-lg)',
                          zIndex: 1000,
                          padding: '0.5rem 0',
                        }}
                      >
                        <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            System Administrator
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            width: '100%',
                            padding: '0.65rem 1rem',
                            color: 'var(--danger, #ef4444)',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <LogOut size={16} style={{ flexShrink: 0 }} />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </li>
                </>
              )}
            </>
          ) : (
            /* ──────────────── 4. PUBLIC NAVBAR (Unchanged) ──────────────── */
            <>
              <li>
                <Link to="/register?role=recruiter" className="nav-link" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  Employers / Post Job
                </Link>
              </li>
              <li>
                <Link to="/login" className="nav-link">
                  Log In
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};
