/**
 * ChromatogramAdapter.js — Adapter for HPLC and GC Chromatograms
 */

import { GraphAdapter } from './GraphAdapter.js';

export class ChromatogramAdapter extends GraphAdapter {
  constructor(chromatogramData = {}, options = {}) {
    super(options);
    this.data = chromatogramData;
    this.unit = options.unit || 'mAU';
    this.instrument = options.instrument || 'HPLC';
  }

  getAxes() {
    return {
      xAxis: { label: 'Retention Time', unit: 'min', min: 0, max: this.data.maxTime || 10 },
      yAxis: { label: 'Detector Response', unit: this.unit, min: 0 }
    };
  }

  getDatasets() {
    if (!this.data.points) return [];
    return [{
      id: 'chromatogram-main',
      label: `${this.instrument} Chromatogram`,
      color: '#38bdf8',
      data: this.data.points
    }];
  }

  getAnnotations() {
    if (!this.data.peaks) return [];
    return this.data.peaks.map(p => ({
      x: p.retentionTime,
      y: p.height,
      label: `${p.name || 'Peak'} (${p.retentionTime.toFixed(2)} min)`,
      type: 'peak'
    }));
  }

  getAccessibilitySummary() {
    const count = this.data.peaks ? this.data.peaks.length : 0;
    return `${this.instrument} chromatogram displaying ${count} resolved peaks over ${this.data.maxTime || 10} minutes.`;
  }
}
