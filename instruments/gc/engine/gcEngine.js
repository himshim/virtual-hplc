/**
 * gcEngine.js — Gas Chromatography Physical Engine
 *
 * Implements 6 sub-models: Column, Carrier Gas, Oven Program, Retention, Injection, FID Detector.
 */

export class ColumnModel {
  constructor(options = {}) {
    this.length = options.length || 30; // meters
    this.internalDiameter = options.internalDiameter || 0.25; // mm
    this.filmThickness = options.filmThickness || 0.25; // micrometers
    this.phase = options.phase || '5% Phenyl Polysiloxane (DB-5)';
  }
}

export class CarrierGasModel {
  constructor(gasType = 'Helium') {
    this.gasType = gasType;
    this.properties = {
      Helium: { viscosity: 1.96e-5, uOpt: 35, pros: 'Optimal resolution & safety balance', cons: 'Non-renewable supply' },
      Hydrogen: { viscosity: 0.89e-5, uOpt: 45, pros: 'Fastest analysis time & high efficiency', cons: 'Flammable gas hazard' },
      Nitrogen: { viscosity: 1.78e-5, uOpt: 15, pros: 'Inexpensive & safe', cons: 'Narrow optimal velocity range' }
    };
  }

  getOptimumVelocity() {
    return (this.properties[this.gasType] || this.properties.Helium).uOpt;
  }
}

export class OvenModel {
  constructor(options = {}) {
    this.initialTemp = options.initialTemp || 60; // °C
    this.holdTime = options.holdTime || 1.0; // min
    this.rampRate = options.rampRate || 10; // °C/min
    this.finalTemp = options.finalTemp || 200; // °C
  }

  getTemperatureAtTime(t) {
    if (t <= this.holdTime) return this.initialTemp;
    const rampedTemp = this.initialTemp + (t - this.holdTime) * this.rampRate;
    return Math.min(rampedTemp, this.finalTemp);
  }
}

export class GcEngine {
  constructor() {
    this.column = new ColumnModel();
    this.carrierGas = new CarrierGasModel('Helium');
    this.oven = new OvenModel();
    this.splitRatio = 20; // 1:20 split
    this.injectionMode = 'split'; // 'split' | 'splitless'
  }

  /**
   * Pre-compute peak parameters at injection time.
   * Single source of truth for retention time, width, and peak height.
   * @param {Array<{name: string, kovatsIndex: number}>} compounds
   * @returns {Array<{name, tR, sigma, height, area}>}
   */
  computePeaks(compounds = []) {
    const velocityFactor = 35 / this.carrierGas.getOptimumVelocity(); // He=1.0, H2≈0.78, N2≈2.33
    const tempFactor = Math.exp(-0.015 * (this.oven.initialTemp + this.oven.rampRate));
    
    return compounds.map(c => {
      const kovats = c.kovatsIndex || 600;
      const tR     = Math.max(0.8, (kovats / 100) * 0.8 * velocityFactor * tempFactor);
      const sigma  = 0.08 + tR * 0.015;
      
      // Peak height & area scaling
      const height = this.injectionMode === 'split' 
        ? (100 / Math.max(1, this.splitRatio)) * 50 
        : 500.0;
      const area = Math.round(height * sigma * Math.sqrt(2 * Math.PI) * 10) / 10;

      return {
        name: c.name,
        formula: c.formula || '',
        kovatsIndex: kovats,
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

  calculateChromatogram(compounds = [], totalTime = 8.0) {
    const points = [];
    const dt = 0.02;
    const peaks = this.computePeaks(compounds);

    for (let t = 0; t <= totalTime; t += dt) {
      const signal = this.getFidSignal(t, peaks);
      points.push({ x: Number(t.toFixed(2)), y: Number(signal.toFixed(2)) });
    }

    return { maxTime: totalTime, points, peaks };
  }
}
