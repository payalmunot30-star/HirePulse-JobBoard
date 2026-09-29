import React, { useState } from 'react';

/**
 * Extracts initials from company name:
 * "ABC Technologies" -> "AT"
 * "XYZ Solutions" -> "XS"
 * "Google" -> "GO"
 */
export const getCompanyInitials = (name) => {
  if (!name || typeof name !== 'string') return 'HP';
  const clean = name.trim();
  if (!clean) return 'HP';
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Resolves a clean hex brand color avoiding invalid CSS syntax with var() concatenation
 */
export const resolveBrandColor = (brandColor) => {
  if (!brandColor || typeof brandColor !== 'string') return '#2167D5';
  const trimmed = brandColor.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/#[0-9a-fA-F]{6}/);
  if (match) return match[0];
  if (trimmed.toLowerCase().includes('success') || trimmed.toLowerCase().includes('green')) return '#16834B';
  return '#2167D5';
};

/**
 * Generates gradient style for HirePulse default company banner
 */
export const getDefaultBannerStyle = (brandColor, seed = 'HP') => {
  const primaryColor = resolveBrandColor(brandColor);
  const secondaryColor = '#1558BD';

  return {
    background: `linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}44 50%, ${primaryColor}33 100%)`,
    backgroundImage: `radial-gradient(at 10% 20%, ${primaryColor}40 0px, transparent 50%), radial-gradient(at 90% 80%, ${secondaryColor}30 0px, transparent 50%)`,
  };
};

/**
 * CompanyLogo component:
 * Displays company logo image with contain object-fit.
 * Falls back to company_bird_logo.png, and then to company initials badge if absent or failed.
 */
export const CompanyLogo = ({
  src,
  name = 'Company',
  brandColor,
  size = 44,
  borderRadius = 10,
  fontSize,
  fallbackSrc = '/company_bird_logo.png',
  className = '',
  style = {},
}) => {
  const [customFailed, setCustomFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const initials = getCompanyInitials(name);
  const effectiveFontSize = fontSize || Math.max(12, Math.floor(size * 0.36));
  const effectiveColor = resolveBrandColor(brandColor);

  // 1. Try custom logo src if provided
  if (src && !customFailed) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius: `${borderRadius}px`,
          backgroundColor: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
          ...style,
        }}
      >
        <img
          src={src}
          alt={name}
          onError={() => setCustomFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // 2. Try default company logo fallback
  if (fallbackSrc && !fallbackFailed) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius: `${borderRadius}px`,
          backgroundColor: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
          ...style,
        }}
      >
        <img
          src={fallbackSrc}
          alt={name}
          onError={() => setFallbackFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // 3. Fallback to initials badge with guaranteed valid styles
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: `linear-gradient(135deg, ${effectiveColor} 0%, #1558BD 100%)`,
        backgroundColor: effectiveColor,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: `${effectiveFontSize}px`,
        letterSpacing: '0.5px',
        userSelect: 'none',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        ...style,
      }}
      title={name}
    >
      {initials}
    </div>
  );
};

/**
 * CompanyBanner component:
 * Displays company banner image with cover object-fit.
 * Falls back to /job_card_banner.jpg with stylish typography or gradient banner if missing.
 */
export const CompanyBanner = ({
  src,
  name = 'Company',
  brandColor,
  height = 180,
  borderRadius = 12,
  fallbackSrc = '/job_card_banner.jpg',
  showOverlayText = true,
  className = '',
  style = {},
  children,
}) => {
  const [customFailed, setCustomFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const effectiveHeight = typeof height === 'number' ? `${height}px` : height;
  const effectiveBrandColor = resolveBrandColor(brandColor);
  const fallbackStyle = getDefaultBannerStyle(effectiveBrandColor, name);

  // 1. If custom banner is provided and hasn't failed
  if (src && !customFailed) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: effectiveHeight,
          borderRadius: `${borderRadius}px`,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#0f172a',
          ...style,
        }}
      >
        <img
          src={src}
          alt={`${name} Banner`}
          onError={() => setCustomFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {children}
      </div>
    );
  }

  // 2. Fall back to standard job workspace banner
  if (fallbackSrc && !fallbackFailed) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: effectiveHeight,
          borderRadius: `${borderRadius}px`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#111827',
          ...style,
        }}
      >
        <img
          src={fallbackSrc}
          alt="Workspace Banner"
          onError={() => setFallbackFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {showOverlayText && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '48px',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <span
              style={{
                fontFamily: "'Dancing Script', 'Caveat', 'Playfair Display', cursive, sans-serif",
                fontSize: '28px',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '0.5px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.75)',
                lineHeight: 1.15,
              }}
            >
              Aspire. Learn. Grow.
            </span>
            <span
              style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontSize: '9px',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.92)',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                marginTop: '4px',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.75)',
              }}
            >
              BUILDING A BRIGHTER TOMORROW
            </span>
          </div>
        )}
        {children}
      </div>
    );
  }

  // 3. Fallback placeholder gradient banner
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: effectiveHeight,
        borderRadius: `${borderRadius}px`,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-color, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...fallbackStyle,
        ...style,
      }}
    >
      {/* Decorative HirePulse watermark graphic */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0.12,
          pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`hp-grid-${name.replace(/\s+/g, '')}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hp-grid-${name.replace(/\s+/g, '')})`} />
      </svg>

      <span
        style={{
          position: 'relative',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: effectiveBrandColor,
          opacity: 0.9,
        }}
      >
        {name}
      </span>
      {children}
    </div>
  );
};
