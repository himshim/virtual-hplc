/**
 * laboratoryPracticeModel.js — Pure Spectrum Transformer for Laboratory Technique & Operator Errors
 *
 * Implements a deterministic spectrum transformation pipeline operating downstream of OpticalInstrumentModel:
 *
 *   Observed Optical Spectrum
 *            │
 *            ▼
 *   Fingerprint Smudge Offset (0.00, 0.05, 0.10, 0.15 AU)
 *            │
 *            ▼
 *   Continuous Particle Turbidity (Rayleigh λ⁻⁴ Scattering)
 *            │
 *            ▼
 *   Solvent Blank Mismatch Subtraction
 *            │
 *            ▼
 *   Cuvette Rotation (Frosted Face Attenuation + Noise)
 *            │
 *            ▼
 *   Transformed Spectrum Output
 */

import { SOLVENT_DATABASE as SOLVENT_DB } from '../data/registry.js';

export const SMUDGE_LEVELS = {
  clean: 0.00,
  light: 0.05,
  moderate: 0.10,
  heavy: 0.15
};

export class LaboratoryPracticeModel {
  /**
   * Transform an observed optical spectrum array based on laboratory practice parameters.
   * @param {Array<{x: number, y: number}>} points - array of {x: lambda, y: absorbance}
   * @param {Object} labConfig - { smudgeLevel, turbidityLevel, blankSolvent, sampleSolvent, cuvetteRotated }
   * @returns {Array<{x: number, y: number}>} transformed spectrum points
   */
  static processSpectrum(points = [], labConfig = {}) {
    if (!points || points.length === 0) return [];

    const smudgeKey     = labConfig.smudgeLevel || 'clean';
    const smudgeOffset  = SMUDGE_LEVELS[smudgeKey] ?? SMUDGE_LEVELS.clean;
    const turbidity     = Math.max(0.0, Math.min(1.0, labConfig.turbidityLevel || 0.0));
    const sampleSolvent = labConfig.sampleSolvent || 'water';
    const blankSolvent  = labConfig.blankSolvent || sampleSolvent;
    const isRotated     = Boolean(labConfig.cuvetteRotated);

    const kTurb = turbidity * 0.15; // Max k = 0.15 at 400 nm

    return points.map(pt => {
      let abs = pt.y;

      // 1. Fingerprint Smudge Flat Offset
      abs += smudgeOffset;

      // 2. Particle Turbidity Rayleigh λ⁻⁴ Scattering
      if (kTurb > 0) {
        const rayleighFactor = Math.pow(400 / pt.x, 4);
        abs += kTurb * rayleighFactor;
      }

      // 3. Solvent Blank Mismatch Error
      if (blankSolvent !== sampleSolvent && blankSolvent !== 'matched') {
        const sampleBlank = SOLVENT_DB[sampleSolvent] ?? SOLVENT_DB.water;
        const actualBlank = SOLVENT_DB[blankSolvent] ?? SOLVENT_DB.water;
        
        if (pt.x < actualBlank.uvCutoff && pt.x >= sampleBlank.uvCutoff) {
          const excessBlankAbs = Math.exp(actualBlank.kBelow * (actualBlank.uvCutoff - pt.x)) * 0.08;
          abs = Math.max(0, abs - excessBlankAbs);
        }
      }

      // 4. Cuvette Orientation Alignment Error (Rotated frosted face blocks 90% light)
      if (isRotated) {
        abs = abs * 0.10 + 0.85; // Light loss causes flat baseline elevation & signal compression
      }

      return {
        x: pt.x,
        y: Math.round(Math.max(0, abs) * 10000) / 10000
      };
    });
  }
}
