import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/job.service';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, ArrowLeft, Save, IndianRupee } from 'lucide-react';
import { formatINR, formatSalaryRange } from '../../utils/currency';

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

export const CreateJob = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [choices, setChoices] = useState({
    job_types: DEFAULT_JOB_TYPES,
    experience_levels: DEFAULT_EXPERIENCE_LEVELS,
  });
  const [skillsInput, setSkillsInput] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'engineering',
    location: '',
    salary_min: '',
    salary_max: '',
    experience_level: 'fresher',
    job_type: 'full-time',
    closing_date: '',
    skills_required: [],
  });

  const [loading, setLoading] = useState(false);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSalaryKeyDown = (e) => {
    // Prevent typing minus (-), plus (+), or exponential (e/E) signs
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleSalaryPaste = (e) => {
    const pasteData = e.clipboardData.getData('text');
    if (pasteData.includes('-') || isNaN(Number(pasteData)) || Number(pasteData) < 0) {
      e.preventDefault();
      showToast('Salary must be a positive number.', 'warning');
    }
  };

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    if (value === '') {
      setFormData((prev) => ({ ...prev, [name]: '' }));
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (num < 0) {
        setFormData((prev) => ({ ...prev, [name]: '' }));
        showToast('Salary cannot be negative.', 'warning');
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillsInput.trim() && !formData.skills_required.includes(skillsInput.trim())) {
      setFormData({
        ...formData,
        skills_required: [...formData.skills_required, skillsInput.trim()],
      });
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills_required: formData.skills_required.filter((s) => s !== skillToRemove),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate non-negative salaries
    if (formData.salary_min !== '' && formData.salary_min !== null) {
      const minVal = parseFloat(formData.salary_min);
      if (isNaN(minVal) || minVal < 0) {
        showToast('Minimum salary cannot be negative.', 'error');
        return;
      }
    }

    if (formData.salary_max !== '' && formData.salary_max !== null) {
      const maxVal = parseFloat(formData.salary_max);
      if (isNaN(maxVal) || maxVal < 0) {
        showToast('Maximum salary cannot be negative.', 'error');
        return;
      }
    }

    if (
      formData.salary_min !== '' && formData.salary_min !== null &&
      formData.salary_max !== '' && formData.salary_max !== null
    ) {
      const minVal = parseFloat(formData.salary_min);
      const maxVal = parseFloat(formData.salary_max);
      if (minVal > maxVal) {
        showToast('Maximum salary must be greater than or equal to minimum salary.', 'error');
        return;
      }
    }

    setLoading(true);

    const payload = {
      ...formData,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      closing_date: formData.closing_date || null,
    };

    try {
      await jobService.createJob(payload);
      showToast('Job posting created successfully!', 'success');
      navigate('/recruiter/jobs');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create job posting.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card">
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Post New Job Opportunity</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Create an active vacancy listing for prospective candidates
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="e.g. Senior Frontend Engineer (React)"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="form-control" value={formData.category} onChange={handleChange} required>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input
                type="text"
                name="location"
                className="form-control"
                placeholder="e.g. New York, NY or Remote"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Job Type *</label>
              <select name="job_type" className="form-control" value={formData.job_type} onChange={handleChange} required>
                {choices.job_types?.map((jt) => (
                  <option key={jt.value} value={jt.value}>{jt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level *</label>
              <select name="experience_level" className="form-control" value={formData.experience_level} onChange={handleChange} required>
                {choices.experience_levels?.map((exp) => (
                  <option key={exp.value} value={exp.value}>{exp.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IndianRupee size={15} /> Minimum Salary (₹ / INR)
              </label>
              <input
                type="number"
                name="salary_min"
                className="form-control"
                placeholder="e.g. 400000"
                min="0"
                step="1"
                value={formData.salary_min}
                onChange={handleSalaryChange}
                onKeyDown={handleSalaryKeyDown}
                onPaste={handleSalaryPaste}
              />
              {formData.salary_min && !isNaN(Number(formData.salary_min)) && Number(formData.salary_min) >= 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.35rem', fontWeight: 600 }}>
                  {formatINR(formData.salary_min)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <IndianRupee size={15} /> Maximum Salary (₹ / INR)
              </label>
              <input
                type="number"
                name="salary_max"
                className="form-control"
                placeholder="e.g. 600000"
                min="0"
                step="1"
                value={formData.salary_max}
                onChange={handleSalaryChange}
                onKeyDown={handleSalaryKeyDown}
                onPaste={handleSalaryPaste}
              />
              {formData.salary_max && !isNaN(Number(formData.salary_max)) && Number(formData.salary_max) >= 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.35rem', fontWeight: 600 }}>
                  {formatINR(formData.salary_max)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Closing Date</label>
              <input
                type="date"
                name="closing_date"
                className="form-control"
                value={formData.closing_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Salary example and Indian formatting display banner */}
          <div style={{
            backgroundColor: '#F3F8FF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            padding: '0.65rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Salary Format:</span>
              <span>Values in Indian Rupees (₹ / INR). Example: <strong style={{ color: 'var(--text-primary)' }}>₹4,00,000 – ₹6,00,000</strong> per annum.</span>
            </div>
            {(formData.salary_min || formData.salary_max) && (
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                Display: {formatSalaryRange(formData.salary_min, formData.salary_max)}
              </div>
            )}
          </div>

          {/* Required Skills Tag Input */}
          <div className="form-group">
            <label className="form-label">Required Skills</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Add skill (e.g. Python, Docker)"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
              <button type="button" onClick={handleAddSkill} className="btn btn-secondary">Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.skills_required.map((sk, idx) => (
                <span key={idx} style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                  {sk} <button type="button" onClick={() => handleRemoveSkill(sk)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Job Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows={6}
              placeholder="Describe roles, responsibilities, technical requirements, and benefits..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Publishing Job...' : 'Publish Job Posting'}
          </button>
        </form>
      </div>
    </div>
  );
};
