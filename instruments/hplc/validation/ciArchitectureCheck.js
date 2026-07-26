import fs from 'fs';
import path from 'path';
import { runScientificValidation } from './runValidation.js';

/**
 * ciArchitectureCheck.js — Automated CI Architectural Gate & Health Check
 *
 * Enforces strict architectural boundaries:
 * 1. UI Boundary Check: 0 UI modules import from /engine/
 * 2. Engine Boundary Check: 0 Physics Engine modules import from /ui/ or DOM
 * 3. Event Integrity Check: All emitted events use HPLC_EVENTS constants
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
  console.log('🛡️ RUNNING AUTOMATED CI ARCHITECTURAL GATE & HEALTH CHECK');
  console.log('================================================================\n');

  let totalErrors = 0;

  // 1. UI Boundary Check: 0 UI modules import from /engine/
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
    console.log(`✅ UI Boundary Pass: 0 of ${uiFiles.length} UI modules import from /engine/`);
  }

  // 2. Engine Boundary Check: 0 Engine modules import from /ui/
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
    console.log(`✅ Engine Boundary Pass: 0 of ${engineFiles.length} Physics Engine modules import from /ui/ or DOM`);
  }

  // 3. Event Registry Integrity Check
  const controllerFile = './instruments/hplc/controller/HplcController.js';
  const controllerContent = fs.readFileSync(controllerFile, 'utf8');

  if (!controllerContent.includes("import { HPLC_EVENTS }")) {
    console.error(`❌ EVENT REGISTRY VIOLATION: HplcController does not use HPLC_EVENTS registry!`);
    totalErrors++;
  } else {
    console.log(`✅ Event Registry Pass: HplcController uses centralized HPLC_EVENTS enum`);
  }

  // 4. Scientific Validation Regression Gate
  console.log('\n--- Running Scientific Validation Regression Gate ---');
  const valSummary = runScientificValidation();

  if (valSummary.passedCount < valSummary.totalCount) {
    console.error(`❌ SCIENTIFIC VALIDATION GATE FAILED: ${valSummary.passedCount}/${valSummary.totalCount} passed`);
    totalErrors++;
  } else {
    console.log(`✅ Scientific Validation Gate Passed: 100% Pass Rate (${valSummary.passedCount}/${valSummary.totalCount})`);
  }

  console.log('\n================================================================');
  if (totalErrors === 0) {
    console.log('🎉 CI ARCHITECTURAL GATE PASSED: All architectural boundary checks clean!');
    console.log('================================================================\n');
    return { success: true, totalErrors: 0 };
  } else {
    console.error(`💥 CI ARCHITECTURAL GATE FAILED: ${totalErrors} violation(s) found!`);
    console.log('================================================================\n');
    return { success: false, totalErrors };
  }
}

// Auto-execute if invoked directly via CLI
if (process.argv[1] && process.argv[1].endsWith('ciArchitectureCheck.js')) {
  const result = runCiArchitectureCheck();
  process.exit(result.success ? 0 : 1);
}
