/**
 * formatting.js - Common Display Formatting Helpers
 */

/**
 * Formats time in minutes to mm:ss format.
 * @param {number} minutes
 * @returns {string} Formatted string "mm:ss"
 */
export function formatTimeMinutes(minutes) {
  if (isNaN(minutes) || minutes < 0) return "00:00";
  const totalSeconds = Math.floor(minutes * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatPressure(bar) {
  return `${Math.round(bar)} bar`;
}

export function formatPressureDecimal(bar, decimals = 1) {
  if (isNaN(bar)) return '0.0 bar';
  return `${Number(bar).toFixed(decimals)} bar`;
}

export function formatTimeDecimal(minutes, decimals = 2) {
  if (isNaN(minutes)) return '0.00 min';
  return `${Number(minutes).toFixed(decimals)} min`;
}

export function formatWavelength(nm) {
  if (isNaN(nm)) return '— nm';
  return `${Math.round(nm)} nm`;
}

export function formatFlowRate(flow) {
  if (isNaN(flow)) return '0.00 mL/min';
  return `${Number(flow).toFixed(2)} mL/min`;
}

export function formatAU(val) {
  if (isNaN(val)) return '0.000 AU';
  return `${val.toFixed(3)} AU`;
}

