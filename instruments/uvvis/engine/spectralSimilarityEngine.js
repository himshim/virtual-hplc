/**
 * spectralSimilarityEngine.js — Normalized Spectral Comparison & Library Matching Engine
 *
 * Consumes final observed spectra and reference spectra to calculate:
 *   - Vector-normalized Pearson Correlation Coefficient (r)
 *   - Normalized Root Mean Square Error (RMSE)
 *   - Match Score % & Qualitative Category (EXCELLENT, GOOD, MODERATE, POOR)
 *   - Difference Spectrum Curve: A_diff(λ) = A_obs(λ) - A_ref(λ)
 *   - Educational "whyScoreChanged" breakdown
 */

import { BeerLambertEngine } from './beerLambertEngine.js';

export class SpectralSimilarityEngine {
  /**
   * Compare an observed spectrum array against a reference compound spectrum.
   * @param {Array<{x: number, y: number}>} observedPoints - array of {x: lambda, y: absorbance}
   * @param {string} referenceKey - reference compound key in library
   * @returns {Object} comparison analysis result object
   */
  static compareSpectra(observedPoints = [], referenceKey = 'paracetamol') {
    if (!observedPoints || observedPoints.length === 0) {
      return {
        matchPercent: 0,
        category: 'POOR',
        pearsonR: 0,
        rmse: 1.0,
        differenceCurve: [],
        reasons: ['No observed spectrum data available']
      };
    }

    // 1. Generate reference spectrum over the same wavelength grid
    const refRaw = BeerLambertEngine.calculateSpectrum(referenceKey, 15.0);
    const refMap = new Map(refRaw.spectrumData.map(pt => [pt.wavelength, pt.absorbance]));

    const wavelengths = observedPoints.map(p => p.x);
    const obsValues   = observedPoints.map(p => p.y);
    const refValues   = wavelengths.map(λ => refMap.get(λ) || 0.0);

    // 2. Compute Difference Spectrum: A_diff(λ) = A_obs(λ) - A_ref(λ)
    const differenceCurve = wavelengths.map((λ, idx) => ({
      x: λ,
      y: Math.round((obsValues[idx] - refValues[idx]) * 10000) / 10000
    }));

    // 3. Vector Normalization (Scale-invariant shape comparison)
    const normObs = this._vectorNormalize(obsValues);
    const normRef = this._vectorNormalize(refValues);

    // 4. Calculate Pearson Correlation Coefficient (r)
    const pearsonR = this._calcPearsonR(normObs, normRef);

    // 5. Calculate Normalized Root Mean Square Error (RMSE)
    const rmse = this._calcRMSE(normObs, normRef);

    // 6. Match Score % Calculation
    const matchScore = Math.max(0, Math.min(100, Math.round(pearsonR * (1 - 0.4 * rmse) * 1000) / 10));

    // 7. Qualitative Category Assessment
    let category = 'POOR';
    if (matchScore >= 95.0)      category = 'EXCELLENT';
    else if (matchScore >= 85.0) category = 'GOOD';
    else if (matchScore >= 70.0) category = 'MODERATE';

    // 8. Educational "whyScoreChanged" Breakdown Reasons
    const reasons = [];
    if (matchScore < 95.0) {
      const obsMaxIdx = obsValues.indexOf(Math.max(...obsValues));
      const refMaxIdx = refValues.indexOf(Math.max(...refValues));
      const shiftNm   = wavelengths[obsMaxIdx] - wavelengths[refMaxIdx];

      if (Math.abs(shiftNm) >= 2) {
        reasons.push(`Peak λmax shifted by ${shiftNm > 0 ? '+' : ''}${shiftNm} nm vs reference.`);
      }

      const visObsBase = obsValues.slice(-10).reduce((a, b) => a + b, 0) / 10;
      if (visObsBase > 0.04) {
        reasons.push('Elevated baseline noise or cuvette smudge detected.');
      }

      if (pearsonR < 0.90) {
        reasons.push('Significant spectral shape mismatch (secondary component absorption or interference).');
      }
    } else {
      reasons.push('Excellent match: Spectral curve shape aligns closely with reference standard.');
    }

    return {
      referenceKey,
      matchPercent: matchScore,
      category,
      pearsonR: Math.round(pearsonR * 10000) / 10000,
      rmse: Math.round(rmse * 10000) / 10000,
      differenceCurve,
      reasons
    };
  }

  static _vectorNormalize(arr = []) {
    const sumSq = arr.reduce((sum, v) => sum + v * v, 0);
    const mag   = Math.sqrt(sumSq) || 1.0;
    return arr.map(v => v / mag);
  }

  static _calcPearsonR(x = [], y = []) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num  += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : Math.max(-1, Math.min(1, num / den));
  }

  static _calcRMSE(x = [], y = []) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 1.0;
    let sumSqDiff = 0;
    for (let i = 0; i < n; i++) {
      const diff = x[i] - y[i];
      sumSqDiff += diff * diff;
    }
    return Math.sqrt(sumSqDiff / n);
  }
}
