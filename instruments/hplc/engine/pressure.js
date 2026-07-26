import { getTemperatureViscosityFactor } from './temperature.js';

/**
 * Calculates physical system backpressure (in bar) incorporating temperature dependence.
 * @param {number} flowRate - mL/min
 * @param {number} organicPercent - 0 to 100
 * @param {number} [tempCelsius=25] - Column temperature in °C
 * @returns {number} System pressure in bar
 */
export function getSystemPressure(flowRate, organicPercent, tempCelsius = 25) {
  const phi = Math.max(0, Math.min(100, organicPercent)) / 100;
  
  // Viscosity curve: peaks near phi = 0.5 (1.6 cP at 25°C) and drops at extremes
  const viscosityBump = Math.sin(phi * Math.PI) * 0.8;
  const baseViscosity = 1.0 - (0.4 * phi);
  const totalViscosity = baseViscosity + viscosityBump;
  
  // Apply temperature viscosity reduction factor
  const tempFactor = getTemperatureViscosityFactor(tempCelsius);
  const effectiveViscosity = totalViscosity * tempFactor;

  const columnResistance = 120; // Flow resistance constant
  return flowRate * effectiveViscosity * columnResistance;
}
