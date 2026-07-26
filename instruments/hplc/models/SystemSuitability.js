/**
 * SystemSuitability.js - System Suitability Evaluation Result Container
 */
export class SystemSuitability {
  constructor({
    score = 100,
    status = "EXCELLENT",
    criteriaUsed = "USP",
    passedChecks = [],
    failedChecks = [],
    warnings = [],
    diagnostics = [],
    methodQuality = "Excellent Method",
    timestamp = new Date().toISOString()
  } = {}) {
    this.score = score;
    this.status = status; // EXCELLENT, GOOD, MARGINAL, FAILED
    this.criteriaUsed = criteriaUsed;
    this.passedChecks = [...passedChecks];
    this.failedChecks = [...failedChecks];
    this.warnings = [...warnings];
    this.diagnostics = [...diagnostics]; // Array of { rule, cause, recommendation }
    this.methodQuality = methodQuality;
    this.timestamp = timestamp;
  }
}
