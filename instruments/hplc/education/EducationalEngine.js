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
   * Get narrative object for a parameter change.
   * Centralizes narratives for EducationalNarrator.
   */
  static getParamNarrative(paramId, oldVal, newVal) {
    const delta = newVal - oldVal;
    const sign  = delta > 0 ? 'increased' : 'decreased';
    const up    = delta > 0;

    const CONF = {
      CERTAIN:   { label: 'Certain',    color: '#22c55e', bars: 3 },
      LIKELY:    { label: 'Likely',     color: '#38bdf8', bars: 2 },
      MODERATE:  { label: 'Moderate',   color: '#fbbf24', bars: 2 },
      VARIABLE:  { label: 'Variable',   color: '#f59e0b', bars: 1 },
      UNCERTAIN: { label: 'Uncertain',  color: '#94a3b8', bars: 1 }
    };

    const narratives = {
      flowRate: [
        {
          heading: `Flow rate ${sign} (${oldVal.toFixed(2)} → ${newVal.toFixed(2)} mL/min)`,
          body: `Higher flow rate reduces the time analytes spend in the column. Each compound elutes earlier because mobile phase carries them through faster, reducing the retention factor k'.`,
          predictions: [
            { label: 'Retention time',  arrow: up ? '↓' : '↑', conf: CONF.CERTAIN  },
            { label: 'Back-pressure',   arrow: up ? '↑' : '↓', conf: CONF.CERTAIN  },
            { label: 'Peak width',      arrow: up ? '↓' : '↑', conf: CONF.LIKELY   },
            { label: 'Resolution Rs',   arrow: '?',             conf: CONF.VARIABLE, note: 'Depends on selectivity at new flow. Efficiency (N) may drop if above optimal Van Deemter velocity.' }
          ],
          equation: 'Van Deemter: H = A + B/u + C·u',
          equationNote: 'At high flow (u), C-term dominates → H rises → N falls → Rs may drop'
        }
      ],
      organicPercent: [
        {
          heading: `Mobile phase %B ${sign} (${oldVal.toFixed(0)}% → ${newVal.toFixed(0)}%)`,
          body: `In reversed-phase HPLC, increasing organic modifier (acetonitrile/MeOH) weakens analyte retention. The linear solvent strength (LSS) model predicts log k decreases linearly with φ.`,
          predictions: [
            { label: 'Retention time',    arrow: up ? '↓' : '↑', conf: CONF.CERTAIN  },
            { label: 'Peak spacing (α)',   arrow: '?',             conf: CONF.VARIABLE, note: 'Selectivity changes depend on analyte polarity differences — may improve or worsen separation.' },
            { label: 'Resolution Rs',      arrow: '?',             conf: CONF.UNCERTAIN, note: 'Could improve (more spacing) or worsen (compression into void).' },
            { label: 'Peak width (W½)',    arrow: up ? '↓' : '↑', conf: CONF.LIKELY   }
          ],
          equation: 'LSS: log k = log kw − S·φ',
          equationNote: 'S = slope of log k vs. φ (compound-specific). Larger S → greater sensitivity to %B change.'
        }
      ],
      temperature: [
        {
          heading: `Column temperature ${sign} (${oldVal.toFixed(0)}°C → ${newVal.toFixed(0)}°C)`,
          body: `Temperature affects mobile phase viscosity and analyte diffusion. Higher temperature lowers viscosity (reduces pressure) and increases B-term diffusion, sharpening peaks. Retention decreases due to reduced analyte-stationary phase interactions.`,
          predictions: [
            { label: 'Retention time',  arrow: up ? '↓' : '↑', conf: CONF.LIKELY   },
            { label: 'Peak width',      arrow: up ? '↓' : '↑', conf: CONF.LIKELY   },
            { label: 'Back-pressure',   arrow: up ? '↓' : '↑', conf: CONF.CERTAIN  },
            { label: 'Resolution Rs',   arrow: '?',             conf: CONF.VARIABLE, note: 'Peak sharpening may improve Rs, but selectivity change depends on analyte chemistry.' }
          ],
          equation: "van 't Hoff: ln k = −ΔH°/(RT) + ΔS°/R",
          equationNote: 'Higher T → smaller k for most analytes. Effect size varies by analyte.'
        }
      ],
      ph: [
        {
          heading: `Mobile phase pH ${sign} (${oldVal.toFixed(1)} → ${newVal.toFixed(1)})`,
          body: `pH controls the ionisation state of acidic/basic analytes. At pH below pKa, weak acids are neutral (hydrophobic, retained). Above pKa they ionise, becoming polar and eluting near the void.`,
          predictions: [
            { label: 'Ionisable analyte retention', arrow: '?', conf: CONF.VARIABLE, note: 'Direction depends on compound pKa relative to new pH.' },
            { label: 'Peak shape (Tf)',              arrow: '?', conf: CONF.VARIABLE, note: 'Partial ionisation near pKa causes peak splitting or tailing.' }
          ],
          equation: 'Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])',
          equationNote: 'Retention changes sharply within ±1 pH unit of compound pKa.'
        }
      ],
      wavelength: [
        {
          heading: `Detection wavelength changed (${oldVal.toFixed(0)} → ${newVal.toFixed(0)} nm)`,
          body: `UV detector response depends on the molar absorptivity (ε) at the selected wavelength. At the analyte's λmax, sensitivity is maximised. Off-peak wavelengths reduce signal height without changing retention.`,
          predictions: [
            { label: 'Peak height / area', arrow: '?', conf: CONF.VARIABLE, note: "Depends on each compound's UV spectrum. Run a PDA scan to find λmax." },
            { label: 'Retention time',     arrow: '—', conf: CONF.CERTAIN,  note: 'Wavelength has no effect on chromatographic retention.' }
          ],
          equation: 'Beer-Lambert: A = ε · b · c',
          equationNote: 'ε varies with wavelength. Operating at λmax gives highest signal-to-noise ratio.'
        }
      ]
    };

    return narratives[paramId] || [];
  }

  /**
   * Generate combined-effect narrative for multi-parameter changes.
   */
  static generateCombinedNarrative(changes) {
    const CONF = {
      CERTAIN:   { label: 'Certain',    color: '#22c55e', bars: 3 },
      LIKELY:    { label: 'Likely',     color: '#38bdf8', bars: 2 },
      MODERATE:  { label: 'Moderate',   color: '#fbbf24', bars: 2 },
      VARIABLE:  { label: 'Variable',   color: '#f59e0b', bars: 1 },
      UNCERTAIN: { label: 'Uncertain',  color: '#94a3b8', bars: 1 }
    };

    const flowD    = changes.flowRate?.delta     || 0;
    const organicD = changes.organicPercent?.delta || 0;
    const tempD    = changes.temperature?.delta   || 0;
    const phD      = changes.ph?.delta            || 0;

    const rtReducers = [];
    const rtIncreasers = [];
    if (flowD    > 0.05)  rtReducers.push('increased flow rate');
    if (flowD    < -0.05) rtIncreasers.push('decreased flow rate');
    if (organicD > 0.5)   rtReducers.push('higher %B');
    if (organicD < -0.5)  rtIncreasers.push('lower %B');
    if (tempD    > 0.5)   rtReducers.push('higher temperature');
    if (tempD    < -0.5)  rtIncreasers.push('lower temperature');

    const netRtDown = rtReducers.length > rtIncreasers.length;
    const netRtUp   = rtIncreasers.length > rtReducers.length;
    const pressureDir = flowD > 0.05 ? '↑' : flowD < -0.05 ? '↓' : null;

    let body = '';
    if (rtReducers.length && rtIncreasers.length === 0) {
      body = `${rtReducers.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(' and ')} will all reduce retention time. Analytes will elute faster across the board.`;
    } else if (rtIncreasers.length && rtReducers.length === 0) {
      body = `${rtIncreasers.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(' and ')} will all increase retention time. Analytes will spend more time interacting with the stationary phase.`;
    } else if (rtReducers.length && rtIncreasers.length) {
      body = `You have made changes that work in opposite directions on retention time: ${rtReducers.join(', ')} reduce retention while ${rtIncreasers.join(', ')} increase it. The net effect will depend on which factor dominates for each analyte — run the simulation to see the combined result.`;
    }

    if (flowD > 0.05 && (organicD > 0.5 || tempD > 0.5)) {
      body += ` Note: higher flow rate shortens analysis time further, but combined with more organic or higher temperature, resolution (Rs) may drop because analytes spend less time separating on the column.`;
    }

    if (Math.abs(phD) > 0.3) {
      body += ` The pH change may additionally alter the ionisation state of acidic or basic analytes, shifting their retention independently of the organic or temperature effects.`;
    }

    const predictions = [];
    if (netRtDown) {
      predictions.push({ label:'Retention time (all compounds)', arrow:'↓', conf: rtReducers.length >= 2 ? CONF.CERTAIN : CONF.LIKELY });
    } else if (netRtUp) {
      predictions.push({ label:'Retention time (all compounds)', arrow:'↑', conf: rtIncreasers.length >= 2 ? CONF.CERTAIN : CONF.LIKELY });
    } else {
      predictions.push({ label:'Retention time', arrow:'?', conf: CONF.VARIABLE, note:'Opposing changes — net effect requires simulation.' });
    }

    if (pressureDir) {
      predictions.push({ label:'Back-pressure', arrow: pressureDir, conf: CONF.CERTAIN });
    }

    const rsConf = (Math.abs(flowD) > 0.3 && Math.abs(organicD) > 5) ? CONF.VARIABLE : CONF.UNCERTAIN;
    predictions.push({
      label: 'Resolution Rs',
      arrow: '?',
      conf:  rsConf,
      note:  'Combined parameter changes have complex, non-additive effects on selectivity (α). Run the simulation to quantify.'
    });

    return {
      heading: `Combined Effect: ${Object.keys(changes).length} parameters changed`,
      body,
      predictions,
      equation: null
    };
  }

  /**
   * Predict qualitative impact of parameter changes for ParameterImpact panel.
   */
  static computeImpacts(newParams, oldParams) {
    if (!oldParams) return [];
    const impacts = [];

    const flowDelta    = newParams.flowRate - oldParams.flowRate;
    const organicDelta = newParams.organicPercent - oldParams.organicPercent;
    const tempDelta    = newParams.temperature - oldParams.temperature;

    if (Math.abs(flowDelta) > 0.05) {
      impacts.push({
        icon: '⚡',
        label: 'Retention Time',
        direction: flowDelta > 0 ? '↓' : '↑',
        tooltip: `Flow ${flowDelta > 0 ? 'increased' : 'decreased'} → faster ${flowDelta > 0 ? 'elution' : 'separation'}`,
        color: flowDelta > 0 ? '#38bdf8' : '#f59e0b'
      });
      impacts.push({
        icon: '🔧',
        label: 'Back-pressure',
        direction: flowDelta > 0 ? '↑' : '↓',
        tooltip: `Pressure ∝ flow rate (van Deemter / Darcy)`,
        color: flowDelta > 0 ? '#f87171' : '#34d399'
      });
    }

    if (Math.abs(organicDelta) > 0.5) {
      impacts.push({
        icon: '🧪',
        label: 'Retention Time',
        direction: organicDelta > 0 ? '↓' : '↑',
        tooltip: `More organic → weaker retention (LSS: log k = log kw − S·φ)`,
        color: organicDelta > 0 ? '#a78bfa' : '#fbbf24'
      });
    }

    if (Math.abs(tempDelta) > 0.5) {
      impacts.push({
        icon: '🌡️',
        label: 'Back-pressure',
        direction: tempDelta > 0 ? '↓' : '↑',
        tooltip: `Higher temp → lower viscosity → reduced pressure`,
        color: tempDelta > 0 ? '#34d399' : '#f87171'
      });
    }

    return impacts;
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

