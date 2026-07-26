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

export function formatAU(val) {
  return `${val.toFixed(3)} AU`;
}
