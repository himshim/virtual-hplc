/**
 * bandProfileEngine.js - Phase E Physical Band Profile Engine (Gaussian & EMG Tailing)
 * 
 * Implements standard BaseEngine interface.
 * Calculates physical concentration/intensity profiles including ideal Gaussian,
 * Exponentially Modified Gaussian (EMG), and peak tailing (Tf > 1.0).
 * 
 * Equations:
 * 1. Ideal Gaussian: I(t) = height * exp( -(t - tR)^2 / (2*sigma^2) )
 * 2. EMG Tailing: tau = sigma * (Tf - 1.0) / 1.5
 *    I_EMG(t) = (height * sigma / tau) * sqrt(pi/2) * exp( (sigma^2/(2*tau^2)) - ((t - tR)/tau) ) * erfc( (sigma/(sqrt(2)*tau)) - ((t - tR)/(sqrt(2)*sigma)) )
 */

// Complementary Error Function erfc(x) approximation
function erfc(x) {
  // Abramowitz and Stegun formula 7.1.26 approximation
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return sign === 1 ? 1.0 - y : 1.0 + y;
}

export class BandProfileEngine {
  static metadata = {
    name: "BandProfileEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["gaussianProfile", "emgTailingProfile", "tailingFactorTf", "asymmetricProfile"]
  };

  validate(context) {
    const sigma = context.sigma || 0.1;
    if (sigma <= 0) {
      return { valid: false, errors: ["Standard deviation sigma must be greater than zero."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Processes physical band concentration profile at time t.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with intensity and profileType
   */
  process(context) {
    const t = context.time !== undefined ? context.time : 0.0;
    const tR = context.tR !== undefined ? context.tR : 2.5;
    const sigma = Math.max(0.001, context.sigma || 0.05); // min
    const height = context.height !== undefined ? context.height : 1.0;
    const tailingFactor = Math.max(0.8, context.tailingFactor || 1.0); // Tf

    const diff = t - tR;

    // Case 1: Ideal Gaussian (Tf close to 1.0)
    if (Math.abs(tailingFactor - 1.0) < 0.05) {
      const exponent = -(diff * diff) / (2.0 * sigma * sigma);
      const intensity = Math.max(0, height * Math.exp(exponent));
      return {
        intensity,
        profileType: "GAUSSIAN",
        tailingFactor: 1.0
      };
    }

    // Case 2: Exponentially Modified Gaussian (EMG Tailing for Tf > 1.0)
    const tau = Math.max(0.001, sigma * (tailingFactor - 1.0) / 1.5);
    const z1 = (sigma / (Math.SQRT2 * tau)) - (diff / (Math.SQRT2 * sigma));
    const term1 = (height * sigma / tau) * Math.sqrt(Math.PI / 2.0);
    const term2 = Math.exp(Math.max(-50, (sigma * sigma / (2.0 * tau * tau)) - (diff / tau)));
    const term3 = erfc(z1);

    const rawIntensity = term1 * term2 * term3;
    const intensity = isNaN(rawIntensity) ? 0 : Math.max(0, rawIntensity);

    return {
      intensity,
      profileType: "EMG_TAILING",
      tailingFactor,
      tau
    };
  }

  report(context) {
    return {
      engine: BandProfileEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
