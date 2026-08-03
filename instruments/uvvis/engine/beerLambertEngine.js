/**
 * beerLambertEngine.js — UV-Vis Spectrophotometry Physics Engine
 *
 * Beer-Lambert Law: A(λ) = ε(λ) · c · l
 * Transmittance:   T(λ) = 10^(-A) × 100%
 *
 * Multi-peak Gaussian superposition for realistic spectra:
 *  - Aspirin:  2 bands (230 nm + 276 nm)
 *  - KMnO₄:   5 LMCT vibronic bands (502–590 nm)
 *  - Others:   primary + shoulder
 *
 * Per-tick API: computeAbsorbanceAtLambda() — called by UvVisController.tick()
 * Static API:   calculateSpectrum()         — kept for calibration tab (backward compat)
 */

import { UvVisDataRegistry, CHROMOPHORE_DATABASE as COMPOUND_DB, SOLVENT_DATABASE as SOLVENT_DB } from '../data/registry.js';

// Re-export for legacy import paths (controller, index.html still use CHROMOPHORE_DATABASE)
export const CHROMOPHORE_DATABASE = COMPOUND_DB;
export const SOLVENT_DATABASE     = SOLVENT_DB;

export class BeerLambertEngine {

  // ── Per-tick API (called by UvVisController.tick()) ─────────────────────

  /**
   * Multi-peak Gaussian ε(λ) = Σ εmax · fi · Gauss(λ, λi, σi)
   * Supports Henderson-Hasselbalch pH ionization interpolation when compound defines pKa & peaksHA/peaksA_minus.
   * @param {Object} compound - compound asset object from data registry
   * @param {number} lambda   - wavelength in nm
   * @param {number} pH       - solution pH (default 7.0)
   */
  static computeEpsilonAtLambda(compound, lambda, pH = 7.0) {
    let peaksToUse = compound.peaks;

    if (typeof compound.pKa === 'number' && compound.peaksHA && compound.peaksA_minus) {
      const alpha = 1.0 / (1.0 + Math.pow(10, compound.pKa - pH)); // fractional A- species
      
      const epsHA = compound.peaksHA.reduce((sum, p) => {
        const sigma = p.bandwidth / 2.355;
        const dev   = lambda - p.lambdaMax;
        return sum + compound.epsilonMax * p.epsilonFraction * Math.exp(-(dev * dev) / (2 * sigma * sigma));
      }, 0);

      const epsA = compound.peaksA_minus.reduce((sum, p) => {
        const sigma = p.bandwidth / 2.355;
        const dev   = lambda - p.lambdaMax;
        return sum + compound.epsilonMax * p.epsilonFraction * Math.exp(-(dev * dev) / (2 * sigma * sigma));
      }, 0);

      return (1.0 - alpha) * epsHA + alpha * epsA;
    }

    return peaksToUse.reduce((sum, p) => {
      const sigma = p.bandwidth / 2.355;
      const dev   = lambda - p.lambdaMax;
      return sum + compound.epsilonMax * p.epsilonFraction * Math.exp(-(dev * dev) / (2 * sigma * sigma));
    }, 0);
  }

  /**
   * Solvent blank absorbance at a single wavelength.
   * Exponential rise below UV cutoff — computed on demand, no stored spectrum.
   * @param {string} solventKey
   * @param {number} lambda
   */
  static computeBlankAbsorbance(solventKey, lambda) {
    const s = SOLVENT_DB[solventKey] ?? SOLVENT_DB.water;
    if (lambda >= s.uvCutoff) return s.baselineOffset;
    return s.baselineOffset + Math.exp(s.kBelow * (s.uvCutoff - lambda)) * 0.08;
  }

  /**
   * Single-wavelength absorbance — one call per tick during live sweep.
   * @param {string} sampleKey
   * @param {number} lambda
   * @param {number} concentrationUgMl
   * @param {number} pathLengthCm       - default 1.0
   * @param {number} strayLight         - default 0.001 (0.1%)
   * @param {Object|null} rng           - SimulationRandom (seeded PRNG, not Math.random)
   * @param {string} noiseMode          - 'none' | 'standard' | 'advanced'
   * @param {string} solventKey         - for blank subtraction on demand
   * @param {string} cuvetteMaterial    - 'quartz' (190-800nm) vs 'glass' (absorbs below 340nm)
   * @param {number} pH                 - solution pH (default 7.0)
   */
  static computeAbsorbanceAtLambda(
    sampleKey, lambda, concentrationUgMl, pathLengthCm = 1.0,
    strayLight = 0.001, rng = null, noiseMode = 'none', solventKey = 'water',
    cuvetteMaterial = 'quartz', pH = 7.0
  ) {
    const compound = COMPOUND_DB[sampleKey] ?? COMPOUND_DB.paracetamol;
    const cMolL    = (concentrationUgMl * 1e-3) / compound.mw;
    const epsilon  = BeerLambertEngine.computeEpsilonAtLambda(compound, lambda, pH);
    let idealA     = epsilon * cMolL * pathLengthCm;

    // Educational Modifier: High-concentration non-linear Beer-Lambert bending at A > 1.2
    if (idealA > 1.2) {
      const dev = Math.min(0.8, idealA - 1.2);
      idealA = idealA * (1.0 - 0.05 * dev * dev);
    }

    // Optical Path Transmission: Glass cuvette absorbs 99% of light (T_glass = 0.01) below 340 nm
    const tGlass = (cuvetteMaterial === 'glass' && lambda < 340) ? 0.01 : 1.0;
    const T_sample = Math.pow(10, -idealA) * tGlass;
    const T_obs    = T_sample + strayLight;

    const noiseFactor = { none: 0, standard: 0.008, advanced: 0.025 }[noiseMode] ?? 0;
    // ponytail: SimulationRandom.next() returns [0,1); (rng.next()-0.5)*2 = [-1,1)
    const noise = (noiseFactor > 0 && rng) ? (rng.next() - 0.5) * 2 * noiseFactor * idealA : 0;

    const sampleAbs = Math.max(0, -Math.log10(T_obs) + noise);
    const blankAbs  = BeerLambertEngine.computeBlankAbsorbance(solventKey, lambda);

    return {
      wavelength:    lambda,
      absorbance:    Math.max(0, sampleAbs - blankAbs),
      transmittance: Math.min(100, Math.max(0, T_obs * 100)),
    };
  }

  // ── Backward-compatible bulk API (calibration tab + static renders) ──────

  /**
   * Full-spectrum sweep 200–800 nm (synchronous, used by calibration tab).
   * Now uses multi-peak model internally.
   */
  static calculateSpectrum(sampleKey, concentrationUgMl, pathLengthCm = 1.0, strayLight = 0.001, noiseMode = 'none', pH = 7.0) {
    const compound = COMPOUND_DB[sampleKey] ?? COMPOUND_DB.paracetamol;
    const spectrumData = [];
    let maxAbs = 0, peakLambda = compound.peaks[0].lambdaMax;

    for (let lambda = 200; lambda <= 800; lambda++) {
      const pt = BeerLambertEngine.computeAbsorbanceAtLambda(
        sampleKey, lambda, concentrationUgMl, pathLengthCm, strayLight, null, noiseMode, 'water', 'quartz', pH
      );
      if (pt.absorbance > maxAbs) { maxAbs = pt.absorbance; peakLambda = lambda; }
      spectrumData.push(pt);
    }
    return { compound, spectrumData, lambdaMax: peakLambda, maxAbsorbance: maxAbs, concentrationUgMl, pathLengthCm };
  }

  /**
   * Linear regression (A = m·c + b) and R² for calibration curves.
   * Unchanged from v1.
   */
  static calculateLinearRegression(points = []) {
    if (points.length < 2) {
      return { slope: 0, intercept: 0, rSquared: 0, equationStr: 'A = 0.0000 · c + 0.0000' };
    }
    const n = points.length;
    let sumC = 0, sumA = 0, sumCA = 0, sumC2 = 0;
    points.forEach(p => { sumC += p.conc; sumA += p.abs; sumCA += p.conc * p.abs; sumC2 += p.conc * p.conc; });
    const meanC = sumC / n, meanA = sumA / n;
    const denom = (n * sumC2) - (sumC * sumC);
    const slope = denom !== 0 ? ((n * sumCA) - (sumC * sumA)) / denom : 0;
    const intercept = meanA - slope * meanC;

    let numR = 0, denC = 0, denA = 0;
    points.forEach(p => {
      const dC = p.conc - meanC, dA = p.abs - meanA;
      numR += dC * dA; denC += dC * dC; denA += dA * dA;
    });
    const rSquared = (denC * denA) !== 0 ? Math.pow(numR, 2) / (denC * denA) : 0;
    const sign = intercept >= 0 ? '+' : '-';
    return {
      slope, intercept,
      rSquared: Math.min(1.0, rSquared),
      equationStr: `A = ${slope.toFixed(4)} · c ${sign} ${Math.abs(intercept).toFixed(4)}`,
    };
  }

  /** Back-calculate concentration from absorbance via calibration line. Unchanged. */
  static estimateUnknownConcentration(abs, slope, intercept) {
    if (slope === 0) return 0;
    return Math.max(0, (abs - intercept) / slope);
  }
}
