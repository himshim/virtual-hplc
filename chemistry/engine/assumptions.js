/**
 * assumptions.js - Scientific Assumptions Registry
 * Explicitly declares theoretical assumptions & simplifications of the current simulation version.
 */

export const SCIENTIFIC_ASSUMPTIONS = {
  peakShape: {
    model: "Ideal Gaussian Pulse",
    description: "Solute peaks are rendered as symmetrical Gaussian distributions. Peak tailing (silanol interaction) and fronting are idealized in v1.x."
  },
  detectorLinearity: {
    model: "Ideal Beer-Lambert Absorbance",
    description: "Detector signal scales linearly with extinction coefficient epsilon(lambda) and concentration, capping at 2.5 AU saturation limit."
  },
  systemDispersion: {
    model: "Zero Extra-Column Band Broadening",
    description: "Tubing void volume, sample injector dispersion, and detector cell volume broadening are assumed negligible relative to column band broadening."
  },
  columnAging: {
    model: "Pristine C18 Column Stationary Phase",
    description: "Stationary phase column degradation, silanol stripping, and void channeling over time are omitted."
  },
  sampleMatrix: {
    model: "Clean Sample Solution",
    description: "Sample analytes exist in clean diluent without matrix interference, precipitation, or co-precipitation hazards."
  }
};

export function getScientificAssumptions() {
  return SCIENTIFIC_ASSUMPTIONS;
}
