export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTitle = (str) => {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (!trimmed) return '';
  return trimmed
    .replace(/\b([a-z])/gi, (match) => match.toUpperCase())
    .replace(/\bHirepulse\b/g, 'HirePulse');
};

export const formatCompanyName = (str) => {
  if (!str) return '';
  const trimmed = String(str).trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'hirepulse') return 'HirePulse';
  return formatTitle(trimmed);
};

export const normalizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Fix internal docker backend hostnames so browser can fetch images
  if (trimmed.includes('//backend:8000') || trimmed.includes('//backend/')) {
    return trimmed.replace('//backend:8000', '//localhost:8000').replace('//backend/', '//localhost:8000/');
  }
  return trimmed;
};

