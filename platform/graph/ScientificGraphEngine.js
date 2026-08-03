/**
 * ScientificGraphEngine.js — Layered Platform Graph Subsystem (Level B Infrastructure)
 *
 * Orchestrates rendering, viewport persistence, accessibility, and toolbar actions
 * using any class extending GraphAdapter.
 */

export class ScientificGraphEngine {
  constructor(canvasElement, adapter, options = {}) {
    if (!canvasElement) throw new Error('ScientificGraphEngine requires a canvas element.');
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.adapter = adapter;
    this.options = options;

    // Viewport State
    this.viewport = {
      zoomLevel: 1.0,
      panX: 0,
      panY: 0
    };

    this.savedViewport = { ...this.viewport };

    this._initCanvas();
    this.render();
  }

  setAdapter(adapter) {
    this.adapter = adapter;
    this.render();
  }

  saveViewport() {
    this.savedViewport = { ...this.viewport };
  }

  restoreViewport() {
    this.viewport = { ...this.savedViewport };
    this.render();
  }

  resetViewport() {
    this.viewport = { zoomLevel: 1.0, panX: 0, panY: 0 };
    this.render();
  }

  _initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 600;
    this.height = rect.height || 350;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  render() {
    if (!this.ctx || !this.adapter) return;
    const { ctx, width, height } = this;
    const axes = this.adapter.getAxes();
    const datasets = this.adapter.getDatasets();
    const annotations = this.adapter.getAnnotations();

    // 1. Clear Viewport (High-Contrast Dark Surface #0b0f19)
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid & Axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 50; x < width - 20; x += 50) {
      ctx.moveTo(x, 20); ctx.lineTo(x, height - 40);
    }
    for (let y = 20; y < height - 40; y += 40) {
      ctx.moveTo(50, y); ctx.lineTo(width - 20, y);
    }
    ctx.stroke();

    // 3. Render Datasets
    if (datasets && datasets.length > 0) {
      for (const ds of datasets) {
        if (!ds.data || ds.data.length === 0) continue;
        ctx.strokeStyle = ds.color || '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const xMin = axes.xAxis.min !== undefined ? axes.xAxis.min : Math.min(...ds.data.map(p => p.x));
        const xMax = axes.xAxis.max !== undefined ? axes.xAxis.max : Math.max(...ds.data.map(p => p.x));
        const yMin = axes.yAxis.min !== undefined ? axes.yAxis.min : 0;
        const yMax = axes.yAxis.max !== undefined ? axes.yAxis.max : Math.max(...ds.data.map(p => p.y), 1.0);

        const plotW = width - 70;
        const plotH = height - 60;

        ds.data.forEach((pt, i) => {
          let px = 50 + ((pt.x - xMin) / (xMax - xMin || 1)) * plotW;
          if (axes.xAxis.inverted) {
            px = 50 + plotW - ((pt.x - xMin) / (xMax - xMin || 1)) * plotW;
          }
          const py = (height - 40) - ((pt.y - yMin) / (yMax - yMin || 1)) * plotH;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });

        ctx.stroke();
      }
    }

    // 4. Render Annotations
    if (annotations && annotations.length > 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px sans-serif';
      for (const ann of annotations) {
        ctx.fillText(ann.label || '', 60, 40);
      }
    }

    // 5. Draw Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${axes.xAxis.label} (${axes.xAxis.unit})`, width / 2 - 30, height - 10);
  }
}
