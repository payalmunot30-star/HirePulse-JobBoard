import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Briefcase, Building, Users, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { jobService } from '../../services/job.service';
import { JobCard } from '../../components/jobs/JobCard';

export const Home = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    jobService.getJobs({ page_size: 6 }).then((data) => {
      setFeaturedJobs(data.results || []);
    }).catch(() => { });
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/jobs?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section style={{ padding: 'clamp(2rem, 5vw, 4.5rem) 1rem', textAlign: 'center', background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', marginBottom: '2.5rem', boxShadow: '0 2px 12px rgba(33, 103, 213, 0.04)' }}>
        <span className="badge badge-shortlisted" style={{ marginBottom: '1.25rem', padding: '0.4rem 1rem' }}>
          <TrendingUp size={14} style={{ marginRight: '0.4rem' }} /> Enterprise Hiring & Career Platform
        </span>
        <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.25rem)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.2, marginBottom: '1.25rem', color: '#172B4D' }}>
          Connecting Top Talent with <br /><span style={{ color: 'var(--primary)' }}>World-Class Companies</span>
        </h1>
        <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 2rem', lineHeight: 1.5 }}>
          Streamline your recruitment pipeline. Post jobs, manage applications, track hiring analytics, and land your dream job with precision.
        </p>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: '#FFFFFF', padding: '0.5rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', boxShadow: '0 4px 14px rgba(33, 103, 213, 0.08)' }}>
          <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', minWidth: 0 }}>
            <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.5rem', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by job title, skill, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem', minWidth: 0 }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ flex: '1 1 auto', minWidth: '130px' }}>
            Search Jobs
          </button>
        </form>
      </section>

      {/* Stats Counter Row */}
      <section className="grid-4" style={{ marginBottom: '4rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Briefcase /></div>
          <div>
            <div className="stat-value">5,000+</div>
            <div className="stat-label">Active Openings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}><Building /></div>
          <div>
            <div className="stat-value">1,200+</div>
            <div className="stat-label">Verified Employers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}><Users /></div>
          <div>
            <div className="stat-value">45,000+</div>
            <div className="stat-label">Registered Candidates</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E8F3FF', color: 'var(--primary)' }}><ShieldCheck /></div>
          <div>
            <div className="stat-value">98.5%</div>
            <div className="stat-label">Hiring Match Rate</div>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Explore Featured Opportunities</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Hand-picked job postings from verified industry leaders</p>
          </div>
          <Link to="/jobs" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            View All Jobs <ArrowRight size={16} />
          </Link>
        </div>

        {featuredJobs.length > 0 ? (
          <div className="grid-3">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No job listings available right now. Check back soon!</p>
          </div>
        )}
      </section>
    </div>
  );
};
