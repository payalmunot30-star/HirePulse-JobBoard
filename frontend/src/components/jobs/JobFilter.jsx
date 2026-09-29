import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { jobService } from '../../services/job.service';

const DEFAULT_JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'remote', label: 'Remote' },
];

const DEFAULT_EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher / Entry Level' },
  { value: '0-2', label: '0–2 Years' },
  { value: '2-5', label: '2–5 Years' },
  { value: '5-8', label: '5–8 Years' },
  { value: '8+', label: '8+ Years' },
];

export const JobFilter = ({ filters, onFilterChange, onReset }) => {
  const [categories, setCategories] = useState([]);
  const [choices, setChoices] = useState({
    job_types: DEFAULT_JOB_TYPES,
    experience_levels: DEFAULT_EXPERIENCE_LEVELS,
  });

  useEffect(() => {
    jobService.getCategories().then(setCategories).catch(() => {});
    jobService.getChoices().then((res) => {
      setChoices({
        job_types: res.job_types?.length ? res.job_types : DEFAULT_JOB_TYPES,
        experience_levels: res.experience_levels?.length ? res.experience_levels : DEFAULT_EXPERIENCE_LEVELS,
      });
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
        
        {/* Search input */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Search Keywords</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              name="search"
              className="form-control"
              placeholder="Title, skills, company..."
              value={filters.search || ''}
              onChange={handleChange}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Category */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Category</label>
          <select name="category" className="form-control" value={filters.category || ''} onChange={handleChange}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Location</label>
          <input
            type="text"
            name="location"
            className="form-control"
            placeholder="City, Remote, etc."
            value={filters.location || ''}
            onChange={handleChange}
          />
        </div>

        {/* Job Type */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Job Type</label>
          <select name="job_type" className="form-control" value={filters.job_type || ''} onChange={handleChange}>
            <option value="">All Types</option>
            {choices.job_types?.map((jt) => (
              <option key={jt.value} value={jt.value}>
                {jt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Experience Level */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Experience Level</label>
          <select name="experience_level" className="form-control" value={filters.experience_level || ''} onChange={handleChange}>
            <option value="">All Levels</option>
            {choices.experience_levels?.map((exp) => (
              <option key={exp.value} value={exp.value}>
                {exp.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onReset} className="btn btn-secondary" style={{ flex: 1 }}>
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};
