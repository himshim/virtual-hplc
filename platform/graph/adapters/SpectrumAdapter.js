/**
 * SpectrumAdapter.js — Adapter for UV-Vis & FTIR Spectrophotometer Scans
 */

import { GraphAdapter } from './GraphAdapter.js';

export class SpectrumAdapter extends GraphAdapter {
  constructor(spectrumData = {}, options = {}) {
    super(options);
    this.data = spectrumData;
    this.unit = options.unit || 'AU';
    this.instrument = options.instrument || 'UV-Vis';
    this.inverted = options.inverted || false; // FTIR inverted X axis
  }

  getAxes() {
    return {
      xAxis: {
        label: this.instrument === 'FTIR' ? 'Wavenumber' : 'Wavelength',
        unit: this.instrument === 'FTIR' ? 'cm⁻¹' : 'nm',
        min: this.data.xMin || (this.instrument === 'FTIR' ? 400 : 200),
        max: this.data.xMax || (this.instrument === 'FTIR' ? 4000 : 800),
        inverted: this.inverted
      },
      yAxis: {
        label: this.instrument === 'FTIR' ? 'Transmittance' : 'Absorbance',
        unit: this.unit,
        min: 0,
        max: this.data.yMax || (this.instrument === 'FTIR' ? 100 : 2.5)
      }
    };
  }

  getDatasets() {
    if (!this.data.points) return [];
    return [{
      id: 'spectrum-main',
      label: `${this.instrument} Spectrum`,
      color: '#38bdf8',
      data: this.data.points
    }];
  }

  getAnnotations() {
    if (!this.data.markers) return [];
    return this.data.markers.map(m => ({
      x: m.x,
      y: m.y,
      label: `${m.name} (${m.x} ${this.instrument === 'FTIR' ? 'cm⁻¹' : 'nm'})`,
      type: 'marker'
    }));
  }

  getAccessibilitySummary() {
    const lambdaMax = this.data.lambdaMax ? ` Peak at ${this.data.lambdaMax} nm.` : '';
    return `${this.instrument} spectrum scan.${lambdaMax}`;
  }

  getExportMetadata() {
    return {
      instrument: this.instrument,
      date: new Date().toISOString(),
      units: this.unit
    };
  }
}
