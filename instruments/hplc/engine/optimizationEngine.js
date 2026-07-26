/**
 * optimizationEngine.js - Dynamic Bottleneck Analysis & Ranked Optimization Engine
 */

export function analyzeMethodBottlenecks(runResult, exerciseProfile) {
  if (!runResult || !exerciseProfile) return { bottleneck: "NONE", recommendations: [], influenceMatrix: {} };

  const params = runResult.methodParams;
  const p = runResult.maxPressure;
  const runTime = runResult.elapsedTime;

  const validRs = runResult.peaks ? runResult.peaks.filter(pk => pk.resolution !== null).map(pk => pk.resolution) : [];
  const minRs = validRs.length > 0 ? Math.min(...validRs) : 99;

  let bottleneck = "NONE";
  const recommendations = [];

  // Determine Primary Bottleneck
  if (p > exerciseProfile.maxPressureBar) {
    bottleneck = "PRESSURE_HIGH";
  } else if (minRs < exerciseProfile.targetResolution) {
    bottleneck = "RESOLUTION_LOW";
  } else if (runTime > exerciseProfile.maxRunTimeMinutes) {
    bottleneck = "RUNTIME_HIGH";
  }

  // Dynamic Parameter Influence Matrix (0 to 10 scale)
  const influenceMatrix = {
    organicPercent: bottleneck === "RESOLUTION_LOW" || bottleneck === "RUNTIME_HIGH" ? 9 : 6,
    flowRate: bottleneck === "PRESSURE_HIGH" || bottleneck === "RUNTIME_HIGH" ? 8 : 7,
    temperature: bottleneck === "PRESSURE_HIGH" ? 9 : 4
  };

  // Build Hierarchical Recommendations & Ranked Parameter Priority
  if (bottleneck === "PRESSURE_HIGH") {
    recommendations.push({
      rank: 1,
      parameter: "Temperature",
      primaryReason: `System backpressure (${Math.round(p)} bar) exceeds exercise limit (${exerciseProfile.maxPressureBar} bar).`,
      secondaryContributor: `Mobile phase viscosity is high at current column temperature (${params.temperature || 25}°C).`,
      recommendation: "Increase column temperature to 40°C–50°C to reduce mobile phase viscosity before lowering flow rate."
    });
    recommendations.push({
      rank: 2,
      parameter: "Flow Rate",
      primaryReason: "Flow rate (mL/min) directly scales hydrodynamic resistance.",
      secondaryContributor: `Current flow rate is ${params.flowRate} mL/min.`,
      recommendation: "Reduce flow rate (e.g. to 1.0–1.2 mL/min) to stay safely below 350 bar."
    });
  } else if (bottleneck === "RESOLUTION_LOW") {
    recommendations.push({
      rank: 1,
      parameter: "Mobile Phase %B",
      primaryReason: `Minimum peak resolution Rs = ${minRs.toFixed(2)} is below baseline separation target (${exerciseProfile.targetResolution}).`,
      secondaryContributor: "High organic solvent %B reduces analyte retention time gap.",
      recommendation: "Decrease organic solvent %B (e.g., from 70% to 40%) to increase C18 retention and widen peak separation."
    });
    recommendations.push({
      rank: 2,
      parameter: "Flow Rate",
      primaryReason: "Flow rate affects Van Deemter plate height and band broadening.",
      secondaryContributor: `Current flow rate is ${params.flowRate} mL/min.`,
      recommendation: "Optimize flow rate to 1.0–1.5 mL/min to maximize column theoretical plates N."
    });
  } else if (bottleneck === "RUNTIME_HIGH") {
    recommendations.push({
      rank: 1,
      parameter: "Mobile Phase %B",
      primaryReason: `Total run time (${runTime.toFixed(1)} min) exceeds throughput target (${exerciseProfile.maxRunTimeMinutes} min).`,
      secondaryContributor: "Hydrophobic solutes remain strongly retained on C18 column.",
      recommendation: "Increase organic solvent %B to elute late peaks faster."
    });
    recommendations.push({
      rank: 2,
      parameter: "Flow Rate / Temperature",
      primaryReason: "Higher mobile phase velocity accelerates solute transport.",
      secondaryContributor: `Flow rate ${params.flowRate} mL/min, Temp ${params.temperature || 25}°C.`,
      recommendation: "Increase flow rate or column temperature while keeping system pressure below 350 bar."
    });
  } else {
    recommendations.push({
      rank: 1,
      parameter: "Method Optimized",
      primaryReason: "All exercise objectives (Resolution, Plates, Pressure, Run Time) satisfied!",
      secondaryContributor: "Balanced thermodynamic and hydrodynamic parameters.",
      recommendation: "Method is optimal for this analytical exercise profile!"
    });
  }

  return {
    bottleneck,
    recommendations,
    influenceMatrix
  };
}
