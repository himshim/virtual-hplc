/**
 * SimulationContext.js — Immutable Tick Context Container
 *
 * Encapsulates all state provided to an instrument's tick(context) method:
 * elapsed time, delta time, speed multiplier, seed PRNG, and event bus.
 */

import { SimulationRandom } from './SimulationRandom.js';
import { SimulationEventBus } from './SimulationEvents.js';

export class SimulationContext {
  /**
   * @param {Object} options
   * @param {number} [options.elapsedTime=0] - Total elapsed simulation time in seconds
   * @param {number} [options.deltaTime=0.05] - Time delta for current tick in seconds
   * @param {number} [options.speedMultiplier=1] - Speed scale factor (1x, 2x, 5x)
   * @param {string} [options.instrumentId='generic'] - Instrument identifier
   * @param {string} [options.lifecycleState='IDLE'] - Current lifecycle state
   * @param {SimulationRandom} [options.random] - Seeded PRNG instance
   * @param {SimulationEventBus} [options.eventBus] - Event bus instance
   */
  constructor(options = {}) {
    this.elapsedTime = options.elapsedTime || 0;
    this.deltaTime = options.deltaTime || 0.05;
    this.speedMultiplier = options.speedMultiplier || 1;
    this.instrumentId = options.instrumentId || 'generic';
    this.lifecycleState = options.lifecycleState || 'IDLE';
    this.random = options.random || new SimulationRandom();
    this.eventBus = options.eventBus || new SimulationEventBus();

    Object.freeze(this);
  }

  /**
   * Creates a new immutable SimulationContext with updated properties
   * @param {Object} updates
   * @returns {SimulationContext}
   */
  with(updates = {}) {
    return new SimulationContext({
      elapsedTime: updates.elapsedTime !== undefined ? updates.elapsedTime : this.elapsedTime,
      deltaTime: updates.deltaTime !== undefined ? updates.deltaTime : this.deltaTime,
      speedMultiplier: updates.speedMultiplier !== undefined ? updates.speedMultiplier : this.speedMultiplier,
      instrumentId: updates.instrumentId !== undefined ? updates.instrumentId : this.instrumentId,
      lifecycleState: updates.lifecycleState !== undefined ? updates.lifecycleState : this.lifecycleState,
      random: updates.random || this.random,
      eventBus: updates.eventBus || this.eventBus
    });
  }
}
