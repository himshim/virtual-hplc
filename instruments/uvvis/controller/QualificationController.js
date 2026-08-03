/**
 * QualificationController.js — Subsystem wrapper for Pharmacopoeial IQ/OQ Workflows
 */

import { QualificationEngine } from '../engine/QualificationEngine.js';
import { UvVisDataRegistry }  from '../data/registry.js';

export class QualificationController {
  constructor(uvvisController) {
    this._uvvisController = uvvisController;
    this._testResults     = new Map();
  }

  /**
   * Run qualification test for a specific standard key.
   * Standard keys: 'holmium_oxide', 'potassium_dichromate', 'sodium_iodide', 'air_blank'
   */
  runQualificationTest(standardKey) {
    const stdData = UvVisDataRegistry.getStandard(standardKey);
    if (!stdData) throw new Error(`Unknown qualification standard: ${standardKey}`);

    // Pre-calculate full spectrum points using UvVisController's optics & engine
    let spectrumPoints = [];

    if (standardKey === 'air_blank') {
      // Baseline flatness is scanned as blank
      const oldBlank = this._uvvisController._blankMode;
      this._uvvisController._blankMode = true;
      this._uvvisController._precomputeFullSpectrum(null);
      spectrumPoints = [...this._uvvisController._fullSpectrumPoints];
      this._uvvisController._blankMode = oldBlank;
    } else {
      // Simulate standard peaks by setting sample peaks temporarily
      const compound = {
        name: stdData.name,
        mw: 100,
        epsilonMax: standardKey === 'holmium_oxide' ? 10000 : standardKey === 'potassium_dichromate' ? 1785 : 8000,
        peaks: stdData.peaks
      };
      
      const oldSample = this._uvvisController._sampleKey;
      const oldConc   = this._uvvisController._concUgMl;
      
      // Temporarily override precomputation for qualification standard
      const points = [];
      const opts = this._uvvisController._optics;

      for (let lambda = 200; lambda <= 800; lambda++) {
        const eps = compound.peaks.reduce((sum, p) => {
          const sigma = p.bandwidth / 2.355;
          const dev = lambda - p.lambdaMax;
          return sum + compound.epsilonMax * p.epsilonFraction * Math.exp(-(dev * dev) / (2 * sigma * sigma));
        }, 0);
        
        const concUgMl = standardKey === 'potassium_dichromate' ? 60.0 : 50.0;
        const cMolL = (concUgMl * 1e-3) / compound.mw;
        const idealA = eps * cMolL * 1.0;
        points.push({ x: lambda, y: idealA });
      }

      // Process through optics pipeline
      spectrumPoints = points;
      if (this._uvvisController._optics) {
        const opticsEngine = this._uvvisController._optics;
        // Apply wavelength offset and stray light
        const delta = opticsEngine.wavelengthOffset || 0.0;
        const strayKey = opticsEngine.strayLightPreset || 'routine';
        const strayVal = { ideal: 0.0001, routine: 0.0005, high: 0.0120 }[strayKey] || 0.0005;

        spectrumPoints = points.map(pt => {
          const T_sample = Math.pow(10, -pt.y);
          const T_obs = T_sample + strayVal;
          const obsAbs = Math.max(0, -Math.log10(T_obs));
          return {
            x: pt.x + delta,
            y: Math.round(obsAbs * 10000) / 10000
          };
        });
      }
    }

    const evaluation = QualificationEngine.evaluateStandard(spectrumPoints, stdData);
    this._testResults.set(standardKey, evaluation);
    return { spectrumPoints, evaluation };
  }

  /**
   * Return array of all completed qualification test evaluations.
   */
  getEvaluations() {
    return Array.from(this._testResults.values());
  }

  /**
   * Generate formal Qualification Certificate payload.
   */
  generateCertificate(operator = 'QC Analyst') {
    const evaluations = this.getEvaluations();
    const opticsSettings = this._uvvisController ? { ...this._uvvisController._optics } : {};
    return QualificationEngine.buildQualificationCertificate(evaluations, opticsSettings, operator);
  }
}
