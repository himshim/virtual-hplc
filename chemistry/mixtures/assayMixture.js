import { Mixture } from '../entities/Mixture.js';

export const ASSAY_MIXTURE = new Mixture({
  id: "mixture",
  name: "Mixture (all four)",
  description: "4-Component Quality Control Assay Mixture (Paracetamol, Caffeine, Aspirin, Ibuprofen)",
  components: [
    { compoundId: "paracetamol", concentration: 10, role: "API" },
    { compoundId: "caffeine", concentration: 10, role: "API" },
    { compoundId: "aspirin", concentration: 10, role: "API" },
    { compoundId: "ibuprofen", concentration: 10, role: "API" }
  ]
});
