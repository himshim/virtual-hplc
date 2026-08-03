/**
 * CalibrationAdapter.js — Adapter for Beer-Lambert Calibration Curves
 */

import { GraphAdapter } from './GraphAdapter.js';

export class CalibrationAdapter extends GraphAdapter {
  constructor(calibrationData = {}, options = {}) {
    super(options);
    this.data = calibrationData; // { points: [{x: conc, y: abs}], slope, intercept, r2, unknown }
  }

  getAxes() {
    return {
      xAxis: { label: 'Concentration', unit: 'mg/L', min: 0 },
      yAxis: { label: 'Absorbance', unit: 'AU', min: 0 }
    };
  }

  getDatasets() {
    const datasets = [];

    // Scatter points
    if (this.data.points) {
      datasets.push({
        id: 'cal-scatter',
        label: 'Standard Calibration Points',
        color: '#f59e0b',
        type: 'scatter',
        data: this.data.points
      });
    }

    // Trendline
    if (this.data.slope !== undefined) {
      const maxX = Math.max(...(this.data.points || [{ x: 10 }]).map(p => p.x), 10);
      datasets.push({
        id: 'cal-trendline',
        label: `Linear Fit (R²=${this.data.r2 ? this.data.r2.toFixed(4) : '1.0000'})`,
        color: '#22c55e',
        type: 'line',
        data: [
          { x: 0, y: this.data.intercept || 0 },
          { x: maxX, y: (this.data.slope * maxX) + (this.data.intercept || 0) }
        ]
      });
    }

    return datasets;
  }

  getAnnotations() {
    if (!this.data.unknown) return [];
    return [{
      x: this.data.unknown.concentration,
      y: this.data.unknown.absorbance,
      label: `Unknown Sample (${this.data.unknown.concentration.toFixed(2)} mg/L)`,
      type: 'marker'
    }];
  }

  getAccessibilitySummary() {
    const r2Str = this.data.r2 ? `R² = ${this.data.r2.toFixed(4)}.` : '';
    return `Linear calibration curve with ${this.data.points ? this.data.points.length : 0} points. ${r2Str}`;
  }

  getExportMetadata() {
    return {
      instrument: 'UV-Vis Calibration',
      slope: this.data.slope,
      intercept: this.data.intercept,
      r2: this.data.r2,
      date: new Date().toISOString()
    };
  }
}
