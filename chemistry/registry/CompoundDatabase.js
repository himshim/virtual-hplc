/**
 * CompoundDatabase.js — Unified Multi-Modal Chemical Entity Database
 *
 * Single Source of Truth for all 16 analytical compounds across UV-Vis, FTIR, HPLC, and GC.
 */

export const COMPOUND_DATABASE = {
  paracetamol: {
    id: 'paracetamol',
    name: 'Paracetamol (Acetaminophen)',
    formula: 'C8H9NO2',
    mw: 151.16,
    cas: '103-90-2',
    chemblId: 'CHEMBL112',
    smiles: 'CC(=O)Nc1ccc(O)cc1',
    pKa: 9.5,
    uvvis: {
      lambdaMax: [243],
      epsilon: 13900,
      linearRange: [2.0, 25.0],
      peaks: [{ lambdaMax: 243, epsilon: 13900, fwhm: 35 }]
    },
    ftir: {
      bands: [
        { wavenumber: 3325, width: 80, intensity: 85, assignment: 'Phenolic O-H stretch (H-bonded)', type: 'stretch' },
        { wavenumber: 3165, width: 60, intensity: 70, assignment: 'Secondary N-H stretch (amide)', type: 'stretch' },
        { wavenumber: 1668, width: 28, intensity: 95, assignment: 'Amide I (C=O conjugated stretch)', type: 'stretch' },
        { wavenumber: 1565, width: 30, intensity: 90, assignment: 'Amide II (N-H bend + C-N stretch)', type: 'bend' },
        { wavenumber: 1506, width: 22, intensity: 75, assignment: 'Aromatic C=C ring stretch (para-substituted)', type: 'ring' },
        { wavenumber: 1260, width: 35, intensity: 70, assignment: 'C-O phenolic stretch', type: 'stretch' },
        { wavenumber: 832, width: 20, intensity: 65, assignment: 'Para-substituted C-H out-of-plane bend', type: 'bend' }
      ]
    },
    hplc: { kw: 20.0, S: 2.8, targetTR: 2.1, pKa: 9.5 },
    gc: { boilingPoint: 299.0, kovatsIndex: 1280 }
  },

  caffeine: {
    id: 'caffeine',
    name: 'Caffeine',
    formula: 'C8H10N4O2',
    mw: 194.19,
    cas: '58-08-2',
    chemblId: 'CHEMBL113',
    smiles: 'Cn1cnc2c1c(=O)n(c(=O)n2C)C',
    pKa: 14.0,
    uvvis: {
      lambdaMax: [273],
      epsilon: 9750,
      linearRange: [2.0, 30.0],
      peaks: [{ lambdaMax: 273, epsilon: 9750, fwhm: 30 }]
    },
    ftir: {
      bands: [
        { wavenumber: 1695, width: 28, intensity: 92, assignment: 'Amide carbonyl C=O stretch (C-2 & C-6)', type: 'stretch' },
        { wavenumber: 1655, width: 30, intensity: 90, assignment: 'Purine ring C=C / C=N stretch', type: 'stretch' },
        { wavenumber: 1548, width: 25, intensity: 78, assignment: 'Imidazolyl C=N asymmetric stretch', type: 'stretch' },
        { wavenumber: 1238, width: 35, intensity: 65, assignment: 'C-N stretch (purine ring)', type: 'stretch' },
        { wavenumber: 745, width: 22, intensity: 70, assignment: 'Purine ring out-of-plane C-H bend', type: 'bend' }
      ]
    },
    hplc: { kw: 45.0, S: 3.1, targetTR: 4.8, pKa: 14.0 },
    gc: { boilingPoint: 178.0, kovatsIndex: 1810 }
  },

  aspirin: {
    id: 'aspirin',
    name: 'Acetylsalicylic Acid (Aspirin)',
    formula: 'C9H8O4',
    mw: 180.16,
    cas: '50-78-2',
    chemblId: 'CHEMBL25',
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    pKa: 3.5,
    uvvis: {
      lambdaMax: [226, 276],
      epsilon: 8900,
      linearRange: [5.0, 40.0],
      peaks: [
        { lambdaMax: 226, epsilon: 8900, fwhm: 25 },
        { lambdaMax: 276, epsilon: 1100, fwhm: 22 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3000, width: 350, intensity: 75, assignment: 'Carboxylic acid O-H broad dimer stretch (2500-3300 cm⁻¹)', type: 'stretch' },
        { wavenumber: 1754, width: 25, intensity: 95, assignment: 'Ester C=O stretch (acetyl)', type: 'stretch' },
        { wavenumber: 1685, width: 28, intensity: 90, assignment: 'Carboxylic acid C=O stretch', type: 'stretch' },
        { wavenumber: 1605, width: 22, intensity: 75, assignment: 'Aromatic C=C ring stretch', type: 'stretch' },
        { wavenumber: 1250, width: 40, intensity: 80, assignment: 'Ester C-O-C asymmetric stretch', type: 'stretch' },
        { wavenumber: 760, width: 20, intensity: 72, assignment: 'Ortho-disubstituted C-H out-of-plane bend', type: 'bend' }
      ]
    },
    hplc: { kw: 30.0, S: 2.9, targetTR: 3.2, pKa: 3.5 },
    gc: { boilingPoint: 140.0, kovatsIndex: 1420 }
  },

  ibuprofen: {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    formula: 'C13H18O2',
    mw: 206.28,
    cas: '15687-27-1',
    chemblId: 'CHEMBL521',
    smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
    pKa: 4.4,
    uvvis: {
      lambdaMax: [222, 264, 272],
      epsilon: 15300,
      linearRange: [10.0, 100.0],
      peaks: [
        { lambdaMax: 222, epsilon: 15300, fwhm: 18 },
        { lambdaMax: 264, epsilon: 370, fwhm: 10 },
        { lambdaMax: 272, epsilon: 290, fwhm: 8 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 2955, width: 45, intensity: 88, assignment: 'Aliphatic C-H stretch (isobutyl CH₃)', type: 'stretch' },
        { wavenumber: 2750, width: 300, intensity: 60, assignment: 'Carboxylic acid O-H dimer stretch (broad)', type: 'stretch' },
        { wavenumber: 1708, width: 28, intensity: 95, assignment: 'Carboxylic acid C=O stretch', type: 'stretch' },
        { wavenumber: 1514, width: 22, intensity: 65, assignment: 'Para-substituted aromatic C=C stretch', type: 'stretch' },
        { wavenumber: 1230, width: 38, intensity: 72, assignment: 'Carboxylic C-O asymmetric stretch', type: 'stretch' },
        { wavenumber: 819, width: 18, intensity: 68, assignment: 'Para-substituted C-H out-of-plane bend', type: 'bend' }
      ]
    },
    hplc: { kw: 120.0, S: 3.8, targetTR: 7.5, pKa: 4.4 },
    gc: { boilingPoint: 157.0, kovatsIndex: 1650 }
  },

  ciprofloxacin: {
    id: 'ciprofloxacin',
    name: 'Ciprofloxacin',
    formula: 'C17H18FN3O3',
    mw: 331.34,
    cas: '85721-33-1',
    chemblId: 'CHEMBL8',
    smiles: 'O=C(O)c1cn(C2CC2)c2cc(N3CCNCC3)c(F)cc2c1=O',
    pKa: 6.1,
    uvvis: {
      lambdaMax: [275, 315],
      epsilon: 25000,
      linearRange: [1.0, 20.0],
      peaks: [
        { lambdaMax: 275, epsilon: 25000, fwhm: 28 },
        { lambdaMax: 315, epsilon: 8500, fwhm: 35 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 1705, width: 28, intensity: 90, assignment: 'Quinolone carboxylic C=O stretch', type: 'stretch' },
        { wavenumber: 1625, width: 30, intensity: 92, assignment: 'Pyridone C=O stretch (quinolone ring)', type: 'stretch' },
        { wavenumber: 1520, width: 22, intensity: 70, assignment: 'Aromatic C=C ring stretch', type: 'stretch' },
        { wavenumber: 1450, width: 25, intensity: 68, assignment: 'C-N piperazine ring stretch', type: 'stretch' },
        { wavenumber: 1260, width: 30, intensity: 75, assignment: 'C-F aromatic stretch (C-6 fluorine)', type: 'stretch' }
      ]
    },
    hplc: { kw: 15.0, S: 2.5, targetTR: 1.8, pKa: 6.1 },
    gc: { boilingPoint: 581.0, kovatsIndex: 2600 }
  },

  diclofenac_sodium: {
    id: 'diclofenac_sodium',
    name: 'Diclofenac Sodium',
    formula: 'C14H10Cl2NNaO2',
    mw: 318.13,
    cas: '15307-79-6',
    chemblId: 'CHEMBL139',
    smiles: '[Na+].[O-]C(=O)Cc1ccccc1Nc1c(Cl)cccc1Cl',
    pKa: 4.0,
    uvvis: {
      lambdaMax: [275, 300],
      epsilon: 10000,
      linearRange: [5.0, 50.0],
      peaks: [
        { lambdaMax: 275, epsilon: 10000, fwhm: 26 },
        { lambdaMax: 300, epsilon: 4200, fwhm: 22 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3388, width: 65, intensity: 82, assignment: 'Secondary N-H stretch (diphenylamine)', type: 'stretch' },
        { wavenumber: 1575, width: 30, intensity: 94, assignment: 'Carboxylate COO⁻ asymmetric stretch', type: 'stretch' },
        { wavenumber: 1506, width: 22, intensity: 80, assignment: 'Aromatic C=C stretch', type: 'stretch' },
        { wavenumber: 1400, width: 28, intensity: 72, assignment: 'Carboxylate COO⁻ symmetric stretch', type: 'stretch' },
        { wavenumber: 746, width: 22, intensity: 85, assignment: 'C-Cl stretch (ortho-dichlorophenyl)', type: 'stretch' }
      ]
    },
    hplc: { kw: 95.0, S: 3.6, targetTR: 6.2, pKa: 4.0 },
    gc: { boilingPoint: 412.0, kovatsIndex: 2150 }
  },

  metronidazole: {
    id: 'metronidazole',
    name: 'Metronidazole',
    formula: 'C6H9N3O3',
    mw: 171.15,
    cas: '443-48-1',
    chemblId: 'CHEMBL81',
    smiles: 'Cc1ncc([N+](=O)[O-])n1CCO',
    pKa: 2.4,
    uvvis: {
      lambdaMax: [277, 320],
      epsilon: 14900,
      linearRange: [2.0, 25.0],
      peaks: [
        { lambdaMax: 277, epsilon: 14900, fwhm: 32 },
        { lambdaMax: 320, epsilon: 6500, fwhm: 30 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3220, width: 80, intensity: 85, assignment: 'Alcohol O-H stretch (hydroxymethyl)', type: 'stretch' },
        { wavenumber: 1535, width: 28, intensity: 95, assignment: 'Nitro asymmetric NO₂ stretch', type: 'stretch' },
        { wavenumber: 1490, width: 25, intensity: 82, assignment: 'Imidazole ring C=N asymmetric stretch', type: 'stretch' },
        { wavenumber: 1368, width: 25, intensity: 90, assignment: 'Nitro symmetric NO₂ stretch', type: 'stretch' },
        { wavenumber: 1040, width: 38, intensity: 78, assignment: 'Hydroxymethyl C-O primary alcohol stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 18.0, S: 2.6, targetTR: 2.3, pKa: 2.4 },
    gc: { boilingPoint: 405.0, kovatsIndex: 1720 }
  },

  quinine: {
    id: 'quinine',
    name: 'Quinine',
    formula: 'C20H24N2O2',
    mw: 324.42,
    cas: '130-95-0',
    chemblId: 'CHEMBL170',
    smiles: 'COc1ccc2c(c1)c(C(O)C3CC4CCN3CC4C=C)ccn2',
    pKa: 8.5,
    uvvis: {
      lambdaMax: [250, 350],
      epsilon: 30000,
      linearRange: [1.0, 15.0],
      peaks: [
        { lambdaMax: 250, epsilon: 30000, fwhm: 24 },
        { lambdaMax: 350, epsilon: 5700, fwhm: 30 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3400, width: 90, intensity: 80, assignment: 'Secondary O-H stretch (carbinol)', type: 'stretch' },
        { wavenumber: 3060, width: 30, intensity: 58, assignment: 'Aromatic C-H stretch (quinoline ring)', type: 'stretch' },
        { wavenumber: 1640, width: 28, intensity: 72, assignment: 'Vinyl C=C stretch (quinuclidine vinyl group)', type: 'stretch' },
        { wavenumber: 1620, width: 30, intensity: 88, assignment: 'Quinoline ring C=N / C=C stretch', type: 'stretch' },
        { wavenumber: 1508, width: 22, intensity: 75, assignment: 'Aromatic C=C stretch', type: 'stretch' },
        { wavenumber: 1090, width: 35, intensity: 70, assignment: 'C-O-C methoxy ether stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 35.0, S: 3.0, targetTR: 4.1, pKa: 8.5 },
    gc: { boilingPoint: 495.0, kovatsIndex: 2400 }
  },

  tryptophan: {
    id: 'tryptophan',
    name: 'L-Tryptophan',
    formula: 'C11H12N2O2',
    mw: 204.23,
    cas: '73-22-3',
    chemblId: 'CHEMBL303953',
    smiles: 'N[C@@H](Cc1c[nH]c2ccccc12)C(=O)O',
    pKa: 9.4,
    uvvis: {
      lambdaMax: [220, 278],
      epsilon: 5600,
      linearRange: [5.0, 50.0],
      peaks: [
        { lambdaMax: 220, epsilon: 33000, fwhm: 16 },
        { lambdaMax: 278, epsilon: 5600, fwhm: 22 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3400, intensity: 88, assignment: 'Indole N-H stretch', type: 'stretch' },
        { wavenumber: 1665, intensity: 90, assignment: 'Amino acid C=O stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 16.0, S: 2.6, targetTR: 1.9, pKa: 9.4 },
    gc: { boilingPoint: 447.0, kovatsIndex: 1850 }
  },

  nadh: {
    id: 'nadh',
    name: 'NADH (Disodium Salt)',
    formula: 'C21H27N7Na2O14P2',
    mw: 709.41,
    cas: '606-68-8',
    chemblId: 'CHEMBL1233519',
    smiles: 'NC(=O)C1=CN(C=CC1)[C@@H]2O[C@H](COP(=O)(O)OP(=O)(O)OC[C@H]3O[C@H](n4cnc5c(N)ncnc45)[C@H](O)[C@@H]3O)[C@@H](O)[C@H]2O',
    pKa: 7.0,
    uvvis: {
      lambdaMax: [260, 340],
      epsilon: 14700,
      linearRange: [5.0, 60.0],
      peaks: [
        { lambdaMax: 260, epsilon: 14700, fwhm: 28 },
        { lambdaMax: 340, epsilon: 6220, fwhm: 35 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 1690, intensity: 90, assignment: 'Nicotinamide carboxamide C=O', type: 'stretch' },
        { wavenumber: 1220, intensity: 85, assignment: 'Phosphate P=O asymmetric stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 10.0, S: 2.2, targetTR: 1.5, pKa: 7.0 },
    gc: { boilingPoint: 800.0, kovatsIndex: 3500 }
  },

  methylene_blue: {
    id: 'methylene_blue',
    name: 'Methylene Blue',
    formula: 'C16H18ClN3S',
    mw: 319.85,
    cas: '61-73-4',
    chemblId: 'CHEMBL52440',
    smiles: 'CN(C)c1ccc2nc3ccc(=[N+](C)C)cc3sc2c1.[Cl-]',
    pKa: 7.0,
    uvvis: {
      lambdaMax: [292, 665],
      epsilon: 95000,
      linearRange: [0.5, 10.0],
      peaks: [
        { lambdaMax: 292, epsilon: 32000, fwhm: 24 },
        { lambdaMax: 665, epsilon: 95000, fwhm: 40 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 1600, intensity: 95, assignment: 'Phenothiazine ring C=N / C=C stretch', type: 'stretch' },
        { wavenumber: 1335, intensity: 88, assignment: 'Aromatic C-N stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 40.0, S: 3.0, targetTR: 4.5, pKa: 7.0 },
    gc: { boilingPoint: 520.0, kovatsIndex: 2300 }
  },

  phenol_red: {
    id: 'phenol_red',
    name: 'Phenol Red',
    formula: 'C19H14O5S',
    mw: 354.38,
    cas: '143-74-8',
    chemblId: 'CHEMBL1383561',
    smiles: 'Oc1ccc(cc1)C2(OS(=O)(=O)c3ccccc23)c4ccc(O)cc4',
    pKa: 7.4,
    uvvis: {
      lambdaMax: [430, 560],
      epsilon: 22000,
      linearRange: [2.0, 30.0],
      peaks: [
        { lambdaMax: 430, epsilon: 24000, fwhm: 35 },
        { lambdaMax: 560, epsilon: 22000, fwhm: 38 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3350, intensity: 80, assignment: 'Phenolic O-H stretch', type: 'stretch' },
        { wavenumber: 1350, intensity: 90, assignment: 'Sulfonate SO2 asymmetric stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 25.0, S: 2.7, targetTR: 2.8, pKa: 7.4 },
    gc: { boilingPoint: 540.0, kovatsIndex: 2500 }
  },

  kmno4: {
    id: 'kmno4',
    name: 'Potassium Permanganate',
    formula: 'KMnO4',
    mw: 158.03,
    cas: '7722-64-7',
    chemblId: 'CHEMBL1200547',
    smiles: '[K+].[O-][Mn](=O)(=O)=O',
    pKa: 7.0,
    uvvis: {
      lambdaMax: [525, 545],
      epsilon: 2400,
      linearRange: [5.0, 100.0],
      peaks: [
        { lambdaMax: 525, epsilon: 2400, fwhm: 20 },
        { lambdaMax: 545, epsilon: 2350, fwhm: 20 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 900, intensity: 95, assignment: 'Mn-O asymmetric stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 5.0, S: 1.5, targetTR: 1.1, pKa: 7.0 },
    gc: { boilingPoint: 240.0, kovatsIndex: 800 }
  },

  riboflavin: {
    id: 'riboflavin',
    name: 'Riboflavin (Vitamin B2)',
    formula: 'C17H20N4O6',
    mw: 376.36,
    cas: '83-88-5',
    chemblId: 'CHEMBL1698',
    smiles: 'Cc1cc2nc3c(=O)[nH]c(=O)nc3n(C[C@H](O)[C@H](O)[C@H](O)CO)c2cc1C',
    pKa: 10.2,
    uvvis: {
      lambdaMax: [266, 373, 445],
      epsilon: 12500,
      linearRange: [2.0, 25.0],
      peaks: [
        { lambdaMax: 266, epsilon: 27700, fwhm: 25 },
        { lambdaMax: 373, epsilon: 10600, fwhm: 30 },
        { lambdaMax: 445, epsilon: 12500, fwhm: 35 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3340, intensity: 85, assignment: 'Ribityl O-H stretch', type: 'stretch' },
        { wavenumber: 1715, intensity: 92, assignment: 'Isoalloxazine ring C=O stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 22.0, S: 2.7, targetTR: 2.5, pKa: 10.2 },
    gc: { boilingPoint: 600.0, kovatsIndex: 2700 }
  },

  vitamin_c: {
    id: 'vitamin_c',
    name: 'L-Ascorbic Acid (Vitamin C)',
    formula: 'C6H8O6',
    mw: 176.12,
    cas: '50-81-7',
    chemblId: 'CHEMBL196',
    smiles: 'OC[C@@H](O)[C@H]1OC(=O)C(O)=C1O',
    pKa: 4.2,
    uvvis: {
      lambdaMax: [245, 265],
      epsilon: 10000,
      linearRange: [5.0, 50.0],
      peaks: [
        { lambdaMax: 245, epsilon: 10000, fwhm: 26 },
        { lambdaMax: 265, epsilon: 14500, fwhm: 28 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3525, intensity: 90, assignment: 'Enediol O-H stretch', type: 'stretch' },
        { wavenumber: 1754, intensity: 95, assignment: 'Lactone ring C=O stretch', type: 'stretch' }
      ]
    },
    hplc: { kw: 12.0, S: 2.4, targetTR: 1.6, pKa: 4.2 },
    gc: { boilingPoint: 553.0, kovatsIndex: 1750 }
  },

  theophylline: {
    id: 'theophylline',
    name: 'Theophylline',
    formula: 'C7H8N4O2',
    mw: 180.16,
    cas: '58-55-9',
    chemblId: 'CHEMBL191',
    smiles: 'Cn1c(=O)c2[nH]cnc2n(C)c1=O',
    pKa: 8.6,
    uvvis: {
      lambdaMax: [272],
      epsilon: 10200,
      linearRange: [2.0, 25.0],
      peaks: [
        { lambdaMax: 272, epsilon: 10200, fwhm: 26 }
      ]
    },
    ftir: {
      bands: [
        { wavenumber: 3120, width: 70, intensity: 80, assignment: 'Purine imidazole N-H stretch', type: 'stretch' },
        { wavenumber: 1665, width: 28, intensity: 95, assignment: 'Xanthine C=O stretch (C-2)', type: 'stretch' },
        { wavenumber: 1540, width: 30, intensity: 82, assignment: 'N-H in-plane bend (imidazole NH)', type: 'bend' },
        { wavenumber: 1470, width: 25, intensity: 75, assignment: 'Purine ring C=N stretching', type: 'stretch' },
        { wavenumber: 1230, width: 35, intensity: 68, assignment: 'C-N purine ring stretch', type: 'stretch' },
        { wavenumber: 620, width: 20, intensity: 62, assignment: 'N-H out-of-plane bend (imidazole NH wagging)', type: 'bend' }
      ]
    },
    hplc: { kw: 28.0, S: 2.9, targetTR: 3.1, pKa: 8.6 },
    gc: { boilingPoint: 394.0, kovatsIndex: 1740 }
  }
};
