/**
 * EducationalEngine.js — Pure Headless Platform Educational Engine
 *
 * Provides standardized EducationalExplanation payloads for all method parameters,
 * diagnostic hints, and experiment state transitions across analytical instruments.
 *
 * Zero DOM or UI dependencies. Safe for Node.js, Web Workers, and Browser.
 */

export class EducationalEngine {
  /**
   * Get structured explanation payload for a specific parameter.
   * @param {string} paramId - Parameter identifier ('flowRate', 'organicPercent', 'temperature', 'ph', 'wavelength')
   * @param {number} [oldVal] - Optional previous value
   * @param {number} [newVal] - Optional new value
   * @returns {Object} EducationalExplanation payload
   */
  static getParameterExplanation(paramId, oldVal = null, newVal = null) {
    const explanations = {
      flowRate: {
        parameter: 'Flow Rate (F, mL/min)',
        physicalEffect: 'Increasing flow rate reduces linear residence time through the packed column bed (u = F / (ε * A)).',
        observedEffect: 'Analytes elute earlier (lower retention time tR), while hydraulic backpressure rises linearly according to Darcy\'s Law.',
        learnerOutcome: 'Learners understand the operational trade-off between analysis speed, system backpressure, and chromatographic efficiency (N).',
        practicalTip: 'Increase flow rate to shorten run time, but monitor system pressure limits (< 400 bar for conventional HPLC).',
        references: ['USP <621> Chromatography', 'Snyder, Kirkland, Dolan (2010) High-Performance Liquid Chromatography']
      },
      organicPercent: {
        parameter: 'Mobile Phase %B (% Organic Modifier)',
        physicalEffect: 'Increasing organic solvent (methanol/acetonitrile) reduces mobile phase polarity, weakening hydrophobic interactions with C18 stationary phase.',
        observedEffect: 'Analyte retention factor (k\') decreases exponentially following the Linear Solvent Strength (LSS) model (log k = log kw - S * φ).',
        learnerOutcome: 'Learners master eluent strength as the primary knob for controlling retention time and band spacing.',
        practicalTip: 'Adjust %B by ± 5-10% for large retention shifts. Decrease %B to increase retention and improve resolution of early-eluting peaks.',
        references: ['Linear Solvent Strength (LSS) Theory', 'Snyder & Dolan (2006) Liquid Chromatography Applications']
      },
      temperature: {
        parameter: 'Column Temperature (T, °C)',
        physicalEffect: 'Higher temperature reduces mobile phase viscosity (η) and increases molecular diffusion coefficients (Dm).',
        observedEffect: 'Column backpressure drops significantly, peak widths narrow (higher plate count N), and retention times decrease slightly (van \'t Hoff equation).',
        learnerOutcome: 'Learners observe temperature as an effective tool for lowering system pressure and sharpening peak shapes.',
        practicalTip: 'Use elevated column temperature (e.g., 40-50 °C) to lower pressure when running high-viscosity solvents like methanol/water.',
        references: ['van \'t Hoff Temperature Retention Model', 'J. Chromatogr. A: Thermal Effects in HPLC']
      },
      ph: {
        parameter: 'Mobile Phase pH',
        physicalEffect: 'pH controls the ionization state of ionizable acidic or basic analytes relative to their pKa values.',
        observedEffect: 'Ionized (charged) analytes become highly polar and elute near the void volume (t0), while neutral species interact strongly and retain longer.',
        learnerOutcome: 'Learners grasp acid-base equilibrium in separation science and why buffer pH control is critical for ionizable compounds.',
        practicalTip: 'Set buffer pH at least 2 units away from analyte pKa to ensure 99%+ consistent ionization state and prevent peak splitting.',
        references: ['Henderson-Hasselbalch Equation', 'Silanol Interaction Theory']
      },
      wavelength: {
        parameter: 'UV Detection Wavelength (λ, nm)',
        physicalEffect: 'Measures UV light absorption by analyte chromophores according to Beer-Lambert Law (A = ε * b * c).',
        observedEffect: 'Peak heights and areas change dramatically depending on the molar absorptivity (ε) of each compound at the selected wavelength.',
        learnerOutcome: 'Learners learn to select optimal detection wavelengths for maximum sensitivity and signal-to-noise ratio.',
        practicalTip: 'Choose a wavelength near the analyte UV absorption maximum (λmax) for high sensitivity, avoiding solvent cutoff wavelengths.',
        references: ['Beer-Lambert Law', 'USP <857> Ultraviolet-Visible Spectroscopy']
      }
    };

    const explanation = explanations[paramId] || {
      parameter: paramId,
      physicalEffect: 'Parameter influences chemical equilibrium or physical transport within the instrument.',
      observedEffect: 'Observed signal or chromatogram changes according to governing physical laws.',
      learnerOutcome: 'Learner observes parameter influence on experimental data.',
      practicalTip: 'Adjust parameter systematically to optimize experimental outcomes.',
      references: ['Standard Analytical Instrument Manual']
    };

    if (oldVal !== null && newVal !== null) {
      const delta = newVal - oldVal;
      const direction = delta > 0 ? 'Increased' : 'Decreased';
      return {
        ...explanation,
        changeContext: `${direction} from ${oldVal} to ${newVal}`
      };
    }

    return explanation;
  }

  /**
   * Get diagnostic narrative for an instrument state or completed run.
   * @param {Object} runResult - Run summary with peak metrics
   * @returns {Object} Diagnostic summary payload
   */
  static evaluateRunResult(runResult) {
    if (!runResult || !runResult.peaks) {
      return {
        status: 'NO_DATA',
        summary: 'No run result data available.',
        recommendations: ['Perform sample injection to acquire experimental data.']
      };
    }

    const peaks = runResult.peaks;
    const count = peaks.length;

    let minRs = Infinity;
    let maxTailing = 0;
    peaks.forEach(p => {
      if (p.resolution !== undefined && p.resolution < minRs) minRs = p.resolution;
      if (p.tailingFactor !== undefined && p.tailingFactor > maxTailing) maxTailing = p.tailingFactor;
    });

    const issues = [];
    const recommendations = [];

    if (count < 4) {
      issues.push('Co-elution detected: not all compounds separated as distinct peaks.');
      recommendations.push('Decrease mobile phase %B or adjust flow rate to widen peak separation.');
    }

    if (minRs !== Infinity && minRs < 1.5) {
      issues.push(`Low resolution (Rs = ${minRs.toFixed(2)} < 1.5 baseline separation threshold).`);
      recommendations.push('Lower %B or adjust pH to increase selectivity (α).');
    }

    if (maxTailing > 1.5) {
      issues.push(`Peak tailing observed (Tf = ${maxTailing.toFixed(2)} > 1.5 limit).`);
      recommendations.push('Check buffer pH or consider adding a triethylamine peak modifier to suppress silanol interaction.');
    }

    return {
      status: issues.length === 0 ? 'OPTIMAL' : 'SUBOPTIMAL',
      peakCount: count,
      minResolution: minRs === Infinity ? null : minRs,
      maxTailing: maxTailing || null,
      issues,
      recommendations
    };
  }
}
