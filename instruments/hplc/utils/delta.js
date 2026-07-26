/**
 * delta.js - Comparison Trend & Delta Formatting Helpers
 */

export function calculateDelta(valCurrent, valPrevious) {
  if (valPrevious === undefined || valPrevious === null) return { diff: 0, pct: 0, text: "—" };
  const diff = valCurrent - valPrevious;
  const pct = valPrevious !== 0 ? (diff / valPrevious) * 100 : 0;
  return { diff, pct };
}

export function formatResolutionTrend(currRs, prevRs) {
  if (prevRs === undefined || prevRs === null) return { text: "—", class: "" };
  const diff = currRs - prevRs;
  if (Math.abs(diff) < 0.05) return { text: "⚪ Unchanged", class: "neutral" };
  if (diff > 0) return { text: `🟢 +${diff.toFixed(2)} (Improved)`, class: "positive" };
  return { text: `🔴 ${diff.toFixed(2)} (Worse)`, class: "negative" };
}

export function formatPressureTrend(currP, prevP) {
  if (prevP === undefined || prevP === null) return { text: "—", class: "" };
  const diff = currP - prevP;
  if (Math.abs(diff) < 2) return { text: "⚪ Unchanged", class: "neutral" };
  if (diff < 0) return { text: `🟢 ${Math.round(diff)} bar (Lower Pressure)`, class: "positive" };
  return { text: `⚡ +${Math.round(diff)} bar (Higher Pressure)`, class: "warning" };
}

export function formatTimeTrend(currT, prevT) {
  if (prevT === undefined || prevT === null) return { text: "—", class: "" };
  const diff = currT - prevT;
  if (Math.abs(diff) < 0.1) return { text: "⚪ Unchanged", class: "neutral" };
  if (diff < 0) return { text: `🟢 ${diff.toFixed(1)} min (Faster)`, class: "positive" };
  return { text: `⏱ +${diff.toFixed(1)} min (Slower)`, class: "neutral" };
}
