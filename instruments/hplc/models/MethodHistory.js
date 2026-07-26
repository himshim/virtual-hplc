/**
 * MethodHistory.js - Session Run History Buffer
 * Accumulates sequence of completed methods in active laboratory session.
 */
export class MethodHistory {
  constructor() {
    this.history = []; // Array of RunResult objects
  }

  addRun(runResult) {
    this.history.push(runResult);
  }

  clear() {
    this.history = [];
  }

  getRuns() {
    return this.history;
  }

  getLastRun() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  getPreviousRun() {
    return this.history.length > 1 ? this.history[this.history.length - 2] : null;
  }
}
