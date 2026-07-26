import { MobilePhase } from '../entities/MobilePhase.js';

export const WATER_METHANOL = new MobilePhase({
  id: "waterMethanol",
  name: "Water / Methanol Binary System",
  solventA: "Water",
  solventB: "Methanol",
  uvCutoffNm: 205
});
