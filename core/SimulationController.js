import { EventBus } from './EventBus.js';
import { SimulationClock } from './SimulationClock.js';
import { StateMachine } from './StateMachine.js';

/**
 * SimulationController.js - Generic Base Instrument Controller
 * Combines EventBus, SimulationClock, and StateMachine into a reusable orchestrator.
 */
export class SimulationController {
  /**
   * @param {Object} config
   * @param {string} config.initialState
   * @param {Object} config.transitionRules
   * @param {number} [config.tickMs=50]
   * @param {number} [config.speedMultiplier=10]
   */
  constructor({ initialState, transitionRules, tickMs = 50, speedMultiplier = 10 }) {
    this.eventBus = new EventBus();
    this.stateMachine = new StateMachine(initialState, transitionRules);
    this.clock = new SimulationClock({
      tickMs,
      speedMultiplier,
      onTick: (deltaSimMin, totalSimMin) => this.onTick(deltaSimMin, totalSimMin)
    });

    this.stateMachine.setOnStateChange((newState, oldState, meta) => {
      this.eventBus.emit('statusChanged', { newState, oldState, meta });
    });
  }

  getState() {
    return this.stateMachine.getState();
  }

  setSpeed(multiplier) {
    this.clock.setSpeed(multiplier);
    this.eventBus.emit('speedChanged', { speedMultiplier: multiplier });
  }

  // Abstract hook for instrument-specific tick logic
  onTick(deltaSimMin, totalSimMin) {
    // Implemented by derived instrument controllers (e.g. HplcController)
  }
}
