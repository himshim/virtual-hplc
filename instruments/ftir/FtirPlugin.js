/**
 * FtirPlugin.js — FTIR Spectrometer Stub Plugin implementing LabPlugin SDK v1
 */

import { AnalyticalInstrumentPlugin } from '../../core/AnalyticalInstrumentPlugin.js';
import manifest from './manifest.json' with { type: 'json' };

export class FtirPlugin extends AnalyticalInstrumentPlugin {
  constructor() {
    super(manifest);
  }

  async initialize() {
    super.initialize();
    return { status: 'FTIR_INITIALIZED' };
  }
}
