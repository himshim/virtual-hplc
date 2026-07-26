/**
 * InteractiveChromatogram.js — P9 Peak Click Inspector, Zoom, Annotations
 *
 * Extends GraphView with:
 *  - Peak annotation labels directly on the chart (compound name + tR)
 *  - Click-to-inspect: hover/click any peak to show a floating inspector card
 *  - Scroll-to-zoom on the time axis (Chart.js zoom plugin if available,
 *    otherwise manual scale manipulation)
 *  - Ghost reference overlay (previous run shown as a dashed grey line)
 */
export class InteractiveChromatogram {
  /**
   * @param {Chart}  chart       – the Chart.js instance from GraphView
   * @param {string} canvasId   – DOM id of the canvas
   * @param {string} inspectorId – DOM id of the inspector card container
   */
  constructor(chart, canvasId, inspectorId = 'peak-inspector') {
    this.chart = chart;
    this.canvas = document.getElementById(canvasId);
    this.inspectorId = inspectorId;
    this._peaks = [];           // [{ compound, tR, height, kPrime, plates, resolution }]
    this._referenceData = null; // previous run dataset for ghost overlay
    this._annotationPlugin = null;

    this._injectInspectorDOM();
    this._bindCanvasEvents();
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /** Called after run completes with detected peaks array */
  setPeaks(peaks) {
    this._peaks = peaks || [];
    this._renderAnnotations();
  }

  /** Ghost overlay: show previous run as dashed grey dataset */
  setReferenceRun(data) {
    this._referenceData = data;
    this._renderGhostOverlay();
  }

  clearReference() {
    this._referenceData = null;
    this._renderGhostOverlay();
  }

  reset() {
    this._peaks = [];
    this._hideInspector();
    this._clearAnnotations();
  }

  /* ── Peak Annotations on Chart ──────────────────────────────────────────── */

  _renderAnnotations() {
    if (!this.chart || !this._peaks.length) return;

    // Remove previous annotation datasets (index 2+)
    while (this.chart.data.datasets.length > 2) {
      this.chart.data.datasets.pop();
    }

    // For each peak, add a single-point scatter to mark tR
    this._peaks.forEach((peak, i) => {
      const color = this._peakColor(i);
      this.chart.data.datasets.push({
        type: 'scatter',
        label: peak.compound,
        data: [{ x: peak.tR, y: peak.height + 0.04 }],
        backgroundColor: color,
        borderColor: color,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointStyle: 'triangle',
        showLine: false,
        order: 0
      });
    });

    this.chart.update('none');
    this._drawAnnotationLabels();
  }

  /** Draw compound name labels directly on canvas using afterDraw plugin */
  _drawAnnotationLabels() {
    // Remove old plugin if registered
    const pluginId = 'peakLabels';
    const existingIdx = Chart.registry.plugins.items.findIndex(p => p.id === pluginId);
    if (existingIdx > -1) Chart.unregister(Chart.registry.plugins.items[existingIdx]);

    const peaks = this._peaks;
    const plugin = {
      id: pluginId,
      afterDraw(chart) {
        if (!peaks.length) return;
        const ctx = chart.ctx;
        const xScale = chart.scales.x;
        const yScale = chart.scales.y;

        peaks.forEach((peak, i) => {
          const x = xScale.getPixelForValue(peak.tR);
          const y = yScale.getPixelForValue(peak.height + 0.06);
          if (!x || !y) return;

          ctx.save();
          ctx.fillStyle = InteractiveChromatogram._peakColorStatic(i);
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          // Background pill
          const label = peak.compound;
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(15,23,42,0.8)';
          ctx.beginPath();
          ctx.roundRect(x - tw / 2 - 5, y - 16, tw + 10, 16, 4);
          ctx.fill();
          ctx.fillStyle = InteractiveChromatogram._peakColorStatic(i);
          ctx.fillText(label, x, y - 1);
          ctx.restore();
        });
      }
    };

    Chart.register(plugin);
    this.chart.update('none');
  }

  _clearAnnotations() {
    if (!this.chart) return;
    while (this.chart.data.datasets.length > 2) {
      this.chart.data.datasets.pop();
    }
    this.chart.update('none');
  }

  /* ── Ghost Reference Overlay ─────────────────────────────────────────────── */

  _renderGhostOverlay() {
    if (!this.chart) return;

    // Remove existing ghost dataset (index 1)
    if (this.chart.data.datasets.length > 1) {
      this.chart.data.datasets.splice(1, 1);
    }

    if (this._referenceData) {
      this.chart.data.datasets.splice(1, 0, {
        label: 'Previous Run',
        data: this._referenceData,
        borderColor: 'rgba(148,163,184,0.45)',
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        tension: 0.1,
        fill: false,
        order: 1
      });
    }

    this.chart.update('none');
  }

  /* ── Click Inspector ─────────────────────────────────────────────────────── */

  _injectInspectorDOM() {
    if (document.getElementById(this.inspectorId)) return;

    const el = document.createElement('div');
    el.id = this.inspectorId;
    el.style.cssText = `
      position: absolute; display: none; z-index: 800;
      background: #0f172a; border: 1px solid rgba(56,189,248,0.4);
      border-radius: 12px; padding: 14px 16px;
      font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
      color: #f1f5f9; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      pointer-events: none; min-width: 210px;
      animation: fadeInUp 150ms ease;
    `;

    const container = this.canvas?.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(el);
    } else {
      document.body.appendChild(el);
    }
  }

  _bindCanvasEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('click', (e) => {
      const peak = this._findNearestPeak(e);
      if (peak) {
        this._showInspector(peak, e.offsetX, e.offsetY);
      } else {
        this._hideInspector();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const peak = this._findNearestPeak(e);
      this.canvas.style.cursor = peak ? 'crosshair' : 'default';
    });

    // Scroll to zoom (time axis)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!this.chart) return;
      const xScale = this.chart.scales.x;
      const factor = e.deltaY > 0 ? 1.2 : 0.85;
      const mid = (xScale.min + xScale.max) / 2;
      const half = ((xScale.max - xScale.min) / 2) * factor;
      this.chart.options.scales.x.min = Math.max(0, mid - half);
      this.chart.options.scales.x.max = mid + half;
      this.chart.options.scales.x.suggestedMax = mid + half;
      this.chart.update('none');
    }, { passive: false });

    // Double-click to reset zoom
    this.canvas.addEventListener('dblclick', () => {
      if (!this.chart) return;
      this.chart.options.scales.x.min = 0;
      delete this.chart.options.scales.x.max;
      this.chart.update('none');
    });
  }

  _findNearestPeak(e) {
    if (!this._peaks.length || !this.chart) return null;

    const xScale = this.chart.scales.x;
    const clickT = xScale.getValueForPixel(e.offsetX);
    const tolerance = (xScale.max - xScale.min) * 0.04; // 4% of visible range

    let nearest = null;
    let minDist  = Infinity;

    this._peaks.forEach(peak => {
      const dist = Math.abs(peak.tR - clickT);
      if (dist < tolerance && dist < minDist) {
        minDist  = dist;
        nearest = peak;
      }
    });

    return nearest;
  }

  _showInspector(peak, offsetX, offsetY) {
    const el = document.getElementById(this.inspectorId);
    if (!el) return;

    const container = this.canvas?.parentElement;
    const cw = container?.offsetWidth || 400;
    const ch = container?.offsetHeight || 300;

    el.style.display = 'block';

    // System suitability colour coding
    const rsOk  = !peak.resolution || peak.resolution >= 1.5;
    const nOk   = !peak.plates     || peak.plates >= 2000;

    el.innerHTML = `
      <div style="font-size:0.65rem; color:#38bdf8; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:8px; font-weight:800;">
        🔬 Peak Inspector
      </div>
      <div style="font-size:1rem; font-weight:800; color:#f1f5f9; margin-bottom:10px;">${peak.compound}</div>
      <table style="border-collapse:collapse; width:100%;">
        ${[
          ['tR (min)',     peak.tR?.toFixed(3)        ?? '—'],
          ['Height (AU)',  peak.height?.toFixed(4)     ?? '—'],
          ["k' (ret. factor)", peak.kPrime?.toFixed(3) ?? '—'],
          ['Plates (N)',   peak.plates ? Math.round(peak.plates).toLocaleString() : '—', !nOk && '#ef4444'],
          ['Resolution Rs', peak.resolution?.toFixed(3) ?? '—', !rsOk && '#ef4444'],
          ['Selectivity α', peak.selectivity?.toFixed(3) ?? '—'],
        ].map(([lbl, val, warn]) => `
          <tr>
            <td style="padding:3px 10px 3px 0; color:#64748b; white-space:nowrap;">${lbl}</td>
            <td style="color:${warn || '#f1f5f9'}; font-weight:${warn ? '700' : '500'};">${val}</td>
          </tr>
        `).join('')}
      </table>
      ${!rsOk ? `<div style="margin-top:8px; color:#fbbf24; font-size:0.68rem;">⚠ Rs < 1.5 — poor resolution</div>` : ''}
      ${!nOk  ? `<div style="margin-top:4px; color:#fbbf24; font-size:0.68rem;">⚠ N < 2000 — low efficiency</div>` : ''}
      <div style="margin-top:10px; color:#334155; font-size:0.62rem; border-top:1px solid #1e293b; padding-top:6px;">
        Double-click chart to reset zoom · Scroll to zoom
      </div>
    `;

    // Smart placement: avoid overflow
    let left = offsetX + 16;
    let top  = offsetY - 20;
    if (left + 220 > cw) left = offsetX - 230;
    if (top  + 280 > ch) top  = offsetY - 280;
    if (top  < 10)       top  = 10;

    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
  }

  _hideInspector() {
    const el = document.getElementById(this.inspectorId);
    if (el) el.style.display = 'none';
  }

  /* ── Helpers ─────────────────────────────────────────────────────────────── */

  _peakColor(i) {
    return InteractiveChromatogram._peakColorStatic(i);
  }

  static _peakColorStatic(i) {
    const palette = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#fb923c', '#e879f9'];
    return palette[i % palette.length];
  }
}
