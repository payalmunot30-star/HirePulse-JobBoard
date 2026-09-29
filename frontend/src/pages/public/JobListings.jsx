import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobService } from '../../services/job.service';
import { JobCard } from '../../components/jobs/JobCard';
import { JobFilter } from '../../components/jobs/JobFilter';
import { CheckCircle2, Archive, ArrowLeft } from 'lucide-react';

export const JobListings = () => {
  const { isCandidate, isRecruiter, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Determine role-based dashboard destination
  const getDashboardRoute = () => {
    if (isCandidate) return '/candidate/dashboard';
    if (isRecruiter) return '/recruiter/dashboard';
    if (isAdmin) return '/admin/dashboard';
    return null;
  };
  const dashboardRoute = getDashboardRoute();

  const initialFilters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    job_type: searchParams.get('job_type') || '',
    experience_level: searchParams.get('experience_level') || '',
    status: searchParams.get('status') || 'active',
    page: 1,
  };

  const [filters, setFilters] = useState(initialFilters);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
      );
      const data = await jobService.getJobs(activeFilters);
      setJobs(data.results || []);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleStatusChange = (newStatus) => {
    const updated = { ...filters, status: newStatus, page: 1 };
    setFilters(updated);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('status', newStatus);
    setSearchParams(newParams);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...newFilters, status: filters.status, page: 1 });
  };

  const handleReset = () => {
    setFilters({
      search: '',
      category: '',
      location: '',
      job_type: '',
      experience_level: '',
      status: 'active',
      page: 1,
    });
    setSearchParams({});
  };

  return (
    <div>
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
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Explore Job Opportunities</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Showing {totalCount} {filters.status === 'closed' ? 'closed' : 'active'} positions matching your criteria
          </p>
        </div>

        {/* Right action controls: Back to Dashboard & Active/Closed toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {dashboardRoute && (
            <Link
              to={dashboardRoute}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
              }}
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          )}

          {/* Active & Closed Jobs Filter Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: 'var(--bg-surface)',
              padding: '0.35rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${filters.status !== 'closed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
              }}
              onClick={() => handleStatusChange('active')}
            >
              <CheckCircle2 size={16} /> Active Jobs
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filters.status === 'closed' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
              }}
              onClick={() => handleStatusChange('closed')}
            >
              <Archive size={16} /> Closed Jobs
            </button>
          </div>
        </div>
      </div>

      <JobFilter filters={filters} onFilterChange={handleFilterChange} onReset={handleReset} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          Loading jobs...
        </div>
      ) : jobs.length > 0 ? (
        <div className={jobs.length > 1 ? 'jobs-grid-2' : 'jobs-single-card'}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No {filters.status === 'closed' ? 'Closed' : 'Active'} Jobs Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {filters.status === 'closed'
              ? 'There are currently no closed job postings matching your criteria.'
              : 'Try adjusting your search keywords or clearing some filters.'}
          </p>
          <button onClick={handleReset} className="btn btn-secondary">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
