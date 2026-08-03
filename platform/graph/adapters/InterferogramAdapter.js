/**
 * InterferogramAdapter.js — Adapter for Raw FTIR Optical Interferograms
 */

import { GraphAdapter } from './GraphAdapter.js';

export class InterferogramAdapter extends GraphAdapter {
  constructor(interferogramData = {}, options = {}) {
    super(options);
    this.data = interferogramData;
  }

  getAxes() {
    return {
      xAxis: { label: 'Optical Path Difference (OPD)', unit: 'cm' },
      yAxis: { label: 'Detector Volts', unit: 'V' }
    };
  }

  getDatasets() {
    if (!this.data.points) return [];
    return [{
      id: 'interferogram-main',
      label: 'Interferogram (Centerburst)',
      color: '#a855f7',
      data: this.data.points
    }];
  }

  getAccessibilitySummary() {
    return 'Raw FTIR interferogram showing central optical interference burst.';
  }
}
