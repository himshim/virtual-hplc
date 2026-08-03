/**
 * UvVisPlugin.js — UV-Vis Spectrophotometer Plugin Implementation of LabPlugin SDK v1
 */

import { AnalyticalInstrumentPlugin } from '../../core/AnalyticalInstrumentPlugin.js';
import manifest from './manifest.json' with { type: 'json' };

export class UvVisPlugin extends AnalyticalInstrumentPlugin {
  constructor() {
    super(manifest);
    this.controller = null;
  }

  async initialize() {
    super.initialize();
    const { UvVisController } = await import('./controller/UvVisController.js');
    this.controller = new UvVisController();
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
