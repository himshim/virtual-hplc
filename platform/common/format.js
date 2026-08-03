/**
 * format.js — Shared Telemetry & Unit Formatting Utilities (Level B Infrastructure)
 */

export function formatPressure(bar, digits = 1) {
  if (bar === null || bar === undefined || isNaN(bar)) return '0.0 bar';
  return `${Number(bar).toFixed(digits)} bar`;
}

export function formatTime(minutes, digits = 2) {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '0.00 min';
  return `${Number(minutes).toFixed(digits)} min`;
}

export function formatAbsorbance(au, digits = 4) {
  if (au === null || au === undefined || isNaN(au)) return '0.0000 AU';
  return `${Number(au).toFixed(digits)} AU`;
}

export function formatSignal(pa, digits = 2) {
  if (pa === null || pa === undefined || isNaN(pa)) return '0.00 pA';
  return `${Number(pa).toFixed(digits)} pA`;
}
