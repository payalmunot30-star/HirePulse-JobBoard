import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Common Components
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { Sidebar } from './components/common/Sidebar';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { Home } from './pages/public/Home';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { ForgotPassword } from './pages/public/ForgotPassword';
import { ResetPassword } from './pages/public/ResetPassword';
import { JobListings } from './pages/public/JobListings';
import { JobDetails } from './pages/public/JobDetails';

// Candidate Pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateProfile } from './pages/candidate/CandidateProfile';
import { MyApplications } from './pages/candidate/MyApplications';
import { CandidateOnboarding } from './pages/candidate/CandidateOnboarding';

// Recruiter Pages
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { RecruiterProfile } from './pages/recruiter/RecruiterProfile';
import { CreateJob } from './pages/recruiter/CreateJob';
import { EditJob } from './pages/recruiter/EditJob';
import { ManageJobs } from './pages/recruiter/ManageJobs';
import { ApplicantsList } from './pages/recruiter/ApplicantsList';
import { CandidateSearch } from './pages/recruiter/CandidateSearch';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { RecruiterManagement } from './pages/admin/RecruiterManagement';
import { UserManagement } from './pages/admin/UserManagement';
import { JobManagement } from './pages/admin/JobManagement';
import { HiringOverview } from './pages/admin/HiringOverview';
import { ApplicationManagement } from './pages/admin/ApplicationManagement';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';

// Dashboard Container Wrapper
const DashboardWrapper = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageInfo = (path) => {
    if (path.includes('/candidate/dashboard')) return { title: 'Dashboard', profile: '/candidate/profile' };
    if (path.includes('/candidate/applications')) return { title: 'My Applications', profile: '/candidate/profile' };
    if (path.includes('/candidate/profile')) return { title: 'Profile & Resume', profile: '/candidate/profile' };
    if (path.includes('/recruiter/dashboard')) return { title: 'Dashboard', profile: '/recruiter/profile' };
    if (path.includes('/recruiter/jobs') && !path.includes('/edit')) return { title: 'Job Postings', profile: '/recruiter/profile' };
    if (path.includes('/recruiter/jobs') && path.includes('/edit')) return { title: 'Edit Job', profile: '/recruiter/profile' };
    if (path.includes('/recruiter/create-job')) return { title: 'Create Job', profile: '/recruiter/profile' };
    if (path.includes('/recruiter/applicants')) return { title: 'Applications', profile: '/recruiter/profile' };
    if (path.includes('/recruiter/candidates')) return { title: 'Candidate Search', profile: '/recruiter/profile' };
    if (path.includes('/recruiter/profile')) return { title: 'Company Profile', profile: '/recruiter/profile' };
    if (path.includes('/admin/dashboard')) return { title: 'Platform Analytics', profile: '/admin/users' };
    if (path.includes('/admin/recruiters')) return { title: 'Recruiters', profile: '/admin/users' };
    if (path.includes('/admin/users')) return { title: 'User Management', profile: '/admin/users' };
    if (path.includes('/admin/jobs')) return { title: 'All Job Postings', profile: '/admin/users' };
    if (path.includes('/admin/applications')) return { title: 'Applications', profile: '/admin/users' };
    if (path.includes('/admin/hiring')) return { title: 'Hiring Pipeline', profile: '/admin/users' };
    return { title: 'HirePulse', profile: '/jobs' };
  };

  const { title, profile } = getPageInfo(location.pathname);

  return (
    <div className="dashboard-layout">
      {/* Mobile Top Bar */}
      <div className="dashboard-mobile-bar">
        <button
          type="button"
          className="dashboard-mobile-menu-btn"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          <span>Menu</span>
        </button>

        <span className="dashboard-mobile-title">{title}</span>

        <Link
          to={profile}
          className="dashboard-mobile-profile-btn"
          title="My Profile"
          aria-label="My Profile"
        >
          <User size={18} />
        </Link>
      </div>

      {/* Backdrop for overlay drawer on mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with isOpen and onClose props */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main dashboard content */}
      <main className="dashboard-content">{children}</main>
    </div>
  );
};

function AppRoutes() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/candidate-onboarding' || location.pathname === '/candidate/onboarding';
  const isDashboardRoute =
    location.pathname.startsWith('/candidate/') ||
    location.pathname.startsWith('/recruiter/') ||
    location.pathname.startsWith('/admin/');

  return (
    <div className={`app-container ${isDashboardRoute ? 'dashboard-page-container' : ''}`}>
      {!isOnboarding && <Header />}
      <div className="main-content" style={{ padding: 0, maxWidth: '100%', minHeight: isDashboardRoute ? '100vh' : undefined }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<div className="main-content"><Home /></div>} />
                <Route path="/login" element={<div className="main-content"><Login /></div>} />
                <Route path="/register" element={<div className="main-content"><Register /></div>} />
                <Route path="/forgot-password" element={<div className="main-content"><ForgotPassword /></div>} />
                <Route path="/reset-password" element={<div className="main-content"><ResetPassword /></div>} />
                <Route path="/reset-password/:uid/:token" element={<div className="main-content"><ResetPassword /></div>} />
                <Route path="/jobs" element={<div className="main-content"><JobListings /></div>} />
                <Route path="/jobs/:id" element={<div className="main-content"><JobDetails /></div>} />

                {/* Candidate Routes */}
                <Route
                  path="/candidate-onboarding"
                  element={
                    <ProtectedRoute roles={['candidate']}>
                      <CandidateOnboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/onboarding"
                  element={
                    <ProtectedRoute roles={['candidate']}>
                      <CandidateOnboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/dashboard"
                  element={
                    <ProtectedRoute roles={['candidate']}>
                      <DashboardWrapper><CandidateDashboard /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/profile"
                  element={
                    <ProtectedRoute roles={['candidate']}>
                      <DashboardWrapper><CandidateProfile /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/applications"
                  element={
                    <ProtectedRoute roles={['candidate']}>
                      <DashboardWrapper><MyApplications /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />

                {/* Recruiter Routes */}
                <Route
                  path="/recruiter/dashboard"
                  element={
                    <ProtectedRoute roles={['recruiter', 'admin']}>
                      <DashboardWrapper><RecruiterDashboard /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/profile"
                  element={
                    <ProtectedRoute roles={['recruiter']}>
                      <DashboardWrapper><RecruiterProfile /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/create-job"
                  element={
                    <ProtectedRoute roles={['recruiter']}>
                      <DashboardWrapper><CreateJob /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/jobs"
                  element={
                    <ProtectedRoute roles={['recruiter']}>
                      <DashboardWrapper><ManageJobs /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/jobs/:id/edit"
                  element={
                    <ProtectedRoute roles={['recruiter']}>
                      <DashboardWrapper><EditJob /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/applicants"
                  element={
                    <ProtectedRoute roles={['recruiter', 'admin']}>
                      <DashboardWrapper><ApplicantsList /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/candidates"
                  element={
                    <ProtectedRoute roles={['recruiter', 'admin']}>
                      <DashboardWrapper><CandidateSearch /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <DashboardWrapper><AdminDashboard /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/recruiters"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <DashboardWrapper><RecruiterManagement /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <DashboardWrapper><UserManagement /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/jobs"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <DashboardWrapper><JobManagement /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/applications"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <DashboardWrapper><ApplicationManagement /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/hiring"
                  element={
                    <ProtectedRoute roles={['admin']}>
                      <DashboardWrapper><HiringOverview /></DashboardWrapper>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
            {!isOnboarding && <Footer />}
          </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
