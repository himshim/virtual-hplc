import { globalEntityRegistry } from './EntityRegistry.js';
import { PARACETAMOL } from '../compounds/paracetamol.js';
import { CAFFEINE } from '../compounds/caffeine.js';
import { ASPIRIN } from '../compounds/aspirin.js';
import { IBUPROFEN } from '../compounds/ibuprofen.js';
import { ASSAY_MIXTURE } from '../mixtures/assayMixture.js';
import { C18_COLUMN } from '../columns/c18_150x46.js';
import { WATER_METHANOL } from '../mobilePhases/waterMethanol.js';
import { UV_DETECTOR_PLUGIN } from '../detectors/uvDetector.js';
import { PHOSPHATE_BUFFER } from '../buffers/phosphateBuffer.js';
import { ACETATE_BUFFER } from '../buffers/acetateBuffer.js';
import { FORMATE_BUFFER } from '../buffers/formateBuffer.js';

export function bootstrapChemistryRegistry() {
  globalEntityRegistry.register(PARACETAMOL);
  globalEntityRegistry.register(CAFFEINE);
  globalEntityRegistry.register(ASPIRIN);
  globalEntityRegistry.register(IBUPROFEN);
  globalEntityRegistry.register(ASSAY_MIXTURE);
  globalEntityRegistry.register(C18_COLUMN);
  globalEntityRegistry.register(WATER_METHANOL);
  globalEntityRegistry.register(UV_DETECTOR_PLUGIN);
  globalEntityRegistry.register(PHOSPHATE_BUFFER);
  globalEntityRegistry.register(ACETATE_BUFFER);
  globalEntityRegistry.register(FORMATE_BUFFER);

  return globalEntityRegistry;
}
