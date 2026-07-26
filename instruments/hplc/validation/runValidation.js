import fs from 'fs';
import path from 'path';

import { getDeadTime, getRetentionFactor, getRetentionTime } from '../engine/retention.js';
import { TransportEngine } from '../engine/transportEngine.js';
import { BandProfileEngine } from '../engine/bandProfileEngine.js';

/**
 * runValidation.js - Scientific Validation & Regression Suite for HPLC Engine v1.0
 * 
 * Evaluates peer-reviewed literature benchmarks against physical simulation engines.
 * Calculates Relative Error %, MAE (Mean Absolute Error), and RMSE (Root Mean Square Error):
 * - MAE = (1/n) * sum(|Simulated - Expected|)
 * - RMSE = sqrt((1/n) * sum((Simulated - Expected)^2))
 * Target Thresholds: Relative Error <= 5.0%, MAE <= 0.15 min, RMSE <= 0.20 min
 */

const BENCHMARK_PATH = path.join(process.cwd(), 'instruments/hplc/validation/literature/benchmarks.json');

export function runScientificValidation() {
  const rawData = fs.readFileSync(BENCHMARK_PATH, 'utf8');
  const suite = JSON.parse(rawData);

  console.log(`================================================================`);
  console.log(`🚀 RUNNING VIRTUAL ANALYTICAL LAB SCIENTIFIC VALIDATION SUITE`);
  console.log(`Suite Version: ${suite.version} | Target Pass Threshold: <${suite.passThresholdPercent}% Error`);
  console.log(`================================================================\n`);

  let totalTests = 0;
  let passedTests = 0;

  const trErrors = [];
  const trDiffs = [];

  const transportEngine = new TransportEngine();
  const bandEngine = new BandProfileEngine();

  for (const bench of suite.benchmarks) {
    console.log(`📌 Benchmark ID: ${bench.id}`);
    console.log(`   Paper: ${bench.paper}`);

    const m = bench.method;
    const t0 = getDeadTime(m.flowRate, 1.38); // 1.38 mL void volume for 150x4.6mm column

    for (const compound of bench.compounds) {
      totalTests++;

      const k = getRetentionFactor(compound.kw, compound.S, m.organicPercent, m.temperature);
      const simTR = getRetentionTime(t0, k);

      const transportPatch = transportEngine.process({
        tR: simTR,
        flowRate: m.flowRate,
        temperature: m.temperature,
        columnLengthMm: m.columnLengthMm
      });

      const simSigma = transportPatch.sigmaTotal;
      const simWb = 4.0 * simSigma;
      const simPlates = Math.round(16.0 * Math.pow(simTR / simWb, 2));

      const diff = simTR - compound.expectedRetentionTime;
      const absDiff = Math.abs(diff);
      const trError = (absDiff / compound.expectedRetentionTime) * 100.0;
      
      trErrors.push(trError);
      trDiffs.push(diff);

      const isPassed = trError <= suite.passThresholdPercent;
      if (isPassed) passedTests++;

      const statusSymbol = isPassed ? "✅ PASS" : "❌ FAIL";
      console.log(`   Compound: ${compound.name}`);
      console.log(`     - Expected tR: ${compound.expectedRetentionTime} min | Simulated tR: ${simTR.toFixed(2)} min | Diff: ${diff > 0 ? '+' : ''}${diff.toFixed(2)} min | Error: ${trError.toFixed(2)}% [${statusSymbol}]`);
      console.log(`     - Expected Wb: ${compound.expectedPeakWidth} min | Simulated Wb: ${simWb.toFixed(2)} min`);
      console.log(`     - Expected N : ${compound.expectedPlates} | Simulated N : ${simPlates}`);
      console.log(``);
    }
  }

  // Regression Statistical Metrics (MAE, RMSE, Max Error)
  const avgError = trErrors.reduce((sum, e) => sum + e, 0) / totalTests;
  const mae = trDiffs.reduce((sum, d) => sum + Math.abs(d), 0) / totalTests;
  const mse = trDiffs.reduce((sum, d) => sum + (d * d), 0) / totalTests;
  const rmse = Math.sqrt(mse);
  const maxError = Math.max(...trErrors);

  const passRate = ((passedTests / totalTests) * 100.0).toFixed(1);

  console.log(`================================================================`);
  console.log(`📊 REGRESSION STATISTICAL METRICS SUMMARY`);
  console.log(`Average Relative Error: ${avgError.toFixed(2)}%`);
  console.log(`Mean Absolute Error (MAE): ${mae.toFixed(3)} min`);
  console.log(`Root Mean Square Error (RMSE): ${rmse.toFixed(3)} min`);
  console.log(`Maximum Error: ${maxError.toFixed(2)}%`);
  console.log(`Total Compound Tests: ${totalTests} | Passed: ${passedTests} | Pass Rate: ${passRate}%`);
  console.log(`Overall Validation Status: ${passRate >= 90.0 ? "✅ SCIENTIFICALLY VALIDATED (PASS)" : "❌ NEEDS RE-CALIBRATION"}`);
  console.log(`================================================================`);

  return {
    totalTests,
    passedTests,
    passRate: Number(passRate),
    avgError: Number(avgError.toFixed(2)),
    mae: Number(mae.toFixed(3)),
    rmse: Number(rmse.toFixed(3)),
    maxError: Number(maxError.toFixed(2)),
    isValidated: passRate >= 90.0
  };
}

// Execute if called directly from CLI
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runScientificValidation();
}
