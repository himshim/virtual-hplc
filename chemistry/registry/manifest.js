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

/**
 * manifest.js - Zero-Code Entity Auto-Discovery Manifest
 * Adding a single entity file export to this manifest automatically registers it across all instruments.
 */
export const CHEMISTRY_MANIFEST = {
  compounds: [PARACETAMOL, CAFFEINE, ASPIRIN, IBUPROFEN],
  mixtures: [ASSAY_MIXTURE],
  columns: [C18_COLUMN],
  mobilePhases: [WATER_METHANOL],
  detectors: [UV_DETECTOR_PLUGIN],
  buffers: [PHOSPHATE_BUFFER, ACETATE_BUFFER, FORMATE_BUFFER]
};
