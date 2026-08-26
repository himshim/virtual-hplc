/**
 * diagnosticEngine.js — Evidence-Based Laboratory Error Interpreter Engine
 *
 * Evaluates observed spectrum data and laboratory state independently to infer likely causes,
 * diagnostic patterns, and corrective recommendations.
 */

export class DiagnosticEngine {
  /**
   * Analyze an observed spectrum for spectral anomalies and evidence of operator error.
   * @param {Array<{x: number, y: number}>} points - array of {x: lambda, y: absorbance}
   * @param {Object} labState - { smudgeLevel, turbidityLevel, blankSolvent, sampleSolvent, cuvetteRotated }
   * @returns {Object} diagnostic feedback object
   */
  static analyzeSpectrum(points = [], labState = {}) {
    if (!points || points.length === 0) {
      return {
        anomalyDetected: false,
        summary: 'No spectrum data available for analysis.',
        recommendation: 'Perform a wavelength scan.'
      };
    }

    const minLambda = points[0].x;
    const maxLambda = points[points.length - 1].x;

    // Dynamic visible baseline query (upper 20% of measured wavelength range)
    const visThreshold = minLambda + (maxLambda - minLambda) * 0.75;
    const baselineVisible = points.filter(p => p.x >= visThreshold);
    const avgVisibleBaseline = baselineVisible.reduce((sum, p) => sum + p.y, 0) / (baselineVisible.length || 1);

    const uvPt = points[0];
    const visPt = points[points.length - 1];
    const uvVisRatio = uvPt.y / Math.max(0.01, visPt.y);

    // Evidence 1: Cuvette Rotation Error
    if (labState.cuvetteRotated) {
      return {
        anomalyDetected: true,
        primaryFault: 'cuvette_rotated',
        title: '⚠ Frosted Cuvette Face in Optical Path',
        summary: 'Light beam is passing through translucent frosted glass sides, attenuating 90% of incident light.',
        recommendation: 'Rotate cuvette 90° so clear optical quartz faces align with the light beam.',
        confidence: 0.98
      };
    }

    // Evidence 2: Fingerprint / Dirty Cuvette Smudge (Constant wavelength-independent baseline shift)
    if (avgVisibleBaseline > 0.04 && uvVisRatio < 4.0) {
      return {
        anomalyDetected: true,
        primaryFault: 'fingerprint_smudge',
        title: '⚠ Wavelength-Independent Baseline Offset (Dirty Cuvette)',
        summary: `Baseline elevation (+${avgVisibleBaseline.toFixed(3)} AU) caused by skin oil/smudges on optical faces.`,
        recommendation: 'Wipe cuvette optical faces with lint-free lens tissue before inserting into sample holder.',
        confidence: 0.92
      };
    }

    // Evidence 3: Rayleigh Turbidity / Particulate Suspension (λ⁻⁴ scattering power law)
    if (uvVisRatio > 5.0 && visPt.y > 0.008) {
      return {
        anomalyDetected: true,
        primaryFault: 'turbidity',
        title: '⚠ Rayleigh Light Scattering (Turbid Sample Solution)',
        summary: `Absorbance rises exponentially into UV (${uvPt.y.toFixed(3)} AU at ${uvPt.x} nm) due to particulate light scattering (λ⁻⁴).`,
        recommendation: 'Filter or centrifuge sample solution to remove suspended particulates.',
        confidence: 0.95
      };
    }

    // Evidence 4: Blank Mismatch Cutoff
    if (labState.blankSolvent && labState.blankSolvent !== 'matched' && labState.blankSolvent !== labState.sampleSolvent) {
      return {
        anomalyDetected: true,
        primaryFault: 'blank_mismatch',
        title: '⚠ Solvent Blank Mismatch Error',
        summary: `Blanking solvent (${labState.blankSolvent.toUpperCase()}) differs from sample solvent (${(labState.sampleSolvent || 'water').toUpperCase()}).`,
        recommendation: 'Re-blank instrument using the exact same solvent batch used for sample preparation.',
        confidence: 0.90
      };
    }

    return {
      anomalyDetected: false,
      primaryFault: 'none',
      title: '✅ Optimal Spectrum Acquisition',
      summary: 'Clean baseline and expected spectral profile detected.',
      recommendation: 'Proceed with quantitative concentration assay.',
      confidence: 1.0
    };
  }
}
