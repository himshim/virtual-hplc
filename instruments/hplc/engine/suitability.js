import { getDeadTime } from './retention.js';
import { getCriteria } from './criteria.js';
import { SystemSuitability } from '../models/SystemSuitability.js';

/**
 * Calculates peak width parameters based on Gaussian variance (sigma).
 * - Base Width Wb = 4 * sigma (95.4% peak area boundary)
 * - Half-Height Width W0.5 = 2.3548 * sigma
 * - 5% Height Width W0.05 = 4.30 * sigma (USP Tailing boundary)
 */
export function calculatePeakWidths(sigma) {
  return {
    widthBase: 4 * sigma,
    widthHalf: 2.3548 * sigma,
    widthFivePercent: 4.8955 * sigma // Theoretical Gaussian width at 5% height: 2 * sqrt(2 * ln(20)) * sigma
  };
}

/**
 * Calculates Capacity Factor (k').
 * k' = (tR - t0) / t0
 */
export function calculateCapacityFactor(tR, t0) {
  const safeT0 = Math.max(0.01, t0);
  return (tR - safeT0) / safeT0;
}

/**
 * Calculates Theoretical Plate Count (N).
 * 
 * Pharmacopeial Formula:
 * N = 16 * (tR / Wb)^2
 * 
 * Since Wb = 4 * sigma for a Gaussian peak:
 * N = 16 * (tR / (4 * sigma))^2 = 16 * (tR^2 / (16 * sigma^2)) = (tR / sigma)^2
 * 
 * Both formulas are mathematically equivalent for ideal Gaussian peaks.
 */
export function calculatePlates(tR, sigma) {
  const safeSigma = Math.max(0.0001, sigma);
  return Math.pow(tR / safeSigma, 2);
}

/**
 * Calculates Chromatographic Resolution (Rs) between two adjacent peaks.
 * Rs = (tR2 - tR1) / [ 2 * (sigma1 + sigma2) ] = 2 * (tR2 - tR1) / (Wb1 + Wb2)
 */
export function calculateResolution(tR1, sigma1, tR2, sigma2) {
  const denom = 2 * (sigma1 + sigma2);
  if (denom <= 0) return 0;
  return (tR2 - tR1) / denom;
}

/**
 * Calculates Selectivity Factor (alpha) between two adjacent peaks.
 * alpha = k'2 / k'1
 */
export function calculateSelectivity(kPrime1, kPrime2) {
  const safeK1 = Math.max(0.001, kPrime1);
  return kPrime2 / safeK1;
}

/**
 * Evaluates System Suitability and compiles data-driven educational diagnostics.
 * @param {Array<Object>} peaks - Sorted array of Peak data objects
 * @param {number} flowRate - mL/min
 * @param {string} [profileKey="USP"] - Criteria profile key
 * @returns {SystemSuitability}
 */
export function evaluateSystemSuitability(peaks, flowRate, profileKey = "USP") {
  const criteria = getCriteria(profileKey);
  const t0 = getDeadTime(flowRate);

  const passedChecks = [];
  const failedChecks = [];
  const diagnostics = [];
  let totalScore = 100;

  if (!peaks || peaks.length === 0) {
    return new SystemSuitability({
      score: 0,
      status: "FAILED",
      criteriaUsed: criteria.name,
      warnings: ["No peaks detected in chromatogram run."],
      methodQuality: "No Run Data"
    });
  }

  // 1. Capacity Factor (k') Evaluation
  peaks.forEach((p, idx) => {
    const k = calculateCapacityFactor(p.tR, t0);
    p.kPrime = k;
    p.plates = calculatePlates(p.tR, p.sigma);

    if (k < criteria.capacityMin) {
      totalScore -= 15;
      failedChecks.push(`Peak ${idx + 1} (${p.compound}): k' (${k.toFixed(2)}) < ${criteria.capacityMin}`);
      diagnostics.push({
        rule: "CAPACITY_TOO_LOW",
        compound: p.compound,
        cause: `Solute elutes too close to column void volume (t0 = ${t0.toFixed(2)} min).`,
        recommendation: "Decrease organic solvent %B to increase hydrophobic retention on C18 column."
      });
    } else if (k > criteria.capacityMax) {
      totalScore -= 10;
      failedChecks.push(`Peak ${idx + 1} (${p.compound}): k' (${k.toFixed(2)}) > ${criteria.capacityMax}`);
      diagnostics.push({
        rule: "CAPACITY_TOO_HIGH",
        compound: p.compound,
        cause: "Solute is excessively retained, leading to unnecessarily long run times and peak broadening.",
        recommendation: "Increase organic solvent %B to accelerate elution."
      });
    } else {
      passedChecks.push(`Peak ${idx + 1} (${p.compound}): Capacity factor k' = ${k.toFixed(2)} (Ideal: ${criteria.capacityMin}-${criteria.capacityMax})`);
    }

    // 2. Plate Count (N) Evaluation
    if (p.plates < criteria.platesMin) {
      totalScore -= 15;
      failedChecks.push(`Peak ${idx + 1} (${p.compound}): Plates N (${Math.round(p.plates)}) < ${criteria.platesMin}`);
      diagnostics.push({
        rule: "PLATES_LOW",
        compound: p.compound,
        cause: "Column efficiency is insufficient at current flow rate.",
        recommendation: "Adjust flow rate towards optimal Van Deemter linear velocity to increase theoretical plates."
      });
    } else {
      passedChecks.push(`Peak ${idx + 1} (${p.compound}): Plate count N = ${Math.round(p.plates)} (USP target > ${criteria.platesMin})`);
    }
  });

  // 3. Pairwise Resolution (Rs) and Selectivity (alpha) Evaluation
  if (peaks.length > 1) {
    for (let i = 1; i < peaks.length; i++) {
      const prev = peaks[i - 1];
      const curr = peaks[i];

      const Rs = calculateResolution(prev.tR, prev.sigma, curr.tR, curr.sigma);
      const alpha = calculateSelectivity(prev.kPrime, curr.kPrime);

      curr.resolution = Rs;
      curr.selectivity = alpha;

      if (Rs < criteria.resolutionMin) {
        totalScore -= 25;
        failedChecks.push(`Pair (${prev.compound} / ${curr.compound}): Resolution Rs (${Rs.toFixed(2)}) < ${criteria.resolutionMin}`);
        diagnostics.push({
          rule: "RESOLUTION_INSUFFICIENT",
          compound: `${prev.compound} + ${curr.compound}`,
          cause: `Co-elution hazard. Peak separation Rs = ${Rs.toFixed(2)} does not meet baseline resolution requirement (Rs >= ${criteria.resolutionMin}).`,
          recommendation: "Decrease mobile phase organic %B to widen retention time gap between peaks."
        });
      } else {
        passedChecks.push(`Pair (${prev.compound} / ${curr.compound}): Resolution Rs = ${Rs.toFixed(2)} (Baseline separated >= ${criteria.resolutionMin})`);
      }
    }
  }

  // Determine overall method status
  const finalScore = Math.max(0, totalScore);
  let status = "EXCELLENT";
  let methodQuality = "96%-100% Excellent Method";

  if (finalScore < 60 || failedChecks.some(c => c.includes("Resolution"))) {
    status = "FAILED";
    methodQuality = "Failed System Suitability";
  } else if (finalScore < 80) {
    status = "MARGINAL";
    methodQuality = "Marginal Method";
  } else if (finalScore < 95) {
    status = "GOOD";
    methodQuality = "Good Method";
  } else {
    status = "EXCELLENT";
    methodQuality = "Excellent Method";
  }

  return new SystemSuitability({
    score: finalScore,
    status,
    criteriaUsed: criteria.name,
    passedChecks,
    failedChecks,
    diagnostics,
    methodQuality,
    timestamp: new Date().toISOString()
  });
}
