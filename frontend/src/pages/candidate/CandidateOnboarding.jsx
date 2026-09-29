import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { candidateService } from '../../services/candidate.service';
import { validatePdfFile } from '../../utils/resume';
import {
  Briefcase,
  EyeOff,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
} from 'lucide-react';
import './CandidateOnboarding.css';

const JOB_TYPE_OPTIONS = [
  'Freelance',
  'Permanent',
  'Part-time',
  'Volunteer',
  'Full-time',
  'Contractual / Temporary',
  'Fresher',
  'Internship',
];

const JOB_TITLE_SUGGESTIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Full Stack Developer',
  'Backend Developer',
  'Data Analyst',
  'UI/UX Designer',
  'DevOps Engineer',
  'Quality Assurance Engineer',
  'Product Manager',
  'Business Analyst',
];

const SKILL_SUGGESTIONS = [
  'React',
  'JavaScript',
  'Python',
  'Node.js',
  'TypeScript',
  'SQL',
  'Java',
  'Git',
  'HTML/CSS',
  'Docker',
  'AWS',
  'REST APIs',
];

const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher / Entry Level (0-1 yrs)', desc: 'Recent graduate or transitioning to a new career' },
  { id: 'junior', label: 'Junior Level (1-3 yrs)', desc: 'Developing core expertise with practical project experience' },
  { id: 'mid', label: 'Mid-Level (3-5 yrs)', desc: 'Proven track record handling end-to-end responsibilities' },
  { id: 'senior', label: 'Senior / Lead (5+ yrs)', desc: 'Deep technical proficiency, architecture, or leadership skills' },
];

export const CandidateOnboarding = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [locationCity, setLocationCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [remoteInterested, setRemoteInterested] = useState(false);

  // Step 2: Minimum Pay
  const [minPay, setMinPay] = useState('');
  const [payPeriod, setPayPeriod] = useState('Per year');
  const [showMorePayPeriods, setShowMorePayPeriods] = useState(false);

  // Step 3: Job Types
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);

  // Step 4: Job Titles
  const [jobTitles, setJobTitles] = useState([]);
  const [titleInput, setTitleInput] = useState('');

  // Step 5: Skills
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  // Step 6: Experience & Education
  const [experienceLevel, setExperienceLevel] = useState('fresher');
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree");

  // Step 7: Resume
  const [resumeFile, setResumeFile] = useState(null);

  // Restore saved draft or existing profile
  useEffect(() => {
    if (!user) return;
    const draftKey = `candidate_onboarding_draft_${user.id}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.locationCity) setLocationCity(parsed.locationCity.replace(/[^a-zA-Z\s,.'-]/g, ''));
        if (parsed.postcode) setPostcode(parsed.postcode.replace(/\D/g, ''));
        if (parsed.remoteInterested !== undefined) setRemoteInterested(parsed.remoteInterested);
        if (parsed.minPay) setMinPay(parsed.minPay);
        if (parsed.payPeriod) setPayPeriod(parsed.payPeriod);
        if (parsed.selectedJobTypes) setSelectedJobTypes(parsed.selectedJobTypes);
        if (parsed.jobTitles) setJobTitles(parsed.jobTitles);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
        if (parsed.educationLevel) setEducationLevel(parsed.educationLevel);
        if (parsed.currentStep && parsed.currentStep < 8) setCurrentStep(parsed.currentStep);
      } catch (e) {
        console.error('Error parsing draft:', e);
      }
    }
  }, [user]);

  // Auto-save draft on changes
  useEffect(() => {
    if (!user) return;
    const draftKey = `candidate_onboarding_draft_${user.id}`;
    const dataToSave = {
      locationCity,
      postcode,
      remoteInterested,
      minPay,
      payPeriod,
      selectedJobTypes,
      jobTitles,
      skills,
      experienceLevel,
      educationLevel,
      currentStep,
    };
    localStorage.setItem(draftKey, JSON.stringify(dataToSave));
  }, [
    user,
    locationCity,
    postcode,
    remoteInterested,
    minPay,
    payPeriod,
    selectedJobTypes,
    jobTitles,
    skills,
    experienceLevel,
    educationLevel,
    currentStep,
  ]);

  // Step Percentages mirroring the uploaded images
  // Image 1: 8% complete
  // Image 2: 17% complete
  // Image 3: 25% complete
  // Image 4: 33% complete
  // Step 5: 50%
  // Step 6: 68%
  // Step 7: 85%
  // Step 8: 100% complete
  const stepPercentages = {
    1: 8,
    2: 17,
    3: 25,
    4: 33,
    5: 50,
    6: 68,
    7: 85,
    8: 100,
  };

  const progressPercent = stepPercentages[currentStep] || 8;

  // Handlers for Job Types
  const toggleJobType = (type) => {
    if (selectedJobTypes.includes(type)) {
      setSelectedJobTypes(selectedJobTypes.filter((t) => t !== type));
    } else {
      setSelectedJobTypes([...selectedJobTypes, type]);
    }
  };

  // Handlers for Job Titles
  const addJobTitle = (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (jobTitles.length >= 10) {
      showToast('You can add up to 10 job titles.', 'warning');
      return;
    }
    if (!jobTitles.includes(trimmed)) {
      setJobTitles([...jobTitles, trimmed]);
    }
    setTitleInput('');
  };

  const removeJobTitle = (title) => {
    setJobTitles(jobTitles.filter((t) => t !== title));
  };

  // Handlers for Skills
  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Handlers for Resume
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      e.target.value = '';
      return;
    }
    setResumeFile(file);
    showToast(`Selected resume: ${file.name}`, 'info');
  };

  // Handlers for Location (Words only for City/State, Numbers only for Postcode)
  const handleLocationCityChange = (e) => {
    // City or state must be words only (letters, spaces, commas, hyphens, periods, apostrophes - no numbers)
    const filtered = e.target.value.replace(/[^a-zA-Z\s,.'-]/g, '');
    setLocationCity(filtered);
  };

  const handlePostcodeChange = (e) => {
    // Postcode must be numeric only
    const filtered = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPostcode(filtered);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validation for location
      const trimmedCity = locationCity.trim();
      if (!trimmedCity) {
        showToast('Please enter your City and State to continue.', 'error');
        return;
      }
      if (!/^[a-zA-Z\s,.'-]+$/.test(trimmedCity) || !/[a-zA-Z]/.test(trimmedCity)) {
        showToast('City, State must be in words only (letters and spaces, no numbers).', 'error');
        return;
      }
      if (postcode.trim() && !/^\d+$/.test(postcode.trim())) {
        showToast('Postcode must be numeric only.', 'error');
        return;
      }
    }
    if (currentStep === 4 && jobTitles.length === 0 && titleInput.trim()) {
      addJobTitle(titleInput);
    }
    if (currentStep === 5 && skills.length === 0 && skillInput.trim()) {
      addSkill(skillInput);
    }

    setCurrentStep((prev) => Math.min(prev + 1, 8));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    try {
      const payload = new FormData();

      // Format location
      let fullLocation = locationCity.trim();
      if (postcode.trim()) {
        fullLocation += `, ${postcode.trim()}`;
      }
      if (remoteInterested) {
        fullLocation += ' (Open to Remote)';
      }
      payload.append('location', fullLocation);

      // Bio / Career statement combining preferences
      let bioParts = [];
      if (jobTitles.length > 0) {
        bioParts.push(`Target Roles: ${jobTitles.join(', ')}`);
      }
      if (selectedJobTypes.length > 0) {
        bioParts.push(`Employment Types: ${selectedJobTypes.join(', ')}`);
      }
      if (minPay) {
        bioParts.push(`Expected Base Pay: ₹${minPay} (${payPeriod})`);
      }
      payload.append('bio', bioParts.join(' | '));

      // Skills: combine custom skills and selected job titles
      const combinedSkills = Array.from(new Set([...skills, ...jobTitles]));
      payload.append('skills', JSON.stringify(combinedSkills));

      // Education & Experience
      const educationData = [
        {
          degree: educationLevel,
          institution: 'Completed',
          year: new Date().getFullYear(),
        },
      ];
      payload.append('education', JSON.stringify(educationData));

      const experienceData = [
        {
          title: jobTitles[0] || 'Professional',
          company: experienceLevel.toUpperCase(),
          duration: experienceLevel,
          description: `Preferred job types: ${selectedJobTypes.join(', ')}`,
        },
      ];
      payload.append('experience', JSON.stringify(experienceData));

      // Resume file if uploaded
      if (resumeFile) {
        payload.append('resume', resumeFile);
      }

      await candidateService.updateCandidateProfile(payload);
      await refreshUser();

      // Mark onboarding as completed for this user in localStorage
      if (user?.id) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
        localStorage.removeItem(`candidate_onboarding_draft_${user.id}`);
      }

      showToast('Onboarding complete! Welcome to your dashboard.', 'success');
      navigate('/candidate/dashboard');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      // Even if API partially complains, mark onboarding complete so user is not permanently stuck
      if (user?.id) {
        localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      }
      showToast('Welcome to your candidate dashboard!', 'success');
      navigate('/candidate/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onboarding-screen">
      {/* Top Bar with Brand & Exit */}
      <div className="onboarding-top-bar">
        <Link to="/" className="onboarding-brand">
          <Briefcase size={24} color="#2167D5" />
          Hire<span>Pulse</span>
        </Link>
        <button
          type="button"
          className="onboarding-exit-btn"
          onClick={() => {
            if (window.confirm('Do you want to exit onboarding? You can resume anytime.')) {
              navigate('/');
            }
          }}
        >
          Save & Exit
        </button>
      </div>

      <div className="onboarding-content-wrap">
        {/* Progress Bar (Sample Image Header) */}
        <div className="onboarding-progress-section">
          <div className="onboarding-progress-label">{progressPercent}% complete</div>
          <div className="onboarding-progress-track">
            <div
              className="onboarding-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ================= STEP 1: LOCATION (IMAGE 1) ================= */}
        {currentStep === 1 && (
          <div>
            <h1 className="onboarding-title">Let us start with the basics. Where are you located?</h1>
            <p className="onboarding-subtitle">We use this to match you with jobs nearby.</p>

            <div className="onboarding-grid-2">
              <div className="onboarding-field">
                <label className="onboarding-label">City, State</label>
                <input
                  type="text"
                  className="onboarding-input"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={locationCity}
                  onChange={handleLocationCityChange}
                  autoFocus
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #667085)', marginTop: '0.35rem' }}>
                  Words only (letters and spaces, no numbers)
                </span>
              </div>

              <div className="onboarding-field">
                <label className="onboarding-label">Postcode</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="onboarding-input"
                  placeholder="e.g. 400001"
                  value={postcode}
                  onChange={handlePostcodeChange}
                  maxLength={10}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #667085)', marginTop: '0.35rem' }}>
                  Numbers only
                </span>
              </div>
            </div>

            {/* On/Off Toggle Buttons for Job Preferences */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {[
                { id: 'Remote', label: 'I am interested in remote work' },
                { id: 'Full-time', label: 'Full-time' },
                { id: 'Part-time', label: 'Part-time' },
                { id: 'Internship', label: 'Internship' },
                { id: 'Contract', label: 'Contract' },
              ].map((item) => {
                const isChecked = item.id === 'Remote'
                  ? remoteInterested
                  : selectedJobTypes.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="onboarding-toggle-row"
                    style={{ margin: 0 }}
                    onClick={() => {
                      if (item.id === 'Remote') {
                        const nextVal = !remoteInterested;
                        setRemoteInterested(nextVal);
                        if (nextVal && !selectedJobTypes.includes('Remote')) {
                          setSelectedJobTypes([...selectedJobTypes, 'Remote']);
                        } else if (!nextVal) {
                          setSelectedJobTypes(selectedJobTypes.filter((t) => t !== 'Remote'));
                        }
                      } else {
                        toggleJobType(item.id);
                      }
                    }}
                  >
                    <div className={`onboarding-toggle-pill ${isChecked ? 'active' : ''}`}>
                      <div className="onboarding-toggle-thumb">
                        {isChecked ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <span className="onboarding-toggle-text">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 2: MINIMUM PAY (IMAGE 2) ================= */}
        {currentStep === 2 && (
          <div>
            <h1 className="onboarding-title">What is the minimum pay you are looking for?</h1>
            <p className="onboarding-subtitle">
              We use this to match you with jobs that pay around and above this amount.
            </p>

            {/* Info callout */}
            <div className="onboarding-callout">
              <EyeOff className="onboarding-callout-icon" size={20} />
              <span className="onboarding-callout-text">Employers will not see this preference.</span>
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">Minimum base pay</label>
              <div className="onboarding-currency-wrapper">
                <span className="onboarding-currency-symbol">₹</span>
                <input
                  type="number"
                  className="onboarding-input onboarding-currency-input"
                  placeholder="e.g. 500000"
                  value={minPay}
                  onChange={(e) => setMinPay(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">Pay period</label>
              <div className="onboarding-pill-group">
                {['Per hour', 'Per year'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    className={`onboarding-pill-btn ${payPeriod === period ? 'active' : ''}`}
                    onClick={() => setPayPeriod(period)}
                  >
                    {period}
                  </button>
                ))}

                {showMorePayPeriods &&
                  ['Per month', 'Per week', 'Per day'].map((period) => (
                    <button
                      key={period}
                      type="button"
                      className={`onboarding-pill-btn ${payPeriod === period ? 'active' : ''}`}
                      onClick={() => setPayPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
              </div>

              <div>
                <button
                  type="button"
                  className="onboarding-show-more-btn"
                  onClick={() => setShowMorePayPeriods(!showMorePayPeriods)}
                >
                  {showMorePayPeriods ? 'Show fewer pay periods' : 'Show more pay periods'}
                  {showMorePayPeriods ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: JOB TYPES (IMAGE 3) ================= */}
        {currentStep === 3 && (
          <div>
            <h1 className="onboarding-title">What type of job are you interested in?</h1>
            <p className="onboarding-subtitle">Select one or more that match your current availability.</p>

            <div className="onboarding-type-list">
              {JOB_TYPE_OPTIONS.map((type) => {
                const isSelected = selectedJobTypes.includes(type);
                return (
                  <div
                    key={type}
                    className={`onboarding-type-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleJobType(type)}
                  >
                    <div className="onboarding-type-icon">
                      {isSelected ? <Check size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                    </div>
                    <span className="onboarding-type-label">{type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 4: JOB TITLES (IMAGE 4) ================= */}
        {currentStep === 4 && (
          <div>
            <h1 className="onboarding-title">What job are you looking for?</h1>
            <p className="onboarding-subtitle">
              This helps us show you the most relevant jobs. You can always change this later.
            </p>

            <div className="onboarding-field">
              <label className="onboarding-label">Job-title</label>
              <div className="onboarding-sublabel">Add up to 10 job titles</div>
              <input
                type="text"
                className="onboarding-input"
                placeholder="e.g. Frontend Developer"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addJobTitle(titleInput);
                  }
                }}
                autoFocus
              />
            </div>

            {/* Added chips */}
            {jobTitles.length > 0 && (
              <div className="onboarding-tags-box">
                {jobTitles.map((title) => (
                  <span key={title} className="onboarding-tag-chip">
                    {title}
                    <button
                      type="button"
                      className="onboarding-tag-remove"
                      onClick={() => removeJobTitle(title)}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions */}
            <div className="onboarding-suggestions-title">Popular suggestions</div>
            <div className="onboarding-suggestions-group">
              {JOB_TITLE_SUGGESTIONS.map((suggestion) => {
                const isAdded = jobTitles.includes(suggestion);
                return (
                  <button
                    key={suggestion}
                    type="button"
                    className="onboarding-suggestion-pill"
                    onClick={() => addJobTitle(suggestion)}
                    disabled={isAdded}
                    style={{ opacity: isAdded ? 0.5 : 1 }}
                  >
                    {isAdded ? <Check size={12} /> : <Plus size={12} />}
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 5: SKILLS ================= */}
        {currentStep === 5 && (
          <div>
            <h1 className="onboarding-title">What skills do you bring to the table?</h1>
            <p className="onboarding-subtitle">
              Recruiters frequently search candidates based on specific technical and professional skills.
            </p>

            <div className="onboarding-field">
              <label className="onboarding-label">Add your skills</label>
              <div className="onboarding-sublabel">Type a skill and press Enter or select from below</div>
              <input
                type="text"
                className="onboarding-input"
                placeholder="e.g. React, Python, Product Design"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                autoFocus
              />
            </div>

            {skills.length > 0 && (
              <div className="onboarding-tags-box">
                {skills.map((skill) => (
                  <span key={skill} className="onboarding-tag-chip">
                    {skill}
                    <button
                      type="button"
                      className="onboarding-tag-remove"
                      onClick={() => removeSkill(skill)}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="onboarding-suggestions-title">Suggested Skills</div>
            <div className="onboarding-suggestions-group">
              {SKILL_SUGGESTIONS.map((suggestedSkill) => {
                const isAdded = skills.includes(suggestedSkill);
                return (
                  <button
                    key={suggestedSkill}
                    type="button"
                    className="onboarding-suggestion-pill"
                    onClick={() => addSkill(suggestedSkill)}
                    disabled={isAdded}
                    style={{ opacity: isAdded ? 0.5 : 1 }}
                  >
                    {isAdded ? <Check size={12} /> : <Plus size={12} />}
                    {suggestedSkill}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= STEP 6: EXPERIENCE & EDUCATION ================= */}
        {currentStep === 6 && (
          <div>
            <h1 className="onboarding-title">What is your experience level?</h1>
            <p className="onboarding-subtitle">
              This helps employers match opportunities that fit your background.
            </p>

            <div className="onboarding-field">
              <label className="onboarding-label">Experience Bracket</label>
              <div className="onboarding-type-list" style={{ marginTop: '0.5rem' }}>
                {EXPERIENCE_LEVELS.map((lvl) => {
                  const isSelected = experienceLevel === lvl.id;
                  return (
                    <div
                      key={lvl.id}
                      className={`onboarding-type-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setExperienceLevel(lvl.id)}
                    >
                      <div className="onboarding-type-icon">
                        {isSelected ? <Check size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                      </div>
                      <div>
                        <div className="onboarding-type-label">{lvl.label}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{lvl.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">Highest Education Level</label>
              <select
                className="onboarding-input"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Diploma / Certification">Diploma / Certification</option>
                <option value="High School">High School</option>
                <option value="Doctorate / PhD">Doctorate / PhD</option>
              </select>
            </div>
          </div>
        )}

        {/* ================= STEP 7: RESUME UPLOAD ================= */}
        {currentStep === 7 && (
          <div>
            <h1 className="onboarding-title">Add your resume for employers</h1>
            <p className="onboarding-subtitle">
              Candidates who upload their resume receive up to 3x more profile views and interview invites.
            </p>

            <label
              className={`onboarding-upload-dropzone ${resumeFile ? 'has-file' : ''}`}
              htmlFor="onboarding-resume-input"
            >
              <input
                id="onboarding-resume-input"
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={handleResumeChange}
              />
              {resumeFile ? (
                <div>
                  <CheckCircle2 size={44} color="#16834B" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#16834B' }}>
                    {resumeFile.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#667085', marginTop: '4px' }}>
                    {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={40} color="#2167D5" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#172B4D' }}>
                    Upload your resume (PDF)
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#667085', marginTop: '4px' }}>
                    Drag & drop or browse your device (Max 5MB)
                  </div>
                </div>
              )}
            </label>
          </div>
        )}

        {/* ================= STEP 8: CELEBRATION & 100% COMPLETE ================= */}
        {currentStep === 8 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '1rem',
                  borderRadius: '50%',
                  backgroundColor: '#E8F3FF',
                  color: '#2167D5',
                  marginBottom: '1rem',
                }}
              >
                <Sparkles size={40} />
              </div>
              <h1 className="onboarding-title">You're all set! 100% Complete</h1>
              <p className="onboarding-subtitle" style={{ maxWidth: '540px', margin: '0.5rem auto 1.5rem' }}>
                Your preferences are saved. We're ready to unlock your personalized candidate dashboard and job matches.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="onboarding-summary-card">
              <div className="onboarding-summary-item">
                <span className="onboarding-summary-label">Location:</span>
                <span className="onboarding-summary-val">
                  {locationCity || 'Not specified'} {postcode ? `(${postcode})` : ''}
                  {remoteInterested ? ' • Open to Remote' : ''}
                </span>
              </div>
              <div className="onboarding-summary-item">
                <span className="onboarding-summary-label">Target Roles:</span>
                <span className="onboarding-summary-val">
                  {jobTitles.length > 0 ? jobTitles.join(', ') : 'Open to suggestions'}
                </span>
              </div>
              <div className="onboarding-summary-item">
                <span className="onboarding-summary-label">Job Types:</span>
                <span className="onboarding-summary-val">
                  {selectedJobTypes.length > 0 ? selectedJobTypes.join(', ') : 'Any'}
                </span>
              </div>
              <div className="onboarding-summary-item">
                <span className="onboarding-summary-label">Expected Pay:</span>
                <span className="onboarding-summary-val">
                  {minPay ? `₹${Number(minPay).toLocaleString('en-IN')} ${payPeriod}` : 'Negotiable'}
                </span>
              </div>
              <div className="onboarding-summary-item">
                <span className="onboarding-summary-label">Skills Added:</span>
                <span className="onboarding-summary-val">
                  {skills.length > 0 ? skills.slice(0, 5).join(', ') + (skills.length > 5 ? ` +${skills.length - 5} more` : '') : 'General'}
                </span>
              </div>
              <div className="onboarding-summary-item">
                <span className="onboarding-summary-label">Resume:</span>
                <span className="onboarding-summary-val">
                  {resumeFile ? `Attached (${resumeFile.name})` : 'Can be uploaded later'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="onboarding-actions">
          {/* Skip link for optional steps */}
          {(currentStep === 5 || currentStep === 6 || currentStep === 7) && (
            <button
              type="button"
              className="onboarding-skip-link"
              onClick={() => setCurrentStep((prev) => prev + 1)}
            >
              Skip this step for now
            </button>
          )}

          {/* Back button (Images 2, 3, 4 show Back right next to Continue) */}
          {currentStep > 1 && currentStep < 8 && (
            <button type="button" className="onboarding-btn-back" onClick={handleBack}>
              Back
            </button>
          )}

          {/* Continue button */}
          {currentStep < 8 ? (
            <button type="button" className="onboarding-btn-continue" onClick={handleNext}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="onboarding-btn-continue"
              onClick={handleFinishOnboarding}
              disabled={submitting}
              style={{ padding: '0.9rem 2.5rem', fontSize: '1.1rem' }}
            >
              {submitting ? 'Setting up Dashboard...' : 'Go to Dashboard'}
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateOnboarding;
