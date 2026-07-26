/**
 * SimulationClock.js - High-Precision Simulation Timekeeper
 * Manages simulation clock ticking, real-to-simulation time scaling, and pause/resume lifecycle.
 */
export class SimulationClock {
  /**
   * @param {Object} options
   * @param {number} [options.tickMs=50] - Interval between ticks in milliseconds
   * @param {number} [options.speedMultiplier=10] - Initial simulation speed multiplier (e.g. 10x)
   * @param {Function} [options.onTick] - Callback executed on each tick with delta simulation time
   */
  constructor({ tickMs = 50, speedMultiplier = 10, onTick = null } = {}) {
    this.tickMs = tickMs;
    this.speedMultiplier = speedMultiplier;
    this.onTick = onTick;
    this.timerId = null;
    this.isRunning = false;
    this.lastRealTime = null;
    this.simulationTime = 0;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(1, multiplier);
  }

  setTickCallback(callback) {
    this.onTick = callback;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastRealTime = performance.now();
    this.timerId = setInterval(() => this._tick(), this.tickMs);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  reset() {
    this.stop();
    this.simulationTime = 0;
    this.lastRealTime = null;
  }

  _tick() {
    const now = performance.now();
    const deltaRealMs = now - (this.lastRealTime || now);
    this.lastRealTime = now;

    // Convert real milliseconds to simulation minutes based on multiplier
    // Standard baseline: 1 simulation minute = 60 real seconds at 1x speed
    const deltaSimMinutes = (deltaRealMs / 1000 / 60) * this.speedMultiplier;
    this.simulationTime += deltaSimMinutes;

    if (typeof this.onTick === 'function') {
      this.onTick(deltaSimMinutes, this.simulationTime);
    }
  }
}
