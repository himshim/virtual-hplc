/**
 * math.js - Common Math Helper Utilities
 */

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function round(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}
