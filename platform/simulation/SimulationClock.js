/**
 * SimulationClock.js — Decoupled Tick Driver
 *
 * Drives the simulation loop using requestAnimationFrame in browser environments,
 * falling back to setInterval or injected tick callbacks in Node/test environments.
 */

export class SimulationClock {
  /**
   * @param {Object} options
   * @param {number} [options.tickIntervalMs=50] - Target tick interval in milliseconds (default 50ms = 20Hz)
   * @param {number} [options.speedMultiplier=1] - Speed scale factor
   * @param {Function} [options.onTick] - Callback executed per tick: (dtSeconds) => void
   */
  constructor(options = {}) {
    this.tickIntervalMs = options.tickIntervalMs || 50;
    this.speedMultiplier = options.speedMultiplier || 1;
    this.onTick = options.onTick || null;

    this.running = false;
    this.timerId = null;
    this.lastTimestamp = null;
  }

  /** Set speed multiplier (e.g. 1x, 2x, 5x, 10x) */
  setSpeed(multiplier = 1) {
    this.speedMultiplier = Math.max(0.1, Math.min(20, multiplier));
  }

  /** Start the clock tick loop */
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = (typeof performance !== 'undefined' && performance.now) 
      ? performance.now() 
      : Date.now();

    this._scheduleNextTick();
  }

  /** Stop/pause the clock tick loop */
  stop() {
    this.running = false;
    if (typeof cancelAnimationFrame !== 'undefined' && this.timerId && typeof this.timerId === 'number') {
      cancelAnimationFrame(this.timerId);
    } else if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.timerId = null;
    this.lastTimestamp = null;
  }

  /** Execute a single manual step tick (useful for step-forward debugging) */
  step() {
    const fixedDt = (this.tickIntervalMs / 1000) * this.speedMultiplier;
    if (this.onTick) {
      this.onTick(fixedDt);
    }
  }

  /** Internal loop scheduler */
  _scheduleNextTick() {
    if (!this.running) return;

    if (typeof requestAnimationFrame !== 'undefined') {
      this.timerId = requestAnimationFrame((now) => this._onAnimationFrame(now));
    } else {
      this.timerId = setInterval(() => {
        const dt = (this.tickIntervalMs / 1000) * this.speedMultiplier;
        if (this.onTick) this.onTick(dt);
      }, this.tickIntervalMs);
    }
  }

  /** RAF handler */
  _onAnimationFrame(now) {
    if (!this.running) return;

    const deltaMs = now - (this.lastTimestamp || now);
    // Cap max delta at 250ms to prevent huge jumps when switching tabs
    const clampedDeltaMs = Math.min(250, deltaMs);
    this.lastTimestamp = now;

    const dtSeconds = (clampedDeltaMs / 1000) * this.speedMultiplier;

    if (this.onTick && dtSeconds > 0) {
      this.onTick(dtSeconds);
    }

    if (this.running) {
      this.timerId = requestAnimationFrame((n) => this._onAnimationFrame(n));
    }
  }
}
