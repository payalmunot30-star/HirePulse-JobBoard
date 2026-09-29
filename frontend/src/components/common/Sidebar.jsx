import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  User,
  Building,
  PlusCircle,
  BarChart2,
  ClipboardList,
  X,
  LogOut,
} from 'lucide-react';
import { formatTitle } from '../../utils/formatters';

export const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, isCandidate, isRecruiter, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const roleLabel = isAdmin ? 'Administrator' : isRecruiter ? 'Recruiter' : 'Candidate';
  const rawDisplayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`.trim()
    : (user?.name || user?.email?.split('@')[0] || roleLabel);
  const displayName = formatTitle(rawDisplayName);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile Drawer Header with Close Button */}
      <div className="sidebar-drawer-header">
        <div className="sidebar-brand-mini">
          <Briefcase size={20} style={{ color: '#2167D5' }} />
          <span>Hire<strong style={{ color: '#2167D5' }}>Pulse</strong></span>
        </div>
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar navigation"
        >
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-nav-body">
        {isCandidate && (
          <>
            <div className="sidebar-heading">Candidate Portal</div>
            <NavLink to="/candidate/dashboard" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> <span>Dashboard</span>
            </NavLink>
            <NavLink to="/candidate/applications" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <FileText size={18} /> <span>My Applications</span>
            </NavLink>
            <NavLink to="/candidate/profile" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <User size={18} /> <span>Profile & Resume</span>
            </NavLink>
            <NavLink to="/jobs" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Briefcase size={18} /> <span>Browse Jobs</span>
            </NavLink>
          </>
        )}

        {isRecruiter && (
          <>
            <div className="sidebar-heading">Recruiter Portal</div>
            <NavLink to="/recruiter/dashboard" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> <span>Dashboard</span>
            </NavLink>
            <NavLink to="/recruiter/jobs" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Briefcase size={18} /> <span>Job Postings</span>
            </NavLink>
            <NavLink to="/recruiter/create-job" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <PlusCircle size={18} /> <span>Create New Job</span>
            </NavLink>
            <NavLink to="/recruiter/applicants" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Users size={18} /> <span>Applications</span>
            </NavLink>
            <NavLink to="/recruiter/candidates" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Users size={18} /> <span>Candidate Search</span>
            </NavLink>
            <NavLink to="/recruiter/profile" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Building size={18} /> <span>Company Profile</span>
            </NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-heading">Admin System</div>
            <NavLink to="/admin/dashboard" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <BarChart2 size={18} /> <span>Platform Analytics</span>
            </NavLink>
            <NavLink to="/admin/recruiters" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Building size={18} /> <span>Recruiters</span>
            </NavLink>
            <NavLink to="/admin/users" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Users size={18} /> <span>User Management</span>
            </NavLink>
            <NavLink to="/admin/jobs" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Briefcase size={18} /> <span>All Job Postings</span>
            </NavLink>
            <NavLink to="/admin/applications" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={18} /> <span>Applications</span>
            </NavLink>
            <NavLink to="/admin/hiring" onClick={handleNavClick} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <FileText size={18} /> <span>Hiring Pipeline</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Sidebar Drawer Footer: user info & logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user-preview">
          <div className="sidebar-user-avatar">
            {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">{roleLabel}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-logout-btn"
          title="Logout"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
