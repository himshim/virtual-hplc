/**
 * gradientEngine.js - Phase D Linear Solvent Strength (LSS) Gradient Elution Engine
 * 
 * Implements standard BaseEngine interface.
 * Calculates exact gradient retention time tR_g and peak compression factor G under multi-step %B gradients.
 * 
 * Equations:
 * 1. Local retention factor k(phi) = kw * exp(-S * phi(t))
 * 2. Gradient steepness b = S * delta_phi * t0 / tg
 * 3. Gradient retention time tR_g = td + t0 + (1/b) * ln[ 1 + b * k0 * (1 - td/(t0 * k0)) ]
 * 4. Gradient Peak Compression Factor G = sqrt( (1 + p + p^2/3) / (1 + p)^2 )
 */

export class GradientEngine {
  static metadata = {
    name: "GradientEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["lssGradient", "peakCompression", "multiStepGradient", "dwellVolumeDelay"]
  };

  validate(context) {
    const flowRate = context.flowRate || 1.0;
    if (flowRate <= 0) {
      return { valid: false, errors: ["Flow rate must be greater than zero."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Processes LSS gradient elution retention time and peak compression factor.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with gradientTR, compressionFactorG, and isGradientFlag
   */
  process(context) {
    const kw = context.kw || 100.0;
    const S = context.S || 5.0;
    const t0 = context.t0 || 1.5; // Dead time in min
    const flowRate = context.flowRate || 1.0;
    const dwellVolumeMl = context.dwellVolumeMl || 0.3; // Pump dwell volume in mL
    const td = dwellVolumeMl / flowRate; // Dwell delay time in min

    const gradientProgram = context.gradientProgram || [
      { time: 0.0, percentB: 10 },
      { time: 10.0, percentB: 90 }
    ];

    const isGradient = Array.isArray(gradientProgram) && gradientProgram.length >= 2;

    if (!isGradient) {
      // Isocratic fallback
      const phi = (context.organicPercent || 40) / 100;
      const kIsocratic = kw * Math.exp(-S * phi);
      const tR = t0 * (1 + kIsocratic);
      return {
        tR,
        kObserved: kIsocratic,
        compressionFactorG: 1.0,
        isGradient: false
      };
    }

    // Step 1: Extract gradient parameters
    const initialB = gradientProgram[0].percentB;
    const finalB = gradientProgram[gradientProgram.length - 1].percentB;
    const tg = Math.max(0.1, gradientProgram[gradientProgram.length - 1].time - gradientProgram[0].time); // Gradient time in min

    const phi0 = initialB / 100;
    const phif = finalB / 100;
    const deltaPhi = Math.max(0.01, phif - phi0);

    // Initial retention factor k0 at initial mobile phase %B
    const k0 = Math.max(0.01, kw * Math.exp(-S * phi0));

    // Gradient steepness parameter b = (S * delta_phi * t0) / tg
    const b = (S * deltaPhi * t0) / tg;

    // Step 2: Calculate analytical Gradient Retention Time tR_g
    const k0Term = Math.max(0.001, 1.0 - (td / (t0 * k0)));
    const arg = 1.0 + (b * k0 * k0Term);
    const safeArg = Math.max(1.0001, arg);

    const tRg = td + t0 + (1.0 / b) * Math.log(safeArg);

    // Step 3: Gradient Peak Compression Factor G
    const p = b * k0;
    const numG = 1.0 + p + (p * p / 3.0);
    const denG = Math.pow(1.0 + p, 2);
    const compressionFactorG = Math.max(0.2, Math.sqrt(numG / denG));

    return {
      tR: tRg,
      k0,
      gradientSteepnessB: b,
      compressionFactorG,
      isGradient: true,
      dwellDelayTd: td
    };
  }

  report(context) {
    return {
      engine: GradientEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
