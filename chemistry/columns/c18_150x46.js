import { Column } from '../entities/Column.js';

export const C18_COLUMN = new Column({
  id: "c18_150x46",
  name: "Standard C18 Column (150 x 4.6mm, 5µm)",
  lengthMm: 150,
  innerDiameterMm: 4.6,
  particleSizeUm: 5.0,
  phaseType: "C18",
  voidVolumeMl: 1.5
});
