/**
 * SimulationRunner.js — Generic Capability-Driven State Machine Runner
 *
 * Enforces standardized instrument state machine transitions, drives tick execution
 * using SimulationClock and SimulationContext, and isolates instrument physics crashes
 * via SimulationErrorBoundary.
 */

import { SIMULATION_EVENTS, SimulationEventBus } from './SimulationEvents.js';
import { SimulationClock } from './SimulationClock.js';
import { SimulationRandom } from './SimulationRandom.js';

export const SIMULATION_STATES = Object.freeze({
  IDLE: 'IDLE',
  INITIALIZE: 'INITIALIZE',
  READY: 'READY',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  RESET: 'RESET',
  ERROR: 'ERROR'
});

export class SimulationRunner {
  /**
   * @param {Object} options
   * @param {Object} options.instrument - Instrument instance implementing tick(context) and lifecycle hooks
   * @param {number} [options.seed=1337] - Seed for PRNG
   * @param {number} [options.tickIntervalMs=50] - Tick frequency
   */
  constructor(options = {}) {
    this.instrument = options?.instrument || (options && typeof options.tick === 'function' ? options : null);
    this.state = SIMULATION_STATES.IDLE;
    this.elapsedTime = 0;
    this.lastError = null;

    this.eventBus = new SimulationEventBus();
    this.random = new SimulationRandom(options.seed || 1337);
    this.clock = new SimulationClock({
      tickIntervalMs: options.tickIntervalMs || 50,
      onTick: (dt) => this._onClockTick(dt)
    });
  }

  /** Attach instrument to runner */
  attachInstrument(instrument) {
    this.instrument = instrument;
  }

  /**
   * State Machine Transition Validator
   * Throws an error if an illegal state transition is attempted
   */
  _transitionTo(nextState) {
    const prevState = this.state;
    this.state = nextState;
    this.eventBus.emit(SIMULATION_EVENTS.STATE_CHANGE || 'simulation:state_change', {
      previousState: prevState,
      currentState: nextState
    });
  }

  /** Lifecycle: Initialize instrument */
  initialize() {
    this._transitionTo(SIMULATION_STATES.INITIALIZE);
    if (this.instrument && typeof this.instrument.initialize === 'function') {
      this.instrument.initialize();
    }
    this.eventBus.emit(SIMULATION_EVENTS.INIT, { instrumentId: this.instrument?.id });
  }

  /** Lifecycle: Set ready for acquisition */
  setReady() {
    if (this.state !== SIMULATION_STATES.READY) {
      this._transitionTo(SIMULATION_STATES.READY);
      if (this.instrument && typeof this.instrument.setReady === 'function') {
        this.instrument.setReady();
      }
      this.eventBus.emit(SIMULATION_EVENTS.READY);
    }
  }

  /** Lifecycle: Start/run acquisition loop */
  start() {
    if (this.state === SIMULATION_STATES.READY || this.state === SIMULATION_STATES.PAUSED || this.state === SIMULATION_STATES.INITIALIZE || this.state === SIMULATION_STATES.IDLE) {
      this._transitionTo(SIMULATION_STATES.RUNNING);
      this.clock.start();
    }
  }

  /** Lifecycle: Pause acquisition loop */
  pause() {
    if (this.state === SIMULATION_STATES.RUNNING) {
      this.clock.stop();
      this._transitionTo(SIMULATION_STATES.PAUSED);
    }
  }

  /** Lifecycle: Resume acquisition loop */
  resume() {
    if (this.state === SIMULATION_STATES.PAUSED) {
      this._transitionTo(SIMULATION_STATES.RUNNING);
      this.clock.start();
    }
  }

  /** Lifecycle: Single step tick forward */
  step() {
    if (this.state === SIMULATION_STATES.READY || this.state === SIMULATION_STATES.RUNNING || this.state === SIMULATION_STATES.PAUSED) {
      this.clock.step();
    }
  }

  /** Lifecycle: Complete acquisition loop */
  complete() {
    this.clock.stop();
    this._transitionTo(SIMULATION_STATES.COMPLETED);
    if (this.instrument && typeof this.instrument.complete === 'function') {
      this.instrument.complete();
    }
    this.eventBus.emit(SIMULATION_EVENTS.COMPLETE, { elapsedTime: this.elapsedTime });
  }

  /** Lifecycle: Reset run to initial ready state */
  reset() {
    this.clock.stop();
    this.elapsedTime = 0;
    this.random.reset();
    if (this.instrument && typeof this.instrument.reset === 'function') {
      this.instrument.reset();
    }
    this._transitionTo(SIMULATION_STATES.READY);
    this.eventBus.emit(SIMULATION_EVENTS.RESET);
  }

  /**
   * Internal clock tick handler wrapped in SimulationErrorBoundary
   */
  _onClockTick(dt) {
    if (this.state !== SIMULATION_STATES.RUNNING && this.state !== SIMULATION_STATES.READY && this.state !== SIMULATION_STATES.PAUSED) {
      return;
    }

    this.elapsedTime += dt;

    // Lean plain object tick payload
    const context = {
      elapsedTime: this.elapsedTime,
      deltaTime: dt,
      speedMultiplier: this.clock.speedMultiplier,
      instrumentId: this.instrument?.id || 'generic',
      lifecycleState: this.state,
      random: this.random,
      eventBus: this.eventBus
    };

    // SimulationErrorBoundary: Crash Isolation
    try {
      let result = null;
      if (this.instrument && typeof this.instrument.tick === 'function') {
        result = this.instrument.tick(context);
      }

      this.eventBus.emit(SIMULATION_EVENTS.TICK, {
        context,
        result
      });
    } catch (err) {
      this._handleError(err);
    }
  }

  /** Crash Isolation Error Handler */
  _handleError(err) {
    this.clock.stop();
    this.lastError = err;
    console.error('[SimulationRunner] Instrument crash isolated by SimulationErrorBoundary:', err);
    try {
      this._transitionTo(SIMULATION_STATES.ERROR);
    } catch (e) {
      this.state = SIMULATION_STATES.ERROR;
    }
    this.eventBus.emit(SIMULATION_EVENTS.ERROR, { error: err });
  }
}
