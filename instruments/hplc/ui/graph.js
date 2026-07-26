/**
 * graph.js - Chart.js Chromatogram Canvas View (Strict Rendering Only)
 * Listens to controller events to render dynamic time-series line graph.
 */
export class GraphView {
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
        datasets: [{
          label: 'Absorbance (AU)',
          data: [],
          borderColor: '#1565c0',
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
            title: { display: true, text: 'Time (min)' },
            min: 0,
            suggestedMax: 3
          },
          y: {
            title: { display: true, text: 'Signal (AU)' },
            min: -0.05,
            suggestedMax: 1.2
          }
        }
      }
    });
  }

  reset() {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = [];
    this.chart.options.scales.x.min = 0;
    this.chart.options.scales.x.suggestedMax = 3;
    this.chart.update();
  }

  addPoint(t, y) {
    if (!this.chart) return;
    this.chart.data.datasets[0].data.push({ x: t, y: y });
    if (t > this.chart.options.scales.x.suggestedMax) {
      this.chart.options.scales.x.suggestedMax = Math.ceil(t + 1);
    }
    this.chart.update('none'); // Update without animation lag
  }
}
