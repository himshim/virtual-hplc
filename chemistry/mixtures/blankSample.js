import { BlankSample } from '../entities/BlankSample.js';

export const BLANK_SAMPLE = new BlankSample({
  id:          'blank',
  name:        '🧪 Blank (Mobile Phase)',
  description: 'Pure mobile phase matrix. No analyte compounds. Used to verify baseline noise and solvent-front behaviour.'
});
