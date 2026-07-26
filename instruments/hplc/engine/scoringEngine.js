/**
 * scoringEngine.js - Method Development Exercise Score & Qualification Engine
 */

export function scoreMethodExercise(runResult, exerciseProfile) {
  if (!runResult || !exerciseProfile) return { score: 0, status: "UNEVALUATED", objectives: [] };

  const p = runResult.maxPressure;
  const tRun = runResult.elapsedTime;
  const validRs = runResult.peaks ? runResult.peaks.filter(pk => pk.resolution !== null).map(pk => pk.resolution) : [];
  const minRs = validRs.length > 0 ? Math.min(...validRs) : 0;
  const minPlates = runResult.peaks ? Math.min(...runResult.peaks.map(pk => pk.plates)) : 0;

  const objectives = [
    {
      id: "RESOLUTION",
      label: `Baseline Resolution (Rs >= ${exerciseProfile.targetResolution})`,
      passed: minRs >= exerciseProfile.targetResolution,
      actual: `Min Rs = ${minRs.toFixed(2)}`
    },
    {
      id: "PLATES",
      label: `Column Efficiency (Plates N >= ${exerciseProfile.targetPlates})`,
      passed: minPlates >= exerciseProfile.targetPlates,
      actual: `Min N = ${Math.round(minPlates)}`
    },
    {
      id: "PRESSURE",
      label: `Safe System Pressure (P <= ${exerciseProfile.maxPressureBar} bar)`,
      passed: p <= exerciseProfile.maxPressureBar,
      actual: `${Math.round(p)} bar`
    },
    {
      id: "RUNTIME",
      label: `Throughput Run Time (t <= ${exerciseProfile.maxRunTimeMinutes} min)`,
      passed: tRun <= exerciseProfile.maxRunTimeMinutes,
      actual: `${tRun.toFixed(1)} min`
    }
  ];

  const passedCount = objectives.filter(o => o.passed).length;
  const score = Math.round((passedCount / objectives.length) * 100);

  let status = "FAILED";
  let grade = "Unoptimized Method";

  if (score === 100) {
    status = "OPTIMAL";
    grade = "🌟 Optimized Method (All Targets Met)";
  } else if (score >= 75) {
    status = "ACCEPTABLE";
    grade = "Acceptable Method";
  } else if (score >= 50) {
    status = "MARGINAL";
    grade = "Marginal Method";
  }

  return {
    score,
    status,
    grade,
    objectives
  };
}
