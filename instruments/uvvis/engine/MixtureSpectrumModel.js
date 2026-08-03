/**
 * MixtureSpectrumModel.js — Decoupled Binary Mixture Spectrum Transformer
 *
 * Implements Beer-Lambert additivity for multi-component solutions:
 *   A_total(λ) = A_CompA(λ) + A_CompB(λ) = [ε_A(λ)*c_A + ε_B(λ)*c_B] * l
 */

import { BeerLambertEngine } from './beerLambertEngine.js';

export class MixtureSpectrumModel {
  /**
   * Compute combined binary mixture spectrum points over a scan range.
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
          compA, lambda, concA, path, 0.001, null, 'none', solvent, material, pH
        );
        absA = ptA.absorbance;
      }

      if (concB > 0) {
        const ptB = BeerLambertEngine.computeAbsorbanceAtLambda(
          compB, lambda, concB, path, 0.001, null, 'none', solvent, material, pH
        );
        absB = ptB.absorbance;
      }

      const totalAbs = Math.round((absA + absB) * 10000) / 10000;
      points.push({ x: lambda, y: totalAbs });
    }

    return points;
  }
}
