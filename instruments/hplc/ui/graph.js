/**
 * graph.js - Chart.js Chromatogram Canvas View (Strict Rendering Only)
 * Listens to controller events to render dynamic time-series line graph.
 *
 * v1.1: Adds fitAll(), fitPeaks(), resetZoom() and exposes instance globally
 * for zoom toolbar controls.
 */
export class GraphView {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.initChart();
    window._graphViewInstance = this;
  }

  initChart() {
    if (!this.canvas || typeof Chart === 'undefined') return;

    const ctx = this.canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Absorbance (AU)',
          data: [],
          borderColor: '#38bdf8',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Time (min)', color: '#94a3b8' },
            min: 0,
            suggestedMax: 3,
            ticks: { color: '#64748b' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y: {
            title: { display: true, text: 'Signal (AU)', color: '#94a3b8' },
            min: -0.01,
            suggestedMax: 1.2,
            ticks: { color: '#64748b' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  reset() {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [];
    this.chart.options.scales.x.min = 0;
    delete this.chart.options.scales.x.max;
    this.chart.options.scales.x.suggestedMax = 3;
    delete this.chart.options.scales.y.max;
    this.chart.options.scales.y.suggestedMax = 1.2;
    this.chart.update();
  }

  addPoint(t, y) {
    if (!this.chart) return;
    this.chart.data.datasets[0].data.push({ x: t, y: y });
    if (t > (this.chart.options.scales.x.suggestedMax || 3)) {
      this.chart.options.scales.x.suggestedMax = Math.ceil(t + 1);
    }
    this.chart.update('none');
  }

  /* ── Zoom & Fit Controls (P5) ───────────────────────────────────────────── */

  fitAll() {
    if (!this.chart || !this.chart.data.datasets[0].data.length) return;
    const pts = this.chart.data.datasets[0].data;
    const maxT = Math.max(...pts.map(p => p.x));
    const maxY = Math.max(...pts.map(p => p.y));

    this.chart.options.scales.x.min = 0;
    this.chart.options.scales.x.max = Math.max(0.5, maxT * 1.05);
    this.chart.options.scales.y.min = -0.005;
    this.chart.options.scales.y.max = Math.max(0.02, maxY * 1.15);
    this.chart.update();
  }

  fitPeaks(peaks = []) {
    if (!this.chart) return;
    const pts = this.chart.data.datasets[0].data;
    if (!pts.length) return;

    // Filter points with signal above baseline (signal > 0.005 AU)
    const peakPts = pts.filter(p => p.y > 0.005);
    if (!peakPts.length) {
      this.fitAll();
      return;
    }

    const minT = Math.max(0, Math.min(...peakPts.map(p => p.x)) - 0.2);
    const maxT = Math.max(...peakPts.map(p => p.x)) + 0.3;
    const maxY = Math.max(...peakPts.map(p => p.y));

    this.chart.options.scales.x.min = minT;
    this.chart.options.scales.x.max = maxT;
    this.chart.options.scales.y.min = -0.005;
    this.chart.options.scales.y.max = maxY * 1.15;
    this.chart.update();
  }

  resetZoom() {
    if (!this.chart) return;
    this.chart.options.scales.x.min = 0;
    delete this.chart.options.scales.x.max;
    this.chart.options.scales.x.suggestedMax = 3;
    this.chart.options.scales.y.min = -0.01;
    delete this.chart.options.scales.y.max;
    this.chart.options.scales.y.suggestedMax = 1.2;
    this.chart.update();
  }
}
