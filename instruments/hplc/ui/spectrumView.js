import { globalEntityRegistry } from '../../../chemistry/registry/EntityRegistry.js';

/**
 * spectrumView.js - Interactive UV Absorbance Spectrum Canvas View
 * Renders solute UV absorption spectra curves (200 nm - 400 nm) with a vertical wavelength indicator.
 */
export class SpectrumView {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.initChart();
  }

  initChart() {
    if (!this.canvas || typeof Chart === 'undefined') return;

    const ctx = this.canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Wavelength λ (nm)' },
            min: 200,
            max: 400
          },
          y: {
            title: { display: true, text: 'Relative Extinction ε' },
            min: 0,
            max: 1.2
          }
        }
      }
    });
  }

  renderSpectrum(sampleKey, selectedWavelengthNm = 254) {
    if (!this.chart) return;

    const compounds = [];
    const mix = globalEntityRegistry.getMixture(sampleKey);
    if (mix && mix.components) {
      mix.components.forEach(c => {
        const comp = globalEntityRegistry.getCompound(c.compoundId);
        if (comp) compounds.push(comp);
      });
    } else {
      const single = globalEntityRegistry.getCompound(sampleKey);
      if (single) compounds.push(single);
    }

    const colors = ['#1565c0', '#2e7d32', '#c62828', '#f57f17', '#6a1b9a'];
    const datasets = [];

    compounds.forEach((comp, idx) => {
      const points = [];
      for (let lambda = 200; lambda <= 400; lambda += 2) {
        points.push({ x: lambda, y: comp.getExtinctionCoefficient(lambda) });
      }
      datasets.push({
        label: `${comp.name} UV Spectrum`,
        data: points,
        borderColor: colors[idx % colors.length],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.2
      });
    });

    // Vertical Wavelength Indicator Line
    datasets.push({
      label: `Selected λ (${selectedWavelengthNm} nm)`,
      data: [{ x: selectedWavelengthNm, y: 0 }, { x: selectedWavelengthNm, y: 1.2 }],
      borderColor: '#d50000',
      borderWidth: 2,
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false
    });

    this.chart.data.datasets = datasets;
    this.chart.update('none');
  }
}
