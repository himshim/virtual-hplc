/**
 * sequenceSchedulerEngine.js - Phase J Automated Sequence Scheduler & Batch Workflow Engine
 * 
 * Implements standard BaseEngine interface.
 * Manages multi-injection batch sequences (Blank -> SST Standard -> Calibration -> Unknowns -> Wash).
 * Automates System Suitability Testing (SST) pass/fail criteria (%RSD of tR <= 1.0%, %RSD of Area <= 1.5%)
 * and controls sequence progression or emergency halt.
 * 
 * Sequence Line Types:
 * 1. BLANK: Reagent blank for baseline stabilization and ghost peak check.
 * 2. SST: System Suitability Test replicate standards.
 * 3. STANDARD: Calibration standards for linear regression quantification.
 * 4. UNKNOWN: Analytical unknown samples.
 * 5. WASH: Post-run column flush & solvent storage.
 */

export class SequenceSchedulerEngine {
  static metadata = {
    name: "SequenceSchedulerEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["sequenceExecution", "sstValidation", "batchAutomation", "rsdCalculation", "emergencyHalt"]
  };

  validate(context) {
    const sequenceLines = context.sequenceLines || [];
    if (!Array.isArray(sequenceLines) || sequenceLines.length === 0) {
      return { valid: false, errors: ["Sequence must contain at least one valid sequence line."] };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Calculates Mean & Percent Relative Standard Deviation (%RSD) for SST metrics.
   */
  static calculateRsd(values) {
    if (!Array.isArray(values) || values.length === 0) return { mean: 0, stdDev: 0, rsdPercent: 0 };
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    if (values.length <= 1) return { mean, stdDev: 0, rsdPercent: 0 };

    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
    const stdDev = Math.sqrt(variance);
    const rsdPercent = mean !== 0 ? (stdDev / mean) * 100.0 : 0.0;

    return {
      mean: Number(mean.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      rsdPercent: Number(rsdPercent.toFixed(2))
    };
  }

  /**
   * Processes current sequence state and evaluates SST pass/fail status.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with sequenceState and sstReport
   */
  process(context) {
    const sequenceLines = context.sequenceLines || [];
    const currentIndex = Math.max(0, context.currentLineIndex || 0);
    const sstHistory = context.sstHistory || []; // Array of previous SST run results { tR, area }

    const activeLine = sequenceLines[currentIndex] || sequenceLines[0];
    const totalLines = sequenceLines.length;

    // Evaluate SST if current line or history contains SST replicates
    let sstReport = {
      evaluated: false,
      passed: true,
      tR_RSD: 0.0,
      area_RSD: 0.0,
      message: "No SST evaluation required for current line."
    };

    if (sstHistory.length >= 2) {
      const tRValues = sstHistory.map(h => h.tR);
      const areaValues = sstHistory.map(h => h.area);

      const tRRsd = SequenceSchedulerEngine.calculateRsd(tRValues);
      const areaRsd = SequenceSchedulerEngine.calculateRsd(areaValues);

      const isTRPassed = tRRsd.rsdPercent <= 1.0;
      const isAreaPassed = areaRsd.rsdPercent <= 1.5;
      const isSstPassed = isTRPassed && isAreaPassed;

      sstReport = {
        evaluated: true,
        passed: isSstPassed,
        tR_RSD: tRRsd.rsdPercent,
        area_RSD: areaRsd.rsdPercent,
        isTRPassed,
        isAreaPassed,
        message: isSstPassed 
          ? "✅ SST PASSED: Retention time %RSD <= 1.0%, Peak Area %RSD <= 1.5%."
          : "❌ SST FAILED: System suitability criteria exceeded limit. Sequence halted."
      };
    }

    const progressPercent = Math.round(((currentIndex + 1) / totalLines) * 100);
    const isCompleted = currentIndex >= totalLines - 1;

    return {
      sequenceState: {
        currentIndex,
        totalLines,
        activeLine,
        progressPercent,
        isCompleted,
        status: !sstReport.passed ? "HALTED_SST_FAIL" : (isCompleted ? "COMPLETED" : "RUNNING")
      },
      sstReport
    };
  }

  report(context) {
    return {
      engine: SequenceSchedulerEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
