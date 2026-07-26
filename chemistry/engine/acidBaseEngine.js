/**
 * acidBaseEngine.js - Henderson-Hasselbalch Equilibrium Engine
 * Generic equilibrium model supporting monoprotic & polyprotic weak acids, bases, and neutral species.
 */

/**
 * Computes ionization fraction alpha_ionized (0.0 to 1.0) and alpha_neutral (0.0 to 1.0).
 * @param {string} type - "acid" | "base" | "neutral" | "zwitterion"
 * @param {Array<number>|number} pKa - pKa value(s)
 * @param {number} pH - Solution pH
 */
export function calculateIonizationFractions(type, pKa, pH) {
  if (type === "neutral" || !pKa) {
    return { alphaNeutral: 1.0, alphaIonized: 0.0 };
  }

  const pKaValue = Array.isArray(pKa) ? pKa[0] : pKa;

  if (type === "acid") {
    // HA <=> H+ + A-
    // alpha_ionized = 1 / (1 + 10^(pKa - pH))
    const alphaIonized = 1 / (1 + Math.pow(10, pKaValue - pH));
    const alphaNeutral = 1 - alphaIonized;
    return { alphaNeutral, alphaIonized };
  }

  if (type === "base") {
    // BH+ <=> B + H+
    // alpha_ionized = 1 / (1 + 10^(pH - pKa))
    const alphaIonized = 1 / (1 + Math.pow(10, pH - pKaValue));
    const alphaNeutral = 1 - alphaIonized;
    return { alphaNeutral, alphaIonized };
  }

  return { alphaNeutral: 1.0, alphaIonized: 0.0 };
}
