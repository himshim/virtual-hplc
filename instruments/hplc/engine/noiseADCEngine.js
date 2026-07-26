/**
 * noiseADCEngine.js - Physical Baseline Noise & ADC Quantization Engine (Phase A)
 * 
 * Implements standard BaseEngine interface.
 * Consumes: raw signal points [{ time, intensity }], noise level, ADC bit depth, full scale AU, PRNG seed.
 * Produces: digitized signal points [{ time, intensity }], quantization SNR metrics.
 * 
 * Deterministic PRNG: Mulberry32 algorithm. Same seed = 100% identical noise & quantization.
 */

// Simple 32-bit deterministic Mulberry32 PRNG
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for Gaussian white noise using seeded PRNG
function gaussianRandom(prng) {
  let u = 0, v = 0;
  while (u === 0) u = prng();
  while (v === 0) v = prng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export class NoiseADCEngine {
  static metadata = {
    name: "NoiseADCEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["gaussianNoise", "adcQuantization", "deterministicPRNG"]
  };

  /**
   * Validates engine input parameters.
   */
  validate(context) {
    const bitDepth = context.adcBitDepth || 16;
    if (bitDepth < 8 || bitDepth > 24) {
      return { valid: false, errors: ["ADC Bit Depth must be between 8 and 24 bits."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Processes raw signal points by injecting white noise & ADC LSB quantization.
   * @param {Object} context - Read-only SimulationContext snapshot
   * @returns {Object} Context patch with digitized points & quantization SNR
   */
  process(context) {
    const rawPoints = context.signalPoints || [];
    const noiseLevel = context.noiseLevel !== undefined ? context.noiseLevel : 0.0002; // AU
    const bitDepth = context.adcBitDepth || 16;
    const fullScaleAU = context.fullScaleAU || 2.5; // AU
    const seed = context.seed || 42;

    const prng = mulberry32(seed);
    const numLevels = Math.pow(2, bitDepth) - 1;
    const lsb = fullScaleAU / numLevels;

    const digitizedPoints = rawPoints.map(p => {
      // 1. Thermal Gaussian White Noise Injection
      const noise = gaussianRandom(prng) * noiseLevel;
      const noisyIntensity = p.intensity + noise;

      // 2. ADC Quantization Rounding to LSB
      const quantizedSteps = Math.round(noisyIntensity / lsb);
      const digitizedIntensity = Math.max(0, quantizedSteps * lsb);

      return {
        time: p.time,
        intensity: digitizedIntensity
      };
    });

    // Ideal Quantization SNR (dB) = 6.02 * n + 1.76
    const idealSnrDb = (6.02 * bitDepth) + 1.76;

    return {
      digitizedPoints,
      adcMetrics: {
        bitDepth,
        fullScaleAU,
        lsb,
        idealSnrDb
      }
    };
  }

  report(context) {
    return {
      engine: NoiseADCEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
