/**
 * Utility functions for handling Resume/CV PDF validation, formatting, viewing, and downloading.
 */

/**
 * Normalizes any backend or absolute resume URL to a relative /media/ URL
 * so that it is properly routed through the application's reverse proxy.
 *
 * @param {string} url - The raw resume URL from backend
 * @returns {string} Normalized URL path
 */
export const formatResumeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  // Extract from /media/ if it contains full domain (e.g. http://localhost/media/... or http://backend:8000/media/...)
  const mediaIdx = url.indexOf('/media/');
  if (mediaIdx !== -1) {
    return url.substring(mediaIdx);
  }

  return url;
};

/**
 * Validates that an uploaded file is strictly a PDF under 5MB.
 *
 * @param {File} file - The file selected by the user
 * @returns {{ valid: boolean, error: string | null }}
 */
export const validatePdfFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // 1. Check file size (5MB maximum)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Resume file size cannot exceed 5MB. Please choose a smaller PDF file.',
    };
  }

  // 2. Check file extension (.pdf only)
  const filename = file.name || '';
  const isPdfExtension = filename.toLowerCase().endsWith('.pdf');
  if (!isPdfExtension) {
    return {
      valid: false,
      error: 'Only PDF files (.pdf) are allowed. Please select a valid PDF document.',
    };
  }

  // 3. Check MIME type (application/pdf)
  if (file.type && file.type !== 'application/pdf') {
    return {
      valid: false,
      error: `Invalid file type (${file.type}). Resumes must be in PDF format (application/pdf).`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Opens a resume PDF file in a new browser tab for viewing/previewing.
 *
 * @param {string} url - The resume URL
 */
export const viewResume = (url) => {
  if (!url) {
    console.warn('Cannot view resume: URL is missing.');
    return;
  }
  const formattedUrl = formatResumeUrl(url);
  window.open(formattedUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Triggers a download of the resume PDF file as a genuine attachment.
 *
 * @param {string} url - The resume URL
 * @param {string} fallbackFilename - Name to assign to the downloaded file
 */
export const downloadResume = async (url, fallbackFilename = 'Resume.pdf') => {
  if (!url) {
    console.warn('Cannot download resume: URL is missing.');
    return;
  }

  const formattedUrl = formatResumeUrl(url);

  // Derive a clean filename if not specified
  let filename = fallbackFilename;
  try {
    const segments = formattedUrl.split('/');
    const lastSeg = segments[segments.length - 1]?.split('?')[0];
    if (lastSeg && lastSeg.toLowerCase().endsWith('.pdf')) {
      filename = decodeURIComponent(lastSeg);
    }
  } catch {
    // Keep fallback
  }

  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }

  try {
    const response = await fetch(formattedUrl);
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = blobUrl;
    tempLink.download = filename;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Direct download failed, falling back to window.open:', err);
    // Fallback: Open in new tab so user can save manually
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  }
};
