/**
 * Calculates physical system backpressure (in bar).
 * Models non-linear viscosity bump of Water/Methanol mixtures (~50% organic peak viscosity).
 * @param {number} flowRate - mL/min
 * @param {number} organicPercent - 0 to 100
 * @returns {number} System pressure in bar
 */
export function getSystemPressure(flowRate, organicPercent) {
  const phi = Math.max(0, Math.min(100, organicPercent)) / 100;
  
  // Viscosity curve: peaks near phi = 0.5 (1.6 cP) and drops at extremes (0 or 1)
  const viscosityBump = Math.sin(phi * Math.PI) * 0.8;
  const baseViscosity = 1.0 - (0.4 * phi);
  const totalViscosity = baseViscosity + viscosityBump;
  
  const columnResistance = 120; // Flow resistance constant
  return flowRate * totalViscosity * columnResistance;
}
