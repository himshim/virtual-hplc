/**
 * ftirEngine.js — FTIR Spectrometry Physics & Optics Engine
 *
 * Simulates Michelson Interferometer interferogram generation I(delta)
 * and Fourier Transform infrared transmittance T(nu) across 4000–400 cm^-1.
 *
 * Implements functional group IR absorption bands:
 * - Ethanol (O-H stretch 3330 cm^-1, C-H 2970 cm^-1, C-O 1050 cm^-1)
 * - Acetone (C=O carbonyl 1715 cm^-1, C-H 2960 cm^-1, C-C 1220 cm^-1)
 * - Benzoic Acid (O-H broad 2500–3300 cm^-1, C=O 1685 cm^-1, Aromatic C=C 1600/1450 cm^-1)
 */

import { COMPOUND_DATABASE } from '../../../chemistry/registry/CompoundDatabase.js';

export const FTIR_COMPOUND_DATABASE = {
  ...Object.fromEntries(
    Object.entries(COMPOUND_DATABASE).map(([k, v]) => [
      k,
      {
        name: v.name,
        formula: v.formula,
        mw: v.mw,
        description: `${v.name} FTIR spectrum with characteristic functional group absorption bands.`,
        bands: (v.ftir?.bands || []).map(b => ({
          wavenumber: b.wavenumber,
          width: b.width || 35,
          depth: (b.intensity || 80) / 100,
          mode: b.assignment || b.label || 'IR Active Band',
          region: b.wavenumber >= 1500 ? 'Functional Group' : 'Fingerprint'
        }))
      }
    ])
  ),
  ethanol: {
    name: 'Ethanol (C2H5OH)',
    formula: 'CH3CH2OH',
    mw: 46.07,
    description: 'Primary alcohol showing characteristic broad hydrogen-bonded O-H stretch and sharp C-O stretch.',
    bands: [
      { wavenumber: 3330, width: 250, depth: 0.75, mode: 'O-H stretch (H-bonded alcohol)', region: 'Functional Group' },
      { wavenumber: 2970, width: 50, depth: 0.85, mode: 'sp3 C-H asymmetric stretch', region: 'Functional Group' },
      { wavenumber: 2880, width: 40, depth: 0.60, mode: 'sp3 C-H symmetric stretch', region: 'Functional Group' },
      { wavenumber: 1420, width: 35, depth: 0.45, mode: 'C-H bending (scissoring)', region: 'Fingerprint' },
      { wavenumber: 1050, width: 60, depth: 0.90, mode: 'C-O primary alcohol stretch', region: 'Fingerprint' },
      { wavenumber: 880, width: 40, depth: 0.35, mode: 'C-C-O skeletal vibration', region: 'Fingerprint' }
    ]
  },
  acetone: {
    name: 'Acetone (CH3COCH3)',
    formula: 'CH3COCH3',
    mw: 58.08,
    description: 'Aliphatic ketone featuring intensely sharp C=O carbonyl absorption band at 1715 cm^-1.',
    bands: [
      { wavenumber: 2960, width: 45, depth: 0.50, mode: 'sp3 C-H stretch', region: 'Functional Group' },
      { wavenumber: 1715, width: 30, depth: 0.98, mode: 'C=O carbonyl stretch (ketone)', region: 'Functional Group' },
      { wavenumber: 1420, width: 35, depth: 0.40, mode: 'CH3 asymmetric bending', region: 'Fingerprint' },
      { wavenumber: 1360, width: 30, depth: 0.55, mode: 'CH3 symmetric umbrella bending', region: 'Fingerprint' },
      { wavenumber: 1220, width: 45, depth: 0.70, mode: 'C-C-C skeletal coupling stretch', region: 'Fingerprint' }
    ]
  },
  benzoic_acid: {
    name: 'Benzoic Acid (C6H5COOH)',
    formula: 'C6H5COOH',
    mw: 122.12,
    description: 'Aromatic carboxylic acid exhibiting extremely broad dimeric O-H envelope and conjugated C=O.',
    bands: [
      { wavenumber: 2900, width: 400, depth: 0.70, mode: 'Carboxylic Acid O-H broad dimer stretch', region: 'Functional Group' },
      { wavenumber: 1685, width: 35, depth: 0.92, mode: 'Conjugated Ar-C=O carbonyl stretch', region: 'Functional Group' },
      { wavenumber: 1600, width: 25, depth: 0.65, mode: 'Aromatic C=C ring stretch 1', region: 'Functional Group' },
      { wavenumber: 1450, width: 25, depth: 0.60, mode: 'Aromatic C=C ring stretch 2', region: 'Fingerprint' },
      { wavenumber: 1290, width: 40, depth: 0.85, mode: 'Carboxylic C-O stretch', region: 'Fingerprint' },
      { wavenumber: 710, width: 30, depth: 0.80, mode: 'Monosubstituted benzene C-H out-of-plane bend', region: 'Fingerprint' }
    ]
  }
};

export class FtirEngine {
  /**
   * Generates Michelson Interferometer optical path difference I(opd) point.
   * Cosine superposition symmetric around ZPD (Zero Path Difference, opd = 0).
   * @param {string} sampleKey
   * @param {number} opd - Optical Path Difference in cm (-0.25 to +0.25 cm)
   * @param {string} mode - 'atr' vs 'kbr'
   */
  static computeInterferogramAtOpd(sampleKey = 'ethanol', opd = 0.0, mode = 'atr') {
    const compound = FTIR_COMPOUND_DATABASE[sampleKey] || FTIR_COMPOUND_DATABASE.ethanol;
    const modeMultiplier = mode === 'atr' ? 0.85 : 1.0;
    let sumCos = 0.0;

    compound.bands.forEach(b => {
      const nu = b.wavenumber;
      // Coherence envelope decay with distance from ZPD (sharp centerburst)
      const envelope = Math.exp(-Math.pow(opd / 0.02, 2));
      sumCos += b.depth * modeMultiplier * Math.cos(2 * Math.PI * nu * opd) * envelope;
    });

    // Baseline DC offset + AC interferogram centerburst
    const dcOffset = 45.0;
    const intensity = dcOffset + sumCos * 8.0;

    return {
      opd,
      intensity: Math.max(0, Math.min(100, intensity))
    };
  }

  /**
   * Single wavenumber transmittance %T at nu (4000 cm^-1 down to 400 cm^-1).
   * @param {string} sampleKey
   * @param {number} wavenumber - cm^-1
   * @param {string} mode - 'atr' vs 'kbr'
   */
  static computeTransmittanceAtWavenumber(sampleKey = 'ethanol', wavenumber = 2000, mode = 'atr') {
    const compound = FTIR_COMPOUND_DATABASE[sampleKey] || FTIR_COMPOUND_DATABASE.ethanol;
    const modeMultiplier = mode === 'atr' ? 0.85 : 1.0;
    let totalAbsorbance = 0;

    compound.bands.forEach(b => {
      const dev = wavenumber - b.wavenumber;
      const sigma = b.width / 2.355;
      totalAbsorbance += b.depth * modeMultiplier * Math.exp(-(dev * dev) / (2 * sigma * sigma));
    });

    const transmittance = Math.max(2.0, Math.min(100.0, Math.pow(10, -totalAbsorbance) * 100.0));
    const absorbance = Math.max(0, -Math.log10(transmittance / 100.0));

    return {
      wavenumber,
      transmittance,
      absorbance
    };
  }
}
