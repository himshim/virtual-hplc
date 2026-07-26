/**
 * transportEngine.js - Phase C Physical Transport & Dispersion Engine
 * 
 * Implements standard BaseEngine interface.
 * Models physical Van Deemter column band broadening coupled with extra-column volume dispersion.
 * 
 * Equations:
 * 1. Linear velocity u = F / (epsilon * A_col)
 * 2. Van Deemter HETP H = A + B/u + C*u
 * 3. N_column = L / H
 * 4. sigma_column^2 = tR^2 / N_column
 * 5. sigma_extra^2 = sigma_inj^2 + sigma_tube^2 + sigma_cell^2
 * 6. sigma_total = sqrt(sigma_column^2 + sigma_extra^2)
 */

export class TransportEngine {
  static metadata = {
    name: "TransportEngine",
    version: "1.0.0",
    apiVersion: 1,
    supports: ["vanDeemter", "temperatureScaling", "extraColumnDispersion", "plateCalculation"]
  };

  /**
   * Validates physical transport parameters.
   * @param {Object} context - Read-only SimulationContext
   */
  validate(context) {
    const flowRate = context.flowRate || 1.0;
    const errors = [];
    if (flowRate <= 0.05 || flowRate > 10.0) {
      errors.push("Flow rate must be between 0.05 and 10.0 mL/min.");
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Processes physical transport band broadening and extra-column volume dispersion.
   * @param {Object} context - Read-only SimulationContext
   * @returns {Object} Context patch with sigma, plate counts, and physical widths
   */
  process(context) {
    const tR = Math.max(0.1, context.tR || 3.0); // Retention time in min
    const flowRate = context.flowRate || 1.0; // mL/min
    const tempCelsius = context.temperature || 25; // °C
    const columnLengthMm = context.columnLengthMm || 150; // mm
    const particleSizeUm = context.particleSizeUm || 5.0; // µm

    // Extra-column volume contributions (in µL)
    const injVolumeUl = context.injVolumeUl || 10; // µL
    const cellVolumeUl = context.cellVolumeUl || 8; // µL
    const tubeVolumeUl = context.tubeVolumeUl || 5; // µL

    // 1. Column Geometry & Interstitial Linear Velocity u (cm/s)
    const columnRadiusCm = 0.23; // 4.6 mm ID -> 0.23 cm radius
    const colAreaCm2 = Math.PI * Math.pow(columnRadiusCm, 2); // ~0.166 cm²
    const porosity = 0.65; // Total column porosity
    const flowCm3PerSec = (flowRate / 60); // cm³/s (mL/s)
    const uLinearCmPerSec = flowCm3PerSec / (porosity * colAreaCm2); // Interstitial velocity u (cm/s)

    // 2. Temperature Scaling of Van Deemter Parameters (T in Kelvin)
    const tempK = tempCelsius + 273.15;
    const tempRefK = 298.15; // 25°C reference
    const dpMm = particleSizeUm / 1000; // dp in mm

    // Baseline Van Deemter parameters at 25°C
    const A_0 = 1.5 * dpMm; // Eddy diffusion (mm)
    const B_0 = 2.0 * (0.0001); // Longitudinal diffusion coefficient (mm*cm/s)
    const C_0 = 0.05 * (0.01); // Mass transfer coefficient (mm*s/cm)

    const B_temp = B_0 * Math.pow(tempK / tempRefK, 1.75);
    const C_temp = C_0 * Math.pow(tempRefK / tempK, 1.0);

    // HETP (mm) = A + B/u + C*u
    const uSafe = Math.max(0.01, uLinearCmPerSec);
    const hetpMm = Math.max(0.001, A_0 + (B_temp / uSafe) + (C_temp * uSafe));

    // 3. Column Theoretical Plate Count & Column Variance
    const platesColumn = Math.max(10, columnLengthMm / hetpMm);
    const sigmaColumn2 = Math.pow(tR, 2) / platesColumn; // min²

    // 4. Extra-Column Volume Variances (converted to min²)
    const flowRateUlPerMin = flowRate * 1000; // µL/min
    const flowRateUlPerSec = flowRateUlPerMin / 60; // µL/s

    // Injection variance sigma_inj^2 (min²)
    const sigmaInjSec = (injVolumeUl / Math.sqrt(12)) / flowRateUlPerSec;
    const sigmaInj2 = Math.pow(sigmaInjSec / 60, 2);

    // Detector flow cell variance sigma_cell^2 (min²)
    const sigmaCellSec = (cellVolumeUl / Math.sqrt(12)) / flowRateUlPerSec;
    const sigmaCell2 = Math.pow(sigmaCellSec / 60, 2);

    // Extra-column tubing variance sigma_tube^2 (min²)
    const sigmaTubeSec = (tubeVolumeUl / Math.sqrt(24)) / flowRateUlPerSec;
    const sigmaTube2 = Math.pow(sigmaTubeSec / 60, 2);

    const sigmaExtra2 = sigmaInj2 + sigmaCell2 + sigmaTube2;

    // 5. Total Variance & Physical Peak Widths
    const sigmaTotal2 = sigmaColumn2 + sigmaExtra2;
    const sigmaTotal = Math.sqrt(sigmaTotal2);

    const platesTotal = Math.pow(tR / sigmaTotal, 2);
    const widthBase = 4.0 * sigmaTotal;
    const widthHalf = 2.3548 * sigmaTotal;
    const widthFivePercent = 4.30 * sigmaTotal;

    return {
      hetpMm,
      uLinearCmPerSec,
      platesColumn: Math.round(platesColumn),
      platesTotal: Math.round(platesTotal),
      sigmaColumn: Math.sqrt(sigmaColumn2),
      sigmaExtra: Math.sqrt(sigmaExtra2),
      sigmaTotal,
      widthBase,
      widthHalf,
      widthFivePercent
    };
  }

  report(context) {
    return {
      engine: TransportEngine.metadata.name,
      status: "ACTIVE"
    };
  }
}
