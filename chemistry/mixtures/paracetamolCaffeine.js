import { Mixture } from '../entities/Mixture.js';

export const PARACETAMOL_CAFFEINE_MIX = new Mixture({
  id: 'paracetamol_caffeine',
  name: 'Paracetamol & Caffeine (Pain Relief Formulation)',
  description: 'Dual-API formulation containing Paracetamol (10 mg/mL) and Caffeine (10 mg/mL)',
  components: [
    { compoundId: 'paracetamol', concentration: 10, role: 'API' },
    { compoundId: 'caffeine', concentration: 10, role: 'API' }
  ]
});
