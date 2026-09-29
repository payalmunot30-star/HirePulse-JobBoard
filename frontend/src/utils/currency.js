/**
 * Indian Rupee (INR) and Indian Numbering System formatting utilities.
 */

/**
 * Format a number or numeric string into Indian Rupee format.
 * Uses the Indian numbering system: lakhs and crores (e.g. 400000 -> "₹4,00,000").
 *
 * @param {number|string} amount - The amount to format
 * @param {boolean} includeSymbol - Whether to include the ₹ symbol (default: true)
 * @returns {string} Formatted currency string
 */
export const formatINR = (amount, includeSymbol = true) => {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return '';
  }

  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absNum);

  const prefix = includeSymbol ? '₹' : '';
  return isNegative ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
};

/**
 * Format minimum and maximum salary into an Indian Rupee range string.
 * e.g. (400000, 600000) -> "₹4,00,000 – ₹6,00,000"
 *
 * @param {number|string} min - Minimum salary
 * @param {number|string} max - Maximum salary
 * @returns {string}
 */
export const formatSalaryRange = (min, max) => {
  const hasMin = min !== null && min !== undefined && min !== '' && !isNaN(Number(min));
  const hasMax = max !== null && max !== undefined && max !== '' && !isNaN(Number(max));

  if (hasMin && hasMax) {
    return `${formatINR(min)} – ${formatINR(max)}`;
  } else if (hasMin) {
    return `From ${formatINR(min)}`;
  } else if (hasMax) {
    return `Up to ${formatINR(max)}`;
  }
  return 'Not specified';
};
