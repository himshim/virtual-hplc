import { ScientificChart } from '../../../ui/components/ScientificChart.js';

/**
 * graph.js - Chart.js Chromatogram Canvas View
 *
 * v2.0: Authentic CDS-style axes — Response (mAU) Y-axis, Time (min) X-axis.
 *       Engine always operates in native AU units; formatting is UI-only.
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

    this.chart = ScientificChart.create(this.canvas, {
      instrumentType: 'hplc',
      xTitle: 'Time (min)',
      yTitle: 'Response (AU)',
      xMin: 0,
      xMax: 3.0,
      yMin: -0.01,
      yMax: 1.2,
      datasets: [{
        label: 'Response',
        data: [],
        borderColor: '#38bdf8',
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.12,
        fill: false
      }]
    });
  }

  setPeaks(peaks) {
    if (!this.chart || !Array.isArray(peaks)) return;
    if (this.chart.setPeakCallouts) {
      this.chart.setPeakCallouts(peaks.map(p => ({
        x: p.tR,
        y: p.height,
        label: `${p.tR.toFixed(2)} min`,
        sublabel: p.compound || 'Peak',
        color: '#38bdf8'
      })));
    }
    if (this.chart.setBaselineIntegrations) {
      this.chart.setBaselineIntegrations(peaks.map(p => ({
        startX: p.tR - (p.width || 0.1) / 2,
        endX: p.tR + (p.width || 0.1) / 2,
        apexX: p.tR,
        apexY: p.height,
        baselineY1: 0,
        baselineY2: 0
      })));
    }
  }

  reset() {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [];
    if (this.chart.clearPeakAnnotations) {
      this.chart.clearPeakAnnotations();
    } else {
      this.chart._peakCallouts = [];
      this.chart._baselineIntegrations = [];
    }
    this.chart.options.scales.x.min = 0;
    delete this.chart.options.scales.x.max;
    this.chart.options.scales.x.suggestedMax = 5.0;
    this.chart.options.scales.y.min = -0.01;
    delete this.chart.options.scales.y.max;
    this.chart.options.scales.y.suggestedMax = 1.2;
    this.chart.update();
  }

  setRunTime(maxT) {
    if (!this.chart) return;
    this.chart.options.scales.x.min = 0;
    this.chart.options.scales.x.max = maxT;
    this.chart.options.scales.x.suggestedMax = maxT;
    this.chart.update('none');
  }

  addPoint(t, y) {
    if (!this.chart) return;
    this.chart.data.datasets[0].data.push({ x: t, y });
    if (t > (this.chart.options.scales.x.suggestedMax || 5)) {
      this.chart.options.scales.x.suggestedMax = Math.ceil(t + 1);
    }
    this.chart.update('none');
  }

  /* ── Zoom & Fit Controls ─────────────────────────────────────────────────── */

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

  fitPeaks() {
    if (!this.chart) return;
    const pts = this.chart.data.datasets[0].data;
    if (!pts.length) return;

    // Isolate points above baseline threshold (0.005 AU = 5 mAU)
    const peakPts = pts.filter(p => p.y > 0.005);
    if (!peakPts.length) { this.fitAll(); return; }

    const minT = Math.max(0, Math.min(...peakPts.map(p => p.x)) - 0.2);
    const maxT = Math.max(...peakPts.map(p => p.x)) + 0.3;
    const maxY = Math.max(...peakPts.map(p => p.y));

    this.chart.options.scales.x.min = minT;
    this.chart.options.scales.x.max = maxT;
    this.chart.options.scales.y.min = -0.002;
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
