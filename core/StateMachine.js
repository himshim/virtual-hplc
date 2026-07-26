/**
 * StateMachine.js - Generic Instrument Lifecycle State Machine
 * Guards state transitions and triggers state change event notifications.
 */
export class StateMachine {
  /**
   * @param {string} initialState - Initial state string
   * @param {Object.<string, Array<string>>} transitionRules - Map of valid target states for each current state
   */
  constructor(initialState, transitionRules = {}) {
    this.state = initialState;
    this.rules = transitionRules;
    this.onStateChange = null;
  }

  getState() {
    return this.state;
  }

  setOnStateChange(callback) {
    this.onStateChange = callback;
  }

  canTransitionTo(targetState) {
    if (!this.rules[this.state]) return true; // Default to open transition if rules omitted
    return this.rules[this.state].includes(targetState);
  }

  transitionTo(targetState, meta = {}) {
    if (this.state === targetState) return false;

    if (!this.canTransitionTo(targetState)) {
      console.warn(`Invalid state transition attempted from "${this.state}" to "${targetState}"`);
      return false;
    }

    const previousState = this.state;
    this.state = targetState;

    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.state, previousState, meta);
    }
    return true;
  }
}
