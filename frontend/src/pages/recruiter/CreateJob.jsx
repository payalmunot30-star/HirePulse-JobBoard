import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/job.service';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, ArrowLeft, Save, IndianRupee, AlertCircle } from 'lucide-react';
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
  const [errors, setErrors] = useState({});

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
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
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
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      if (num < 0) {
        setFormData((prev) => ({ ...prev, [name]: '' }));
        showToast('Salary cannot be negative.', 'warning');
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
      if (errors.skills_required) setErrors((prev) => ({ ...prev, skills_required: '' }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills_required: formData.skills_required.filter((s) => s !== skillToRemove),
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required.';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = `Job title must be at least 3 characters (currently ${formData.title.trim().length}).`;
    }

    if (!formData.category) {
      newErrors.category = 'Job category is required.';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Job location is required (e.g. Pune, MH or Remote).';
    }

    if (!formData.job_type) {
      newErrors.job_type = 'Job type is required.';
    }

    if (!formData.experience_level) {
      newErrors.experience_level = 'Experience level is required.';
    }

    // Salary validations
    let minVal = null;
    let maxVal = null;

    if (formData.salary_min !== '' && formData.salary_min !== null) {
      minVal = parseFloat(formData.salary_min);
      if (isNaN(minVal) || minVal < 0) {
        newErrors.salary_min = 'Minimum salary cannot be negative.';
      } else if (minVal > 1000000000) {
        newErrors.salary_min = 'Minimum salary cannot exceed ₹100 Crores.';
      }
    }

    if (formData.salary_max !== '' && formData.salary_max !== null) {
      maxVal = parseFloat(formData.salary_max);
      if (isNaN(maxVal) || maxVal < 0) {
        newErrors.salary_max = 'Maximum salary cannot be negative.';
      } else if (maxVal > 1000000000) {
        newErrors.salary_max = 'Maximum salary cannot exceed ₹100 Crores.';
      }
    }

    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      newErrors.salary_max = 'Maximum salary must be greater than or equal to minimum salary.';
    }

    // Closing date validation
    if (formData.closing_date) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.closing_date < today) {
        newErrors.closing_date = 'Closing date cannot be set in the past.';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required.';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = `Job description must be at least 20 characters (currently ${formData.description.trim().length} chars, need at least 20).`;
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      showToast(formErrors[firstField], 'error');

      const el = document.querySelector(`[name="${firstField}"]`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
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
      const respData = err.response?.data;
      if (respData && typeof respData === 'object') {
        const serverErrors = {};
        Object.keys(respData).forEach((k) => {
          serverErrors[k] = Array.isArray(respData[k]) ? respData[k][0] : respData[k];
        });
        setErrors((prev) => ({ ...prev, ...serverErrors }));

        const serverErrorKeys = Object.keys(serverErrors);
        if (serverErrorKeys.length > 0) {
          const firstKey = serverErrorKeys[0];
          const el = document.querySelector(`[name="${firstKey}"]`);
          if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          const fieldLabel = firstKey.replace(/_/g, ' ');
          showToast(`${fieldLabel}: ${serverErrors[firstKey]}`, 'error');
          return;
        }
      }
      showToast(respData?.detail || 'Failed to create job posting. Please check required fields.', 'error');
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

        {Object.keys(errors).some((k) => Boolean(errors[k])) && (
          <div
            role="alert"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              color: '#991B1B',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} color="#DC2626" /> Please correct the following errors:
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.4rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {Object.entries(errors)
                .filter(([, msg]) => Boolean(msg))
                .map(([field, msg]) => (
                  <li key={field}>
                    <strong style={{ textTransform: 'capitalize' }}>{field.replace(/_/g, ' ')}:</strong> {msg}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input
              type="text"
              name="title"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              placeholder="e.g. Senior Frontend Engineer (React)"
              value={formData.title}
              onChange={handleChange}
            />
            {errors.title && (
              <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                {errors.title}
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && (
                <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                  {errors.category}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input
                type="text"
                name="location"
                className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                placeholder="e.g. New York, NY or Remote"
                value={formData.location}
                onChange={handleChange}
              />
              {errors.location && (
                <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                  {errors.location}
                </div>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Job Type *</label>
              <select
                name="job_type"
                className={`form-control ${errors.job_type ? 'is-invalid' : ''}`}
                value={formData.job_type}
                onChange={handleChange}
              >
                {choices.job_types?.map((jt) => (
                  <option key={jt.value} value={jt.value}>{jt.label}</option>
                ))}
              </select>
              {errors.job_type && (
                <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                  {errors.job_type}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level *</label>
              <select
                name="experience_level"
                className={`form-control ${errors.experience_level ? 'is-invalid' : ''}`}
                value={formData.experience_level}
                onChange={handleChange}
              >
                {choices.experience_levels?.map((exp) => (
                  <option key={exp.value} value={exp.value}>{exp.label}</option>
                ))}
              </select>
              {errors.experience_level && (
                <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                  {errors.experience_level}
                </div>
              )}
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
                className={`form-control ${errors.salary_min ? 'is-invalid' : ''}`}
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
              {errors.salary_min && (
                <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                  {errors.salary_min}
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
                className={`form-control ${errors.salary_max ? 'is-invalid' : ''}`}
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
              {errors.salary_max && (
                <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                  {errors.salary_max}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Closing Date</label>
              <input
                type="date"
                name="closing_date"
                className={`form-control ${errors.closing_date ? 'is-invalid' : ''}`}
                value={formData.closing_date}
                onChange={handleChange}
              />
              {errors.closing_date && (
                <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                  {errors.closing_date}
                </div>
              )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Detailed Job Description *</label>
              <span style={{
                fontSize: '0.78rem',
                color: formData.description.trim().length >= 20 ? 'var(--text-secondary)' : (errors.description ? 'var(--danger, #dc2626)' : 'var(--text-muted)')
              }}>
                {formData.description.trim().length} / 20 min chars
              </span>
            </div>
            <textarea
              name="description"
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              rows={6}
              placeholder="Describe roles, responsibilities, technical requirements, and benefits..."
              value={formData.description}
              onChange={handleChange}
            />
            {errors.description && (
              <div style={{ color: 'var(--danger, #dc2626)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 500 }}>
                {errors.description}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            <Save size={18} /> {loading ? 'Publishing Job...' : 'Publish Job Posting'}
          </button>
        </form>
      </div>
    </div>
  );
};
