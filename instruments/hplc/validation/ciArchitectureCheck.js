import fs from 'fs';
import path from 'path';
import { runScientificValidation } from './runValidation.js';
import { HPLC_EVENTS } from '../controller/HplcEvents.js';
import { getBaselineNoise } from '../engine/detector.js';

/**
 * ciArchitectureCheck.js — Automated CI Architectural Gate & Health Check
 *
 * Enforces strict architectural & scientific quality gates:
 * 1. Architecture Gate: 0 UI->Engine imports, 0 Engine->UI/DOM imports, 0 Circular imports
 * 2. Event Integrity Gate: Unique & centralized HPLC_EVENTS definitions
 * 3. Determinism Gate: Bit-identical output given identical seeds
 * 4. Scientific Validation Gate: All benchmark validation cases pass (< 5% error)
 */

function scanDirectory(dir, extension = '.js') {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectory(filePath, extension));
    } else if (file.endsWith(extension)) {
      results.push(filePath);
    }
  });
  return results;
}

export function runCiArchitectureCheck() {
  console.log('================================================================');
  console.log('🛡️ RUNNING AUTOMATED CI ARCHITECTURAL & QUALITY GATES');
  console.log('================================================================\n');

  let totalErrors = 0;

  // Gate 1: Architecture - UI & Engine Import Boundaries
  const uiFiles = scanDirectory('./instruments/hplc/ui');
  let uiEngineViolations = 0;

  uiFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('/engine/') || content.includes('retention.js') || content.includes('suitability.js')) {
      console.error(`❌ ARCHITECTURE VIOLATION: UI file "${file}" directly imports physics engine!`);
      uiEngineViolations++;
      totalErrors++;
    }
  });

  if (uiEngineViolations === 0) {
    console.log(`✅ Architecture Gate: 0 of ${uiFiles.length} UI modules import from /engine/`);
  }

  const engineFiles = scanDirectory('./instruments/hplc/engine');
  let engineUiViolations = 0;

  engineFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('/ui/') || content.includes('document.getElementById') || content.includes('window.')) {
      console.error(`❌ ARCHITECTURE VIOLATION: Engine file "${file}" directly imports UI or DOM!`);
      engineUiViolations++;
      totalErrors++;
    }
  });

  if (engineUiViolations === 0) {
    console.log(`✅ Architecture Gate: 0 of ${engineFiles.length} Physics Engine modules import from /ui/ or DOM`);
  }

  // Circular Dependency Check
  let circularViolations = 0;
  const allFiles = scanDirectory('./instruments/hplc');

  allFiles.forEach(fileA => {
    const contentA = fs.readFileSync(fileA, 'utf8');
    const nameA = path.basename(fileA);

    allFiles.forEach(fileB => {
      if (fileA === fileB) return;
      const contentB = fs.readFileSync(fileB, 'utf8');
      const nameB = path.basename(fileB);

      if (contentA.includes(nameB) && contentB.includes(nameA)) {
        console.error(`❌ CIRCULAR DEPENDENCY DETECTED between "${nameA}" and "${nameB}"`);
        circularViolations++;
        totalErrors++;
      }
    });
  });

  if (circularViolations === 0) {
    console.log(`✅ Architecture Gate: 0 circular dependencies across ${allFiles.length} modules`);
  }

  // Gate 2: Event Registry Integrity
  const eventValues = Object.values(HPLC_EVENTS);
  const uniqueValues = new Set(eventValues);

  if (eventValues.length !== uniqueValues.size) {
    console.error(`❌ EVENT REGISTRY VIOLATION: Duplicate event strings detected in HPLC_EVENTS!`);
    totalErrors++;
  } else {
    console.log(`✅ Event Registry Gate: ${eventValues.length} unique event definitions verified`);
  }

  // Gate 3: Determinism Gate
  const sample1 = getBaselineNoise(1.5, 1.0, 254, 42);
  const sample2 = getBaselineNoise(1.5, 1.0, 254, 42);

  if (sample1 !== sample2) {
    console.error(`❌ DETERMINISM GATE FAILED: Identical seeds produced non-identical outputs (${sample1} vs ${sample2})`);
    totalErrors++;
  } else {
    console.log(`✅ Determinism Gate: Bit-identical PRNG baseline noise verified (seed = 42)`);
  }

  // Gate 4: Scientific Validation Regression Gate
  console.log('\n--- Running Scientific Validation Regression Gate ---');
  const valSummary = runScientificValidation();

  if (valSummary.passedCount < valSummary.totalCount) {
    console.error(`❌ SCIENTIFIC VALIDATION GATE FAILED: ${valSummary.passedCount}/${valSummary.totalCount} passed`);
    totalErrors++;
  } else {
    console.log(`✅ Scientific Validation Gate Passed: 100% Pass Rate across benchmark suite (${valSummary.passedCount}/${valSummary.totalCount})`);
  }

  console.log('\n================================================================');
  if (totalErrors === 0) {
    console.log('🎉 ALL CONFIGURABLE ARCHITECTURAL & VALIDATION GATES PASSED!');
    console.log('================================================================\n');
    return { success: true, totalErrors: 0 };
  } else {
    console.error(`💥 CI GATE FAILED: ${totalErrors} violation(s) found!`);
    console.log('================================================================\n');
    return { success: false, totalErrors };
  }
}

// Auto-execute if invoked directly via CLI
if (process.argv[1] && process.argv[1].endsWith('ciArchitectureCheck.js')) {
  const result = runCiArchitectureCheck();
  process.exit(result.success ? 0 : 1);
}
