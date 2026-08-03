/**
 * HplcPlugin.js — HPLC Plugin Implementation of LabPlugin SDK v1
 */

import { AnalyticalInstrumentPlugin } from '../../core/AnalyticalInstrumentPlugin.js';
import manifest from './manifest.json' with { type: 'json' };

export class HplcPlugin extends AnalyticalInstrumentPlugin {
  constructor() {
    super(manifest);
    this.controller = null;
  }

  async initialize() {
    super.initialize();
    const { HplcController } = await import('./controller/HplcController.js');
    this.controller = new HplcController();
    return this.controller;
  }

  getController() {
    return this.controller;
  }

  dispose() {
    if (this.controller && this.controller.dispose) {
      this.controller.dispose();
    }
    super.dispose();
  }
}
