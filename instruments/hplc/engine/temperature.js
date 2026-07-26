/**
 * temperature.js - Thermodynamic Column Temperature Dependence Engine
 * Models moderate temperature effects (25°C to 60°C) on mobile phase viscosity,
 * solute retention shift, and Van Deemter plate height kinetics.
 */

/**
 * Calculates mobile phase viscosity temperature multiplier.
 * @param {number} tempCelsius - Column temperature (25°C to 60°C)
 * @returns {number} Viscosity correction factor (1.0 at 25°C, ~0.72 at 50°C)
 */
export function getTemperatureViscosityFactor(tempCelsius) {
  const T = Math.max(20, Math.min(70, tempCelsius)) + 273.15;
  const T_ref = 298.15; // 25°C
  // Arrhenius viscosity factor: E_a / R approx 1400 K
  return Math.exp(1400 * ((1 / T) - (1 / T_ref)));
}

/**
 * Calculates retention factor temperature adjustment multiplier.
 * Modest decrease in retention as temperature increases.
 * @param {number} tempCelsius - Column temperature
 * @returns {number} Retention factor multiplier (1.0 at 25°C, ~0.90 at 50°C)
 */
export function getTemperatureRetentionFactor(tempCelsius) {
  const T = Math.max(20, Math.min(70, tempCelsius)) + 273.15;
  const T_ref = 298.15;
  // Van't Hoff enthalpy factor: Delta H / R approx 450 K
  return Math.exp(450 * ((1 / T) - (1 / T_ref)));
}

/**
 * Van Deemter parameters adjusted for temperature diffusion changes.
 * @param {number} tempCelsius
 * @param {number} flowRate
 */
export function getTemperatureVanDeemterParams(tempCelsius, flowRate) {
  const safeFlow = Math.max(flowRate, 0.01);
  const T_ratio = (Math.max(20, Math.min(70, tempCelsius)) + 273.15) / 298.15;

  const A = 0.005;
  const B = (0.01 * Math.pow(T_ratio, 1.2)) / safeFlow; // Increased molecular diffusion
  const C = (0.015 / Math.pow(T_ratio, 0.8)) * safeFlow; // Faster mass transfer

  return A + B + C;
}
