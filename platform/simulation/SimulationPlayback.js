/**
 * SimulationPlayback.js — UI-Agnostic Playback Controller
 *
 * Exposes pure playback control operations (play, pause, resume, stop, step, setSpeed)
 * without any DOM or button bindings. UI components bind to this controller.
 */

import { SIMULATION_EVENTS } from './SimulationEvents.js';

export class SimulationPlayback {
  /**
   * @param {Object} options
   * @param {SimulationRunner} options.runner - Target simulation runner instance
   */
  constructor(runner) {
    if (!runner) {
      throw new Error('[SimulationPlayback] Requires a SimulationRunner instance');
    }
    this.runner = runner;
  }

  /** Start simulation execution */
  play() {
    this.runner.start();
    this.runner.eventBus.emit(SIMULATION_EVENTS.PLAY, { state: this.runner.state });
  }

  /** Pause simulation execution */
  pause() {
    this.runner.pause();
    this.runner.eventBus.emit(SIMULATION_EVENTS.PAUSE, { state: this.runner.state });
  }

  /** Resume simulation from paused state */
  resume() {
    this.runner.resume();
    this.runner.eventBus.emit(SIMULATION_EVENTS.RESUME, { state: this.runner.state });
  }

  /** Stop/reset simulation execution */
  stop() {
    this.runner.reset();
    this.runner.eventBus.emit(SIMULATION_EVENTS.RESET, { state: this.runner.state });
  }

  /** Execute a single tick forward */
  step() {
    this.runner.step();
    this.runner.eventBus.emit(SIMULATION_EVENTS.STEP, { state: this.runner.state });
  }

  /** Set playback speed multiplier (1x, 2x, 5x, 10x) */
  setSpeed(multiplier = 1) {
    this.runner.clock.setSpeed(multiplier);
    this.runner.eventBus.emit(SIMULATION_EVENTS.SPEED_CHANGE, { speed: multiplier });
  }

  /** Get current speed multiplier */
  get speed() {
    return this.runner.clock.speedMultiplier;
  }
}
