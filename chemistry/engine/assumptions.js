/**
 * assumptions.js - Scientific Assumptions Registry
 * Explicitly declares theoretical assumptions & simplifications of the current simulation version.
 */

export const SCIENTIFIC_ASSUMPTIONS = {
  acidBaseEquilibrium: {
    model: "Ideal Henderson-Hasselbalch Equilibrium",
    description: "Ionization fractions alpha_neutral and alpha_ionized follow ideal aqueous Henderson-Hasselbalch equations. Solvatochromic pKa shifts in mixed organic/water diluents are approximated."
  },
  bufferCapacity: {
    model: "Instantaneous Equilibrium & Constant Temperature",
    description: "Buffer system maintains fixed mobile phase pH instantaneously throughout elution without temperature-induced dpKa/dT kinetics."
  },
  retentionIonization: {
    model: "Independent Species Retention (No Ion-Pairing)",
    description: "Ionized species have a fixed ionicAffinity (0.10x) on C18. Ion-pairing, mixed-mode secondary silanol retention, and secondary equilibrium kinetics are omitted."
  },
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
  }
};

export function getScientificAssumptions() {
  return SCIENTIFIC_ASSUMPTIONS;
}
