/**
 * UvVisEducationalEngine.js — Educational Engine for UV-Vis Spectrophotometry
 *
 * Milestone narration (not continuous per-nm narration):
 *   LAMP_WARMUP, BLANK_SCAN (UV range), BLANK_SCAN (Visible), BLANK_COMPLETE,
 *   SAMPLE_SCAN (UV range), SAMPLE_SCAN (Visible), PEAK_DETECTED, SCAN_COMPLETE
 *
 * Existing evaluateScan(), getBeerLambertExplanation(), getChromophoreInfo() — unchanged.
 */

const NARRATIONS = {
  LAMP_WARMUP: {
    text: 'Deuterium (D₂) and tungsten-halogen lamps warming up. D₂ covers UV (190–350 nm); tungsten covers visible (350–800 nm). Allow 15–30 min for stable emission in a real lab.',
    tip:  'Lamp instability = noisy baseline. Never rush warmup.',
  },
  BLANK_SCAN_UV: {
    text: 'Scanning blank solvent through UV region (200–400 nm). A good solvent is transparent here. If baseline rises sharply below ~210 nm, the solvent UV cutoff is interfering.',
    tip:  'Use water or acetonitrile for deep-UV work below 210 nm. Avoid ethanol.',
  },
  BLANK_SCAN_VIS: {
    text: 'Scanning blank solvent through visible region (400–800 nm). A colourless solvent gives A ≈ 0 AU here. The instrument stores this as the 100 %T (Auto-Zero) reference.',
    tip:  'Auto-Zero corrects for cuvette reflections and solvent absorption in every reading.',
  },
  BLANK_COMPLETE: {
    text: '✓ Blank calibration complete. 100 %T Auto-Zero set. All sample absorbance values will be reported relative to this baseline.',
    tip:  'Always re-blank when you change solvents or cuvettes.',
  },
  SAMPLE_SCAN_UV: {
    text: 'UV scan in progress (200–400 nm). Aromatic π systems and conjugated chromophores absorb here via π→π* and n→π* electronic transitions.',
    tip:  'Most pharmaceutical API compounds have their primary UV band between 200–320 nm.',
  },
  SAMPLE_SCAN_VIS: {
    text: 'Visible scan in progress (400–800 nm). Only coloured compounds absorb here. If your analyte has no chromophore in this region, absorbance will remain near zero.',
    tip:  'KMnO₄ shows 5 resolved vibronic bands here — Ligand-to-Metal Charge Transfer (LMCT).',
  },
  PEAK_DETECTED: (lambda = 243, absorbance = 0) => ({
    text: `Peak detected: λmax = ${lambda} nm, A = ${(absorbance || 0).toFixed(3)} AU. This wavelength gives maximum sensitivity for quantitative measurement.`,
    tip:  `Set the monochromator to ${lambda} nm for point measurements at this concentration.`,
  }),
  SCAN_COMPLETE: (lambdaMax = 243, maxAbs = 0) => ({
    text: `Scan complete. λmax = ${lambdaMax} nm, Amax = ${(maxAbs || 0).toFixed(3)} AU. Check Beer-Lambert Calibration tab to build a quantitative assay.`,
    tip:  'For best linearity keep A between 0.2–1.5 AU. Adjust concentration or path length if needed.',
  }),
};

export class UvVisEducationalEngine {

  /**
   * Returns narration text for the current scan milestone.
   * Called by UI on each UVVIS_EVENTS emission — not per tick.
   * @param {string} milestone  - key from NARRATIONS
   * @param {Object} [params]   - optional { lambda, absorbance, lambdaMax, maxAbsorbance }
   */
  static getNarration(milestone, params = {}) {
    const n = NARRATIONS[milestone];
    if (!n) return null;
    if (typeof n === 'function') {
      return n(params.lambda ?? params.lambdaMax, params.absorbance ?? params.maxAbsorbance);
    }
    return n;
  }

  /**
   * Returns narration key for current scan phase + wavelength.
   * Milestones only — not every nm.
   */
  static getMilestoneKey(lifecyclePhase, currentLambda) {
    if (lifecyclePhase === 'LAMP_WARMUP')  return 'LAMP_WARMUP';
    if (lifecyclePhase === 'BLANK_SCAN')   return currentLambda < 400 ? 'BLANK_SCAN_UV' : 'BLANK_SCAN_VIS';
    if (lifecyclePhase === 'SAMPLE_SCAN')  return currentLambda < 400 ? 'SAMPLE_SCAN_UV' : 'SAMPLE_SCAN_VIS';
    return null;
  }

  // ── Unchanged from v1 ────────────────────────────────────────────────────

  static getBeerLambertExplanation(A, epsilon, c, l) {
    return {
      title: 'Beer-Lambert Law (A = ε · c · l)',
      formula: `A = (${epsilon.toLocaleString()} L/mol·cm) × (${c.toExponential(2)} mol/L) × (${l} cm) = ${A.toFixed(3)} AU`,
      physicalMeaning: 'Absorbance (A) is directly proportional to solute molar concentration (c) and optical path length (l). Molar absorptivity (ε) characterises the probability of photon absorption at a given wavelength.',
      practicalTip: 'For quantitative calibration curves, maintain absorbance between 0.2 and 1.5 AU to avoid non-linear stray light distortion.',
    };
  }

  static getChromophoreInfo(compoundKey) {
    const info = {
      paracetamol: {
        chromophore: 'Phenolic aromatic ring + Amide group',
        transition:  'π → π* electronic transition',
        lambdaMax:   '243 nm',
        clinicalNote: 'Assayed in Quality Control labs for active pharmaceutical ingredient (API) assay.',
      },
      caffeine: {
        chromophore: 'Purine-2,6-dione conjugated system',
        transition:  'π → π* electronic transition',
        lambdaMax:   '273 nm',
        clinicalNote: 'Widely used as a UV-Vis standard for spectrophotometric linearity checks.',
      },
      aspirin: {
        chromophore: 'Benzoic acid derivative',
        transition:  'π → π* transition (230 nm + 276 nm)',
        lambdaMax:   '276 nm',
        clinicalNote: 'Hydrolyzes to salicylic acid over time, shifting λmax to 303 nm.',
      },
      kmno4: {
        chromophore: 'Permanganate ion [MnO₄]⁻',
        transition:  'Ligand-to-Metal Charge Transfer (LMCT) — 5 vibronic bands',
        lambdaMax:   '525 nm',
        clinicalNote: 'Absorbs strongly in green visible light, appearing intensely purple.',
      },
    };
    return info[compoundKey] || info.paracetamol;
  }

  static evaluateScan(scanResult) {
    const { maxAbsorbance, lambdaMax } = scanResult;
    let diagnosis, recommendation;

    if (maxAbsorbance > 2.0) {
      diagnosis      = '⚠ Detector Saturation (A > 2.0 AU). Stray light distorts Beer-Lambert linearity.';
      recommendation = 'Dilute the sample or use a 0.5 cm micro-cuvette.';
    } else if (maxAbsorbance < 0.1) {
      diagnosis      = 'Low Signal (A < 0.1 AU). Signal-to-noise ratio is suboptimal.';
      recommendation = 'Increase concentration or use a 2.0 cm path length cuvette.';
    } else {
      diagnosis      = '✓ Optimal Absorbance Range (0.2–1.5 AU). Ideal for quantitative analysis.';
      recommendation = 'Perform multi-point calibration curve for exact concentration assay.';
    }

    return {
      peakLambda:    `${lambdaMax} nm`,
      maxAbsorbance: `${maxAbsorbance.toFixed(3)} AU`,
      diagnosis,
      recommendation,
    };
  }
}
