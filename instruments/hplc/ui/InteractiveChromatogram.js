/**
 * InteractiveChromatogram.js — Peak Click Inspector, Zoom, Annotations & Live Retention Markers
 *
 * Extends GraphView with:
 *  - Live retention target markers (faint vertical dashed lines at predicted tR, lighting up green when detected)
 *  - Peak annotation labels directly on the chart (compound name + tR)
 *  - Click-to-inspect: hover/click any peak to show a floating inspector card
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
    this._expectedMarkers = []; // [{ compound, tR, detected: boolean }]

    this._injectInspectorDOM();
    this._bindCanvasEvents();
    this._registerMarkerPlugin();
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /** Live Retention Markers: set predicted analyte markers for current run */
  setExpectedMarkers(analytes = []) {
    this._expectedMarkers = analytes.map(a => ({
      compound: a.compound,
      tR: a.tR,
      detected: false
    }));
    if (this.chart) this.chart.update('none');
  }

  /** Live Retention Markers: highlight marker as detected when peak elutes */
  markLiveDetected(compoundName) {
    const marker = this._expectedMarkers.find(m => m.compound === compoundName);
    if (marker) {
      marker.detected = true;
      if (this.chart) this.chart.update('none');
    }
  }

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
    this._expectedMarkers = [];
    this._hideInspector();
    this._clearAnnotations();
  }

  /* ── Live Retention Markers Canvas Plugin ────────────────────────────── */

  _registerMarkerPlugin() {
    if (!this.chart) return;

    const self = this;
    const pluginId = 'liveRetentionMarkers';

    // Register Chart.js plugin for canvas drawing
    Chart.register({
      id: pluginId,
      afterDraw(chart) {
        if (!self._expectedMarkers.length) return;

        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        if (!xAxis || !yAxis) return;

        ctx.save();

        self._expectedMarkers.forEach(marker => {
          const xPixel = xAxis.getPixelForValue(marker.tR);

          // Only draw if within current visible x-axis viewport
          if (xPixel < xAxis.left || xPixel > xAxis.right) return;

          const topY    = yAxis.top + 10;
          const bottomY = yAxis.bottom;

          ctx.beginPath();
          ctx.setLineDash(marker.detected ? [] : [4, 4]);
          ctx.strokeStyle = marker.detected ? '#22c55e' : 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth   = marker.detected ? 2 : 1;
          ctx.moveTo(xPixel, topY);
          ctx.lineTo(xPixel, bottomY);
          ctx.stroke();

          // Label pill
          const labelText = marker.detected ? `✓ ${marker.compound}` : `| ${marker.compound} (${marker.tR.toFixed(2)}m)`;
          ctx.font = marker.detected ? 'bold 10px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';

          const textWidth = ctx.measureText(labelText).width;
          const pillX = Math.max(xAxis.left + 5, Math.min(xPixel - textWidth / 2 - 6, xAxis.right - textWidth - 12));
          const pillY = topY - 2;

          ctx.fillStyle = marker.detected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = marker.detected ? '#16a34a' : 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.roundRect(pillX, pillY, textWidth + 12, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = marker.detected ? '#ffffff' : '#38bdf8';
          ctx.fillText(labelText, pillX + 6, pillY + 11);
        });

        ctx.restore();
      }
    });
  }

  /* ── Peak Annotations on Chart ──────────────────────────────────────────── */

  _renderAnnotations() {
    if (!this.chart || !this._peaks.length) return;

    while (this.chart.data.datasets.length > 2) {
      this.chart.data.datasets.pop();
    }

    const annotationDataset = {
      label: 'Peak Labels',
      data: this._peaks.map(p => ({ x: p.tR, y: p.height })),
      pointStyle: 'circle',
      pointRadius: 5,
      pointBackgroundColor: '#38bdf8',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      showLine: false
    };

    this.chart.data.datasets.push(annotationDataset);
    this.chart.update('none');
  }

  _clearAnnotations() {
    if (!this.chart) return;
    while (this.chart.data.datasets.length > 1) {
      this.chart.data.datasets.pop();
    }
    if (this._referenceData) this._renderGhostOverlay();
    this.chart.update('none');
  }

  /* ── Ghost Reference Overlay ────────────────────────────────────────────── */

  _renderGhostOverlay() {
    if (!this.chart) return;

    const existingIdx = this.chart.data.datasets.findIndex(d => d.label === 'Reference Run');
    if (existingIdx !== -1) {
      this.chart.data.datasets.splice(existingIdx, 1);
    }

    if (this._referenceData) {
      this.chart.data.datasets.push({
        label: 'Reference Run',
        data: this._referenceData,
        borderColor: 'rgba(148, 163, 184, 0.45)',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0.1
      });
    }

    this.chart.update('none');
  }

  /* ── Click Inspector DOM & Events ────────────────────────────────────────── */

  _injectInspectorDOM() {
    if (document.getElementById(this.inspectorId)) return;

    const div = document.createElement('div');
    div.id = this.inspectorId;
    div.style.cssText = `
      position: absolute; display: none; z-index: 100;
      background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 10px; padding: 12px 14px; color: #f1f5f9;
      font-size: 0.8rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.6);
      pointer-events: auto; max-width: 240px;
    `;
    const container = this.canvas ? this.canvas.parentElement : document.body;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(div);
    }
  }

  _bindCanvasEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener('click', (e) => {
      if (!this._peaks.length || !this.chart) return;

      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const xAxis = this.chart.scales.x;
      if (!xAxis) return;

      const clickedT = xAxis.getValueForPixel(clickX);

      const closestPeak = this._peaks.reduce((best, p) => {
        const dist = Math.abs(p.tR - clickedT);
        return dist < best.dist ? { peak: p, dist } : best;
      }, { peak: null, dist: Infinity });

      if (closestPeak.peak && closestPeak.dist < 0.25) {
        this._showInspector(closestPeak.peak, e.clientX - rect.left, e.clientY - rect.top);
      } else {
        this._hideInspector();
      }
    });

    this.canvas.addEventListener('dblclick', () => {
      if (window._graphViewInstance) {
        window._graphViewInstance.resetZoom();
      }
    });
  }

  _showInspector(peak, posX, posY) {
    const el = document.getElementById(this.inspectorId);
    if (!el) return;

    const isFail = (peak.resolution !== null && peak.resolution < 1.5) || (peak.tailingFactor && peak.tailingFactor > 2.0);

    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <strong style="color:${isFail ? '#f87171' : '#38bdf8'}; font-size:0.85rem;">
          ${peak.compound}
        </strong>
        <button onclick="document.getElementById('${this.inspectorId}').style.display='none'"
          style="background:none; border:none; color:#64748b; font-size:1rem; cursor:pointer; padding:0 4px;">×</button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-family:'JetBrains Mono',monospace; font-size:0.75rem;">
        <div><span style="color:#64748b;">tR:</span> <strong>${peak.tR.toFixed(2)} m</strong></div>
        <div><span style="color:#64748b;">Height:</span> <strong>${peak.height.toFixed(3)} AU</strong></div>
        <div><span style="color:#64748b;">k':</span> <strong>${(peak.kPrime || 0).toFixed(2)}</strong></div>
        <div><span style="color:#64748b;">N:</span> <strong>${Math.round(peak.plates || 0)}</strong></div>
        <div><span style="color:#64748b;">Rs:</span> <strong style="color:${(peak.resolution < 1.5 && peak.resolution !== null) ? '#f87171' : '#34d399'}">${peak.resolution !== null ? peak.resolution.toFixed(2) : '—'}</strong></div>
        <div><span style="color:#64748b;">α:</span> <strong>${peak.selectivity !== null ? peak.selectivity.toFixed(2) : '—'}</strong></div>
      </div>
      ${isFail ? `
        <div style="margin-top:8px; padding:6px 8px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:6px; font-size:0.7rem; color:#fca5a5;">
          ⚠ ${peak.resolution < 1.5 ? 'Rs < 1.5 co-elution risk' : 'Tailing Tf > 2.0'}
        </div>
      ` : ''}
    `;

    const containerWidth = this.canvas.parentElement.offsetWidth || 600;
    const left = posX > containerWidth - 250 ? posX - 250 : posX + 15;
    const top  = Math.max(10, posY - 60);

    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
    el.style.display = 'block';
  }

  _hideInspector() {
    const el = document.getElementById(this.inspectorId);
    if (el) el.style.display = 'none';
  }
}
