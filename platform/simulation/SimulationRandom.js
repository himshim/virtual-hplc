/**
 * SimulationRandom.js — Seeded Pseudo-Random Number Generator (PRNG)
 *
 * Implements a fast 32-bit Mulberry32 PRNG for deterministic simulation runs,
 * reproducible noise generation, and headless test suites.
 */

export class SimulationRandom {
  /**
   * @param {number} seed - Initial integer seed (default 1337)
   */
  constructor(seed = 1337) {
    this.initialSeed = seed;
    this.seed = seed;
  }

  /** Reset PRNG back to initial seed */
  reset() {
    this.seed = this.initialSeed;
  }

  /** Set a new seed and reset */
  setSeed(seed) {
    this.initialSeed = seed;
    this.seed = seed;
  }

  /**
   * Returns pseudo-random float in range [0, 1)
   * Algorithm: Mulberry32
   */
  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns pseudo-random float in range [min, max) */
  range(min, max) {
    return min + this.next() * (max - min);
  }

  /**
   * Generates Gaussian white noise (Box-Muller transformation)
   * @param {number} mean - Noise mean (default 0)
   * @param {number} stdDev - Standard deviation (default 1.0)
   */
  gaussian(mean = 0, stdDev = 1.0) {
    const u1 = Math.max(1e-10, this.next());
    const u2 = Math.max(1e-10, this.next());
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}
