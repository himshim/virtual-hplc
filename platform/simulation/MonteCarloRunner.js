/**
 * MonteCarloRunner.js — Shared Monte Carlo Stress Simulation Engine
 */

export class MonteCarloRunner {
  constructor(simulationFn, invariantCheckers = []) {
    this.simulationFn = simulationFn;
    this.invariantCheckers = invariantCheckers;
  }

  run(iterations = 1000) {
    let passes = 0;
    let failures = 0;
    const errors = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const result = this.simulationFn(i);
        const valid = this.invariantCheckers.every(checker => checker(result));
        if (valid) {
          passes++;
        } else {
          failures++;
          errors.push(`Run ${i}: Invariant check failed`);
        }
      } catch (err) {
        failures++;
        errors.push(`Run ${i}: Exception ${err.message}`);
      }
    }

    return { iterations, passes, failures, errors };
  }
}
