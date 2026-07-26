/**
 * bufferEngine.js - Buffer System Validation & Noise Engine
 * Multi-condition validation: pH buffering capacity, UV cutoff, column compatibility, LC-MS compatibility.
 */

export function validateBufferSystem(bufferEntity, targetPh, wavelengthNm = 254) {
  const warnings = [];
  const explanations = [];

  if (!bufferEntity) return { isValid: true, warnings, explanations };

  // 1. pH Range Check
  if (targetPh < bufferEntity.effectiveRange.min || targetPh > bufferEntity.effectiveRange.max) {
    warnings.push(`⚠️ pH ${targetPh.toFixed(1)} is outside ${bufferEntity.name} effective range (${bufferEntity.effectiveRange.min}-${bufferEntity.effectiveRange.max}). Poor buffering capacity.`);
    explanations.push(`Operating outside effective buffering range risks mobile phase pH drift during gradient elution or sample injection.`);
  }

  // 2. UV Cutoff Check
  if (wavelengthNm < bufferEntity.uvCutoffNm) {
    warnings.push(`⚠️ Wavelength ${wavelengthNm} nm is below ${bufferEntity.name} UV cutoff (${bufferEntity.uvCutoffNm} nm). High baseline background absorption.`);
    explanations.push(`Selecting a wavelength below the buffer's UV cutoff causes baseline noise and reduced detector dynamic range.`);
  }

  // 3. LC-MS Compatibility Check
  if (!bufferEntity.lcmsCompatible) {
    explanations.push(`Note: ${bufferEntity.name} contains non-volatile salts (non-LC-MS compatible). Suitable for UV/Vis optical detection.`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    explanations
  };
}

export function getBufferNoiseMultiplier(bufferEntity, wavelengthNm = 254) {
  if (!bufferEntity || wavelengthNm >= bufferEntity.uvCutoffNm) return 1.0;
  const diff = bufferEntity.uvCutoffNm - wavelengthNm;
  return 1.0 + Math.pow(diff / 5, 1.8);
}
