/**
 * gcEngine.js — Gas Chromatography Physical Engine
 *
 * Implements capillary column retention, carrier gas velocity, oven temperature ramp, and FID signal.
 */

const CARRIER_GAS_PROPERTIES = {
  Helium:   { uOpt: 35, pros: 'Optimal resolution & safety balance', cons: 'Non-renewable supply' },
  Hydrogen: { uOpt: 45, pros: 'Fastest analysis time & high efficiency', cons: 'Flammable gas hazard' },
  Nitrogen: { uOpt: 15, pros: 'Inexpensive & safe', cons: 'Narrow optimal velocity range' }
};

export class GcEngine {
  constructor() {
    this.carrierGas = {
      gasType: 'Helium',
      getOptimumVelocity() {
        return (CARRIER_GAS_PROPERTIES[this.gasType] || CARRIER_GAS_PROPERTIES.Helium).uOpt;
      }
    };
    this.oven = {
      initialTemp: 60,
      holdTime: 1.0,
      rampRate: 10,
      finalTemp: 200,
      getTemperatureAtTime(t) {
        if (t <= this.holdTime) return this.initialTemp;
        const ramped = this.initialTemp + (t - this.holdTime) * this.rampRate;
        return Math.min(ramped, this.finalTemp);
      }
    };
    this.splitRatio = 20; // 1:20 split
    this.injectionMode = 'split'; // 'split' | 'splitless'
  }

  /**
   * Calculate Effective Carbon Number (ECN) for Flame Ionization Detector response
   * @param {{formula: string, name: string, ecn?: number}} c
   * @returns {number}
   */
  getEffectiveCarbonNumber(c) {
    if (typeof c.ecn === 'number') return c.ecn;
    const formula = c.formula || '';
    const cMatch = formula.match(/C(\d*)/);
    let cCount = 1;
    if (cMatch) {
      cCount = cMatch[1] ? parseInt(cMatch[1], 10) : 1;
    }
    // ECN reduction rules for oxygenated functional groups (Sternberg et al.)
    let ecn = cCount;
    if (formula.includes('OH')) {
      ecn = Math.max(0.6, cCount - 0.5);
    } else if (formula.includes('O')) {
      ecn = Math.max(0.8, cCount - 1.0);
    }
    return Math.max(0.5, ecn);
  }

  /**
   * Pre-compute peak parameters at injection time.
   * Single source of truth for retention time, width, and peak height.
   * @param {Array<{name: string, kovatsIndex: number, formula?: string}>} compounds
   * @returns {Array<{name, tR, sigma, height, area}>}
   */
  computePeaks(compounds = []) {
    const velocityFactor = 35 / this.carrierGas.getOptimumVelocity();
    const tempFactor = Math.exp(-0.015 * (this.oven.initialTemp + this.oven.rampRate));
    
    return compounds.map(c => {
      const kovats = c.kovatsIndex || 600;
      const tR     = Math.max(0.8, (kovats / 100) * 0.8 * velocityFactor * tempFactor);
      const sigma  = 0.08 + tR * 0.015;
      
      // FID Ionization signal proportional to Effective Carbon Number (ECN)
      const ecn = this.getEffectiveCarbonNumber(c);
      const baseSens = this.injectionMode === 'split' 
        ? (100 / Math.max(1, this.splitRatio)) * 18.0 
        : 180.0;
      const height = Math.max(10, baseSens * ecn);
      const area = Math.round(height * sigma * Math.sqrt(2 * Math.PI) * 10) / 10;

      return {
        name: c.name,
        formula: c.formula || '',
        kovatsIndex: kovats,
        ecn: Math.round(ecn * 10) / 10,
        tR: Math.round(tR * 100) / 100,
        sigma: Math.round(sigma * 1000) / 1000,
        width: Math.round(sigma * 4 * 100) / 100, // Peak width W = 4*sigma
        height: Math.round(height * 10) / 10,
        area
      };
    }).sort((a, b) => a.tR - b.tR);
  }

  /**
   * Compute instantaneous FID signal (pA) at time t using pre-computed peaks.
   * Call every tick.
   * @param {number} t - run time in minutes
   * @param {Array} peaks - output of computePeaks()
   * @returns {number} FID signal in pA
   */
  getFidSignal(t, peaks = []) {
    let signal = 0.5; // FID baseline flame current (pA)

    // Solvent front / Air peak at t = 0.15 min right after sample injection
    if (t >= 0.05 && t <= 0.35) {
      signal += 18.0 * Math.exp(-Math.pow(t - 0.15, 2) / (2 * Math.pow(0.025, 2)));
    }

    for (const p of peaks) {
      signal += p.height * Math.exp(-Math.pow(t - p.tR, 2) / (2 * Math.pow(p.sigma, 2)));
    }
    return signal;
  }
}
