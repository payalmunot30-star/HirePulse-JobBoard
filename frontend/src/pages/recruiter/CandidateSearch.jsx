import React, { useState, useEffect } from 'react';
import { candidateService } from '../../services/candidate.service';
import {
  Search,
  User,
  Phone,
  MapPin,
  Linkedin,
  FileText,
  Globe,
  Download,
  Mail,
  Briefcase,
  GraduationCap,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { viewResume, downloadResume } from '../../utils/resume';
import { formatTitle } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';

export const CandidateSearch = () => {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchCandidates = async () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (skill) params.skill = skill;

    try {
      const data = await candidateService.getCandidates(params);
      setCandidates(data.results || data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, skill]);

  const handleClearFilters = () => {
    setSearch('');
    setSkill('');
  };

  // Helper to format structured or paragraph bio inside the modal
  const renderBio = (bio) => {
    if (!bio || !bio.trim()) return null;

    if (bio.includes('Target Roles:') || bio.includes('Employment Types:') || bio.includes('|')) {
      const segments = bio.split('|').map((s) => s.trim()).filter(Boolean);
      return (
        <div className="candidate-bio-box">
          {segments.map((seg, idx) => {
            const colonIndex = seg.indexOf(':');
            if (colonIndex !== -1) {
              const label = seg.substring(0, colonIndex).trim();
              const val = seg.substring(colonIndex + 1).trim();
              return (
                <div key={idx} className="candidate-bio-segment">
                  <span className="candidate-bio-label">{label}:</span>{' '}
                  <span className="candidate-bio-val">{val}</span>
                </div>
              );
            }
            return (
              <div key={idx} className="candidate-bio-segment candidate-bio-val">
                {seg}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="candidate-bio-box">
        <p className="candidate-bio-text">{bio}</p>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Search Candidate Profiles</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find qualified talent by name, skill set, or experience</p>
      </div>

      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Keywords</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Candidate name, bio, experience..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter by Technical Skill</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Python, React, PostgreSQL"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>
        </div>

        {(search || skill) && (
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Filtering candidates by:{' '}
              <strong>{[search && `"${search}"`, skill && `Skill: "${skill}"`].filter(Boolean).join(', ')}</strong>
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {loading ? 'Searching profiles...' : `${candidates.length} Candidate${candidates.length === 1 ? '' : 's'} Found`}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Searching candidate database...
        </div>
      ) : candidates.length > 0 ? (
        <div className="candidates-grid">
          {candidates.map((cand) => {
            const fullName = formatTitle(
              `${cand.user?.first_name || ''} ${cand.user?.last_name || ''}`.trim() || 'Candidate'
            );
            const initial = (cand.user?.first_name?.[0] || 'C').toUpperCase();
            const hasResume = Boolean(cand.resume_url || cand.resume);

            return (
              <div key={cand.id} className="candidate-card">
                <div>
                  {/* Top Row: Avatar + Name, Role, Location, Links */}
                  <div className="candidate-card-header">
                    <div className="candidate-avatar" style={{ overflow: 'hidden' }}>
                      {cand.profile_picture_url || cand.profile_picture ? (
                        <img
                          src={cand.profile_picture_url || cand.profile_picture}
                          alt={fullName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    <div className="candidate-info">
                      <div className="candidate-name-row">
                        <h3 className="candidate-name" title={fullName}>
                          {fullName}
                        </h3>
                        <span className="candidate-role-badge">Candidate</span>
                      </div>

                      {/* Location */}
                      <div className="candidate-location" title={cand.location ? formatTitle(cand.location) : ''}>
                        <MapPin size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                        <span>{cand.location ? formatTitle(cand.location) : 'Location not specified'}</span>
                      </div>

                      {/* LinkedIn or Portfolio links */}
                      <div className="candidate-links-row">
                        {cand.linkedin_url && (
                          <a
                            href={cand.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="candidate-link-pill"
                            title="LinkedIn Profile"
                          >
                            <Linkedin size={13} /> LinkedIn
                          </a>
                        )}
                        {cand.portfolio_url && (
                          <a
                            href={cand.portfolio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="candidate-link-pill"
                            title="Portfolio / Website"
                          >
                            <Globe size={13} /> Portfolio
                          </a>
                        )}
                        {!cand.linkedin_url && !cand.portfolio_url && (
                          <span className="candidate-link-pill disabled" title="No LinkedIn or Portfolio linked">
                            No external links
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: View or Download Resume & View Details Button */}
                <div className="candidate-card-footer">
                  <div className="candidate-resume-actions">
                    {hasResume ? (
                      <>
                        <button
                          type="button"
                          onClick={() => viewResume(cand.resume_url || cand.resume)}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          title="View Resume in new tab"
                        >
                          <FileText size={13} /> View Resume
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadResume(
                              cand.resume_url || cand.resume,
                              `${cand.user?.first_name || 'Candidate'}_Resume.pdf`
                            )
                          }
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Download Resume PDF"
                        >
                          <Download size={13} /> Download
                        </button>
                      </>
                    ) : (
                      <span className="candidate-no-resume-badge">
                        <FileText size={13} /> No Resume
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCandidate(cand)}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    title="View candidate details, bio, skills, and background"
                  >
                    <Eye size={13} /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <User size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--heading-color)', marginBottom: '0.5rem' }}>No Candidates Found</h3>
          <p style={{ margin: '0 auto 1.5rem', maxWidth: '400px' }}>
            No candidate profiles match your search criteria. Try modifying your search keywords or skill filters.
          </p>
          {(search || skill) && (
            <button type="button" onClick={handleClearFilters} className="btn btn-primary btn-sm">
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Candidate Full Profile Details Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title="Candidate Profile Details"
      >
        {selectedCandidate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header in Modal */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div className="candidate-avatar" style={{ width: '56px', height: '56px', fontSize: '1.45rem', overflow: 'hidden' }}>
                {selectedCandidate.profile_picture_url || selectedCandidate.profile_picture ? (
                  <img
                    src={selectedCandidate.profile_picture_url || selectedCandidate.profile_picture}
                    alt="Candidate"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (selectedCandidate.user?.first_name?.[0] || 'C').toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--heading-color)' }}>
                  {formatTitle(
                    `${selectedCandidate.user?.first_name || ''} ${selectedCandidate.user?.last_name || ''}`.trim() ||
                      'Candidate'
                  )}
                </h3>
                <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {selectedCandidate.user?.email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={13} /> {selectedCandidate.user.email}
                    </span>
                  )}
                  {selectedCandidate.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={13} /> {selectedCandidate.phone}
                    </span>
                  )}
                  {selectedCandidate.location && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} /> {formatTitle(selectedCandidate.location)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Resume actions in Modal */}
            {(selectedCandidate.resume_url || selectedCandidate.resume) && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => viewResume(selectedCandidate.resume_url || selectedCandidate.resume)}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <FileText size={16} /> View Resume PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadResume(
                      selectedCandidate.resume_url || selectedCandidate.resume,
                      `${selectedCandidate.user?.first_name || 'Candidate'}_Resume.pdf`
                    )
                  }
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Download size={16} /> Download Resume
                </button>
              </div>
            )}

            {/* Bio / Target Summary */}
            {selectedCandidate.bio ? (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--heading-color)' }}>
                  Professional Summary & Target Roles
                </h4>
                {renderBio(selectedCandidate.bio)}
              </div>
            ) : (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--heading-color)' }}>
                  Professional Summary
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No summary provided by candidate.
                </p>
              </div>
            )}

            {/* Technical Skills */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--heading-color)' }}>
                Technical Skills {selectedCandidate.skills?.length > 0 && `(${selectedCandidate.skills.length})`}
              </h4>
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedCandidate.skills.map((sk, idx) => (
                    <span key={idx} className="candidate-skill-pill">
                      {sk}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No technical skills listed.
                </p>
              )}
            </div>

            {/* Work Experience */}
            {Array.isArray(selectedCandidate.experience) && selectedCandidate.experience.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--heading-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={15} /> Work Experience
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {selectedCandidate.experience.map((exp, idx) => (
                    <div key={idx} style={{ backgroundColor: '#F8FAFD', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--heading-color)', fontSize: '0.9rem' }}>
                        {exp.title || 'Role'} {exp.company && <span style={{ color: 'var(--primary)' }}>• {exp.company}</span>}
                      </div>
                      {(exp.start_date || exp.end_date) && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {exp.start_date} - {exp.current ? 'Present' : (exp.end_date || '')}
                        </div>
                      )}
                      {exp.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', whiteSpace: 'pre-line' }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {Array.isArray(selectedCandidate.education) && selectedCandidate.education.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem', color: 'var(--heading-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={15} /> Education
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {selectedCandidate.education.map((edu, idx) => (
                    <div key={idx} style={{ backgroundColor: '#F8FAFD', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--heading-color)', fontSize: '0.9rem' }}>
                        {edu.degree || 'Degree'} {edu.field_of_study && <span>in {edu.field_of_study}</span>}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {edu.institution || ''} {edu.start_year && `(${edu.start_year} - ${edu.end_year || 'Present'})`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(selectedCandidate.linkedin_url || selectedCandidate.portfolio_url) && (
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                {selectedCandidate.linkedin_url && (
                  <a
                    href={selectedCandidate.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Linkedin size={14} /> LinkedIn Profile
                  </a>
                )}
                {selectedCandidate.portfolio_url && (
                  <a
                    href={selectedCandidate.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Globe size={14} /> Personal Website
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
