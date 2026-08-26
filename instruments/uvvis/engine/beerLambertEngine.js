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
 * Advanced Features:
 *  - Savitzky-Golay numerical derivative computation (1st & 2nd derivative)
 *  - Photometric Twyman-Lothian noise modeling (shot noise + dark current)
 *  - pH ionization equilibrium (Henderson-Hasselbalch)
 *  - Solvent UV cutoff exponential attenuation
 */

import { UvVisDataRegistry, CHROMOPHORE_DATABASE as COMPOUND_DB, SOLVENT_DATABASE as SOLVENT_DB } from '../data/registry.js';

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
   * @param {number} strayLight         - default 0.0005
   * @param {Object|null} rng           - SimulationRandom (seeded PRNG, not Math.random)
   * @param {string} noiseMode          - 'none' | 'standard' | 'advanced'
   * @param {string} solventKey         - for blank subtraction on demand
   * @param {string} cuvetteMaterial    - 'quartz' (190-800nm) vs 'glass' (absorbs below 340nm)
   * @param {number} pH                 - solution pH (default 7.0)
   */
  static computeAbsorbanceAtLambda(
    sampleKey, lambda, concentrationUgMl, pathLengthCm = 1.0,
    strayLight = 0.0005, rng = null, noiseMode = 'none', solventKey = 'water',
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

    // Optical Path Transmission: Glass cuvette absorbs 99% of UV light (T_glass = 0.01) below 340 nm
    const tGlass = (cuvetteMaterial === 'glass' && lambda < 340) ? 0.01 : 1.0;
    const T_sample = Math.pow(10, -idealA) * tGlass;
    const T_obs    = T_sample + strayLight;

    // Twyman-Lothian Physical Noise Model (Photon Shot Noise ~ sqrt(T) + Dark Current Noise)
    let noise = 0;
    if (noiseMode !== 'none' && rng) {
      const noiseMultiplier = noiseMode === 'advanced' ? 0.006 : 0.002;
      const sigmaDark = 0.0003;
      const sigmaShot = Math.sqrt(Math.max(0.0001, T_obs)) * noiseMultiplier;
      const sigmaT = Math.sqrt(sigmaDark * sigmaDark + sigmaShot * sigmaShot);
      
      const randomNormal = (rng.next() + rng.next() + rng.next() - 1.5) * 1.63; // approx Gaussian N(0,1)
      const deltaT = randomNormal * sigmaT;
      const noisyT = Math.max(1e-4, T_obs + deltaT);
      noise = -Math.log10(noisyT) - (-Math.log10(T_obs));
    }

    const sampleAbs = Math.max(0, -Math.log10(T_obs) + noise);
    const blankAbs  = BeerLambertEngine.computeBlankAbsorbance(solventKey, lambda);

    return {
      wavelength:    lambda,
      absorbance:    Math.max(0, sampleAbs - blankAbs),
      transmittance: Math.min(100, Math.max(0, T_obs * 100)),
    };
  }

  /**
   * Savitzky-Golay Numerical Derivative Calculation (1st & 2nd Order).
   * 1st derivative: eliminates constant baseline smudges.
   * 2nd derivative: resolves overlapping bands with negative minimum at peak apex.
   * @param {Array<{x: number, y: number}>} points - raw spectrum data
   * @param {number} order - 1 for 1st derivative (dA/dλ), 2 for 2nd derivative (d²A/dλ²)
   * @returns {Array<{x: number, y: number}>} derivative spectrum points
   */
  static computeDerivativeSpectrum(points = [], order = 1) {
    if (!points || points.length < 5) return points;

    const n = points.length;
    const derivPoints = [];
    const deltaLambda = points.length > 1 ? (points[1].x - points[0].x) : 1;

    // 5-point quadratic Savitzky-Golay convolution kernels
    const c1 = [-2, -1, 0, 1, 2]; // normalization factor 10 * deltaLambda
    const norm1 = 10 * deltaLambda;

    const c2 = [2, -1, -2, -1, 2]; // normalization factor 7 * (deltaLambda^2)
    const norm2 = 7 * Math.pow(deltaLambda, 2);

    for (let i = 0; i < n; i++) {
      const lambda = points[i].x;

      if (i < 2 || i >= n - 2) {
        // Boundary handling: simple forward/backward finite differences
        if (order === 1) {
          const dy = i < n - 1 ? (points[i + 1].y - points[i].y) / deltaLambda : (points[i].y - points[i - 1].y) / deltaLambda;
          derivPoints.push({ x: lambda, y: Math.round(dy * 100000) / 100000 });
        } else {
          derivPoints.push({ x: lambda, y: 0 });
        }
        continue;
      }

      if (order === 1) {
        const sum = c1[0] * points[i - 2].y + c1[1] * points[i - 1].y + c1[2] * points[i].y + c1[3] * points[i + 1].y + c1[4] * points[i + 2].y;
        const dy = sum / norm1;
        derivPoints.push({ x: lambda, y: Math.round(dy * 100000) / 100000 });
      } else if (order === 2) {
        const sum = c2[0] * points[i - 2].y + c2[1] * points[i - 1].y + c2[2] * points[i].y + c2[3] * points[i + 1].y + c2[4] * points[i + 2].y;
        const d2y = sum / norm2;
        derivPoints.push({ x: lambda, y: Math.round(d2y * 100000) / 100000 });
      } else {
        derivPoints.push({ x: lambda, y: points[i].y });
      }
    }

    return derivPoints;
  }

  // ── Backward-compatible bulk API (calibration tab + static renders) ──────

  /**
   * Full-spectrum sweep 200–800 nm (synchronous, used by calibration and assay tools).
   */
  static calculateSpectrum(sampleKey, concentrationUgMl, pathLengthCm = 1.0, strayLight = 0.0005, noiseMode = 'none', pH = 7.0) {
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
   */
  static calculateLinearRegression(pts = []) {
    if (pts.length < 2) return { slope: 0, intercept: 0, rSquared: 0, equationStr: 'A = 0.0000 · c + 0.0000' };
    const n = pts.length, sX = pts.reduce((s, p) => s + p.conc, 0), sY = pts.reduce((s, p) => s + p.abs, 0);
    const sXY = pts.reduce((s, p) => s + p.conc * p.abs, 0), sXX = pts.reduce((s, p) => s + p.conc ** 2, 0);
    const slope = (n * sXY - sX * sY) / (n * sXX - sX ** 2 || 1);
    const intercept = (sY - slope * sX) / n;
    const meanY = sY / n, ssTot = pts.reduce((s, p) => s + (p.abs - meanY) ** 2, 0);
    const ssRes = pts.reduce((s, p) => s + (p.abs - (slope * p.conc + intercept)) ** 2, 0);
    const r2 = ssTot ? Math.max(0, 1 - ssRes / ssTot) : 0;
    const sign = intercept >= 0 ? '+' : '-';
    return {
      slope, intercept,
      rSquared: Math.min(1.0, r2),
      equationStr: `A = ${slope.toFixed(4)} · c ${sign} ${Math.abs(intercept).toFixed(4)}`
    };
  }

  /** Back-calculate concentration from absorbance via calibration line. */
  static estimateUnknownConcentration(abs, slope, intercept) {
    if (slope === 0) return 0;
    return Math.max(0, (abs - intercept) / slope);
  }
}
