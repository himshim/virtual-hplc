import { Entity } from './Entity.js';

/**
 * BlankSample.js — First-class Blank Injection Entity
 *
 * A blank is a pure mobile-phase injection with zero analyte components.
 * It is NOT a Mixture with 0 components — it is a distinct sample type.
 *
 * Educational purpose: students learn that the instrument produces baseline
 * noise and a solvent-front disturbance, NOT analyte peaks.
 *
 * Future extension points:
 *   - SolventBlank (organic + aqueous mobile phase only)
 *   - PlaceboBlank (excipients without API)
 *   - CalibrationBlank (diluent only, for linearity studies)
 */
export class BlankSample extends Entity {
  constructor({
    id,
    name,
    description = 'Pure mobile phase matrix — no analyte compounds.',
    schemaVersion = 1,
    entityVersion = '1.0.0',
    metadata = {}
  }) {
    super({ id, name, type: 'BLANK_SAMPLE', schemaVersion, entityVersion, metadata });
    this.description = description;
    this.components  = []; // Always empty — by definition, not by exception
  }

  validate() {
    super.validate(); // id, name, type checks
    // No component check needed — zero components IS correct for a blank
    return true;
  }
}
