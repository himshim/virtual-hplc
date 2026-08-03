/**
 * SimulationEvents.js — Standard Simulation Event Constants & EventBus
 *
 * Provides a lightweight EventBus and standardized event name constants
 * for the real-time simulation runtime.
 */

export const SIMULATION_EVENTS = Object.freeze({
  INIT: 'simulation:init',
  WARMUP_START: 'simulation:warmup_start',
  WARMUP_COMPLETE: 'simulation:warmup_complete',
  READY: 'simulation:ready',
  PLAY: 'simulation:play',
  TICK: 'simulation:tick',
  PAUSE: 'simulation:pause',
  RESUME: 'simulation:resume',
  STEP: 'simulation:step',
  COMPLETE: 'simulation:complete',
  RESET: 'simulation:reset',
  SPEED_CHANGE: 'simulation:speed_change',
  ERROR: 'simulation:error'
});

export class SimulationEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(fn);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const fn of this.listeners.get(event)) {
        try {
          fn(data);
        } catch (err) {
          console.error(`[SimulationEventBus] Error in listener for "${event}":`, err);
        }
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
