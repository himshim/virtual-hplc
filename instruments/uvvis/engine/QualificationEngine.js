/**
 * QualificationEngine.js — Pharmacopoeial IQ/OQ Evaluation Subsystem
 *
 * Evaluates measured UV-Vis spectrum data against data-driven pharmacopoeial standards
 * (Holmium Oxide wavelength accuracy, Potassium Dichromate photometric accuracy,
 * NaI stray light cutoff, and Air Blank baseline flatness).
 */

export class QualificationEngine {
  /**
   * Evaluate a measured spectrum against a pharmacopoeial qualification standard definition.
   * @param {Array<{x: number, y: number}>} spectrumPoints - array of {x: lambda, y: absorbance}
   * @param {Object} standardData - qualification standard asset object from data registry
   * @returns {Object} detailed measurement evaluation result
   */
  static evaluateStandard(spectrumPoints = [], standardData = {}) {
    if (!spectrumPoints || spectrumPoints.length === 0) {
      return { status: 'FAIL', reason: 'No spectrum data collected' };
    }

    const type = standardData.type;

    if (type === 'wavelength_accuracy') {
      // Find peak in 500–560 nm range for Holmium Oxide
      const targetRange = spectrumPoints.filter(pt => pt.x >= 500 && pt.x <= 560);
      const measuredPeakPt = targetRange.reduce((max, pt) => pt.y > max.y ? pt : max, targetRange[0] || spectrumPoints[0]);
      
      const certified = standardData.certifiedValue;
      const measured  = measuredPeakPt.x;
      const diff      = Math.round((measured - certified) * 10) / 10;
      const tol       = standardData.tolerance;
      const passed    = Math.abs(diff) <= tol;

      return {
        testKey:        'holmium_oxide',
        testName:       standardData.name,
        type,
        certifiedValue: `${certified} ${standardData.unit}`,
        measuredValue:  `${measured} ${standardData.unit}`,
        difference:     `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${standardData.unit}`,
        limit:          `±${tol.toFixed(1)} ${standardData.unit}`,
        status:         passed ? 'PASS' : 'FAIL',
        numericDiff:    diff,
      };
    }

    if (type === 'photometric_accuracy') {
      const targetLambda = standardData.targetLambda || 350;
      const pt350 = spectrumPoints.find(p => p.x === targetLambda) || spectrumPoints[0];
      
      const certified = standardData.certifiedValue;
      const measured  = pt350.y;
      const diff      = Math.round((measured - certified) * 1000) / 1000;
      const tol       = standardData.tolerance;
      const passed    = Math.abs(diff) <= tol;

      return {
        testKey:        'potassium_dichromate',
        testName:       standardData.name,
        type,
        certifiedValue: `${certified.toFixed(3)} ${standardData.unit}`,
        measuredValue:  `${measured.toFixed(3)} ${standardData.unit}`,
        difference:     `${diff > 0 ? '+' : ''}${diff.toFixed(3)} ${standardData.unit}`,
        limit:          `±${tol.toFixed(3)} ${standardData.unit}`,
        status:         passed ? 'PASS' : 'FAIL',
        numericDiff:    diff,
      };
    }

    if (type === 'stray_light') {
      const cutoffLambda = standardData.cutoffLambda || 259;
      const pt259 = spectrumPoints.find(p => p.x === cutoffLambda) || spectrumPoints[0];
      
      const minAbs = standardData.minAbsorbance || 2.0;
      const measured = pt259.y;
      const passed = measured >= minAbs;

      return {
        testKey:        'sodium_iodide',
        testName:       standardData.name,
        type,
        certifiedValue: `≥ ${minAbs.toFixed(3)} ${standardData.unit}`,
        measuredValue:  `${measured.toFixed(3)} ${standardData.unit}`,
        difference:     `${(measured - minAbs).toFixed(3)} ${standardData.unit}`,
        limit:          `≥ ${minAbs.toFixed(3)} ${standardData.unit}`,
        status:         passed ? 'PASS' : 'FAIL',
        numericDiff:    measured - minAbs,
      };
    }

    if (type === 'baseline_flatness') {
      const absValues = spectrumPoints.map(p => p.y);
      const maxAbs = Math.max(...absValues);
      const minAbs = Math.min(...absValues);
      const maxDev = Math.max(Math.abs(maxAbs), Math.abs(minAbs));
      const tol = standardData.maxDeviation || 0.002;
      const passed = maxDev <= tol;

      return {
        testKey:        'air_blank',
        testName:       standardData.name,
        type,
        certifiedValue: `0.000 ${standardData.unit}`,
        measuredValue:  `Max Dev ${maxDev.toFixed(4)} ${standardData.unit}`,
        difference:     `±${maxDev.toFixed(4)} ${standardData.unit}`,
        limit:          `±${tol.toFixed(3)} ${standardData.unit}`,
        status:         passed ? 'PASS' : 'FAIL',
        numericDiff:    maxDev,
      };
    }

    return { status: 'UNKNOWN', reason: 'Unrecognized test type' };
  }

  /**
   * Build structured Qualification Certificate metadata.
   */
  static buildQualificationCertificate(evaluations = [], opticsSettings = {}, operator = 'QC Analyst') {
    const allPassed = evaluations.length > 0 && evaluations.every(e => e.status === 'PASS');
    return {
      certificateId: `IQOQ-UV-${Date.now().toString(36).toUpperCase()}`,
      timestamp:     new Date().toISOString(),
      instrument:    'Shimadzu UV-1800 Spectrophotometer',
      operator,
      opticsSettings,
      overallStatus: allPassed ? 'PASS' : 'FAIL',
      evaluations,
    };
  }
}
