/**
 * MixtureSpectrumModel.js — Multi-Component Mixture Simulation & Matrix Deconvolution
 *
 * Implements Beer-Lambert additivity:
 *   A_total(λ) = Σ A_i(λ) = Σ [ε_i(λ) · c_i · l]
 *
 * Chemometrics & Deconvolution:
 *  - Classical Least Squares (CLS) matrix regression solver
 *  - Closed-form 2-wavelength simultaneous equation solver for binary mixtures (e.g. Paracetamol + Caffeine)
 */

import { BeerLambertEngine, CHROMOPHORE_DATABASE } from './beerLambertEngine.js';

export class MixtureSpectrumModel {
  /**
   * Compute combined binary/multi mixture spectrum points over a scan range.
   * @param {Object} mixConfig - { compA, concA, compB, concB, scanStart, scanEnd, pathCm, solventKey, cuvetteMaterial, pH }
   * @returns {Array<{x: number, y: number}>} array of raw mixture absorbance points {x: lambda, y: absorbance}
   */
  static computeMixtureSpectrum(mixConfig = {}) {
    const compA    = mixConfig.compA || 'paracetamol';
    const concA    = Math.max(0.0, mixConfig.concA ?? 15.0);
    const compB    = mixConfig.compB || 'caffeine';
    const concB    = Math.max(0.0, mixConfig.concB ?? 0.0);
    const start    = mixConfig.scanStart || 200;
    const end      = mixConfig.scanEnd || 800;
    const path     = mixConfig.pathCm || 1.0;
    const solvent  = mixConfig.solventKey || 'water';
    const material = mixConfig.cuvetteMaterial || 'quartz';
    const pH       = mixConfig.pH || 7.0;

    const points = [];

    for (let lambda = start; lambda <= end; lambda++) {
      let absA = 0, absB = 0;

      if (concA > 0) {
        const ptA = BeerLambertEngine.computeAbsorbanceAtLambda(
          compA, lambda, concA, path, 0.0005, null, 'none', solvent, material, pH
        );
        absA = ptA.absorbance;
      }

      if (concB > 0) {
        const ptB = BeerLambertEngine.computeAbsorbanceAtLambda(
          compB, lambda, concB, path, 0.0005, null, 'none', solvent, material, pH
        );
        absB = ptB.absorbance;
      }

      const totalAbs = Math.round((absA + absB) * 10000) / 10000;
      points.push({ x: lambda, y: totalAbs });
    }

    return points;
  }

  /**
   * Closed-form 2-wavelength simultaneous equation solver for binary formulations.
   * Solves:
   *   A(λ1) = ε_A1·c_A·l + ε_B1·c_B·l
   *   A(λ2) = ε_A2·c_A·l + ε_B2·c_B·l
   *
   * @param {number} lambda1 - 1st wavelength (e.g. 243 nm for Paracetamol)
   * @param {number} lambda2 - 2nd wavelength (e.g. 273 nm for Caffeine)
   * @param {number} abs1    - observed absorbance at λ1
   * @param {number} abs2    - observed absorbance at λ2
   * @param {string} compAKey
   * @param {string} compBKey
   * @param {number} pathCm
   * @param {number} pH
   * @returns {Object} { concA_ug_ml, concB_ug_ml, determinant, isWellConditioned }
   */
  static solveBinarySimultaneousEquations(lambda1, lambda2, abs1, abs2, compAKey = 'paracetamol', compBKey = 'caffeine', pathCm = 1.0, pH = 7.0) {
    const compA = CHROMOPHORE_DATABASE[compAKey] ?? CHROMOPHORE_DATABASE.paracetamol;
    const compB = CHROMOPHORE_DATABASE[compBKey] ?? CHROMOPHORE_DATABASE.caffeine;

    // Specific absorptivities E(1%, 1cm) or molar absorptivity converted to (L / (g * cm))
    // A = a * c(g/L) * l = a * (c_ug_ml * 1e-3) * l
    // epsilon [L/(mol*cm)], mw [g/mol] -> a [L/(g*cm)] = epsilon / mw
    const epsA1 = BeerLambertEngine.computeEpsilonAtLambda(compA, lambda1, pH);
    const epsA2 = BeerLambertEngine.computeEpsilonAtLambda(compA, lambda2, pH);
    const epsB1 = BeerLambertEngine.computeEpsilonAtLambda(compB, lambda1, pH);
    const epsB2 = BeerLambertEngine.computeEpsilonAtLambda(compB, lambda2, pH);

    const aA1 = (epsA1 / compA.mw) * 1e-3; // absorbance per (ug/mL) per cm
    const aA2 = (epsA2 / compA.mw) * 1e-3;
    const aB1 = (epsB1 / compB.mw) * 1e-3;
    const aB2 = (epsB2 / compB.mw) * 1e-3;

    const det = (aA1 * aB2 - aA2 * aB1) * Math.pow(pathCm, 2);

    if (Math.abs(det) < 1e-12) {
      return { concA_ug_ml: 0, concB_ug_ml: 0, determinant: det, isWellConditioned: false };
    }

    const cA = (aB2 * abs1 - aB1 * abs2) / (det / pathCm);
    const cB = (aA1 * abs2 - aA2 * abs1) / (det / pathCm);

    return {
      concA_ug_ml: Math.max(0, Math.round(cA * 100) / 100),
      concB_ug_ml: Math.max(0, Math.round(cB * 100) / 100),
      determinant: det,
      isWellConditioned: true,
      absorptivities: { aA1, aA2, aB1, aB2 }
    };
  }

  /**
   * Classical Least Squares (CLS) Multi-Component Solver across a full spectral range.
   * Finds c vector minimizing || A_meas - E * c ||^2 via Moore-Penrose pseudo-inverse:
   *   c = (E^T * E)^(-1) * E^T * A_meas
   *
   * @param {Array<{x: number, y: number}>} measuredPoints - observed spectrum
   * @param {Array<string>} componentKeys - array of sample keys (e.g. ['paracetamol', 'caffeine'])
   * @param {number} pathCm
   * @param {number} pH
   * @returns {Object} mapping of componentKey -> estimated concentration in ug/mL
   */
  static solveClassicalLeastSquares(measuredPoints = [], componentKeys = ['paracetamol', 'caffeine'], pathCm = 1.0, pH = 7.0) {
    const K = componentKeys.length;
    const M = measuredPoints.length;
    if (M < K) return {};

    // Build E matrix (M x K) of absorptivity coefficients (abs per ug/mL)
    const E = [];
    for (let i = 0; i < M; i++) {
      const lambda = measuredPoints[i].x;
      const row = [];
      for (let j = 0; j < K; j++) {
        const comp = CHROMOPHORE_DATABASE[componentKeys[j]];
        const eps = BeerLambertEngine.computeEpsilonAtLambda(comp, lambda, pH);
        const a_ug = (eps / comp.mw) * 1e-3 * pathCm;
        row.push(a_ug);
      }
      E.push(row);
    }

    // Compute E^T * E (K x K) and E^T * A (K x 1)
    const EtE = Array.from({ length: K }, () => Array(K).fill(0));
    const EtA = Array(K).fill(0);

    for (let i = 0; i < M; i++) {
      const A_val = measuredPoints[i].y;
      for (let j = 0; j < K; j++) {
        EtA[j] += E[i][j] * A_val;
        for (let k = 0; k < K; k++) {
          EtE[j][k] += E[i][j] * E[i][k];
        }
      }
    }

    // Solve (EtE) * c = EtA for 2x2 or 3x3 systems
    const result = {};
    if (K === 2) {
      const det = EtE[0][0] * EtE[1][1] - EtE[0][1] * EtE[1][0];
      if (Math.abs(det) > 1e-15) {
        const c0 = (EtE[1][1] * EtA[0] - EtE[0][1] * EtA[1]) / det;
        const c1 = (EtE[0][0] * EtA[1] - EtE[1][0] * EtA[0]) / det;
        result[componentKeys[0]] = Math.max(0, Math.round(c0 * 100) / 100);
        result[componentKeys[1]] = Math.max(0, Math.round(c1 * 100) / 100);
      }
    } else {
      // Fallback 1-component
      result[componentKeys[0]] = Math.max(0, Math.round((EtA[0] / (EtE[0][0] || 1)) * 100) / 100);
    }

    return result;
  }
}
