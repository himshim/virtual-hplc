/**
 * ScientificChart.js — Unified High-End Scientific Chart Factory
 *
 * Provides authentic, industry-standard spectroscopic and chromatographic
 * rendering across all 4 analytical instruments:
 * - 📄 Authentic Laboratory White Canvas Background (Default) with 1-Click Dark Mode Toggle
 * - 🏷️ Peak Apex Drop-Needles & Anti-Collision Callout Tags
 * - 📐 Baseline Integration Tangents & Area Shading (GC-FID & HPLC)
 * - 🗺️ FTIR Region Delimitation Shading (Diagnostic vs. Fingerprint)
 * - 🎛️ High-Precision Instrument Crosshair HUD
 * - 📷 High-Resolution Spectrum / Chromatogram PNG Export
 */

export const CHART_THEMES = {
  light: {
    name: 'light',
    bg: '#ffffff',
    borderColor: '#e2e8f0',
    grid: 'rgba(0, 0, 0, 0.06)',
    axisBorder: 'rgba(0, 0, 0, 0.2)',
    axisTitle: '#1e293b',
    axisTicks: '#475569',
    traceColor: '#0284c7',
    traceFill: 'rgba(2, 132, 199, 0.08)',
    baselineTangent: '#16a34a',
    baselineFill: 'rgba(2, 132, 199, 0.08)',
    needleColor: 'rgba(2, 132, 199, 0.45)',
    apexDot: '#0284c7',
    badgeBg: 'rgba(255, 255, 255, 0.96)',
    badgeBorder: '#cbd5e1',
    badgePrimary: '#0284c7',
    badgeSecondary: '#475569',
    hudBg: 'rgba(255, 255, 255, 0.94)',
    hudBorder: '#cbd5e1',
    hudText: '#0f172a',
    hudActive: '#0284c7',
    ftirDiagBg: 'rgba(2, 132, 199, 0.035)',
    ftirFpBg: 'rgba(147, 51, 234, 0.035)',
    ftirSplitLine: 'rgba(0, 0, 0, 0.1)',
    ftirDiagText: '#0284c7',
    ftirFpText: '#9333ea',
    crosshairLine: 'rgba(2, 132, 199, 0.4)'
  },
  dark: {
    name: 'dark',
    bg: '#0b0f19',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    grid: 'rgba(255, 255, 255, 0.04)',
    axisBorder: 'rgba(255, 255, 255, 0.1)',
    axisTitle: '#94a3b8',
    axisTicks: '#64748b',
    traceColor: '#38bdf8',
    traceFill: 'rgba(56, 189, 248, 0.08)',
    baselineTangent: '#22c55e',
    baselineFill: 'rgba(56, 189, 248, 0.08)',
    needleColor: 'rgba(56, 189, 248, 0.45)',
    apexDot: '#38bdf8',
    badgeBg: 'rgba(15, 23, 42, 0.94)',
    badgeBorder: 'rgba(56, 189, 248, 0.6)',
    badgePrimary: '#38bdf8',
    badgeSecondary: '#94a3b8',
    hudBg: 'rgba(15, 23, 42, 0.88)',
    hudBorder: 'rgba(255, 255, 255, 0.08)',
    hudText: '#64748b',
    hudActive: '#38bdf8',
    ftirDiagBg: 'rgba(56, 189, 248, 0.025)',
    ftirFpBg: 'rgba(168, 85, 247, 0.025)',
    ftirSplitLine: 'rgba(255, 255, 255, 0.08)',
    ftirDiagText: 'rgba(56, 189, 248, 0.7)',
    ftirFpText: 'rgba(192, 132, 252, 0.7)',
    crosshairLine: 'rgba(56, 189, 248, 0.4)'
  }
};

export class ScientificChart {
  /**
   * Creates or wraps a standardized Chart.js instance.
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @returns {Chart}
   */
  static create(canvas, options = {}) {
    if (!canvas || typeof Chart === 'undefined') {
      console.warn('[ScientificChart] Chart.js or canvas not found.');
      return null;
    }

    const {
      instrumentType = 'generic', // 'uvvis', 'ftir', 'gc', 'hplc'
      theme = 'light',            // Default to authentic lab white
      xTitle = 'Wavelength (nm)',
      yTitle = 'Absorbance (AU)',
      xMin = 200,
      xMax = 800,
      yMin = 0,
      yMax = 2.0,
      xInverted = false,
      isFtir = false,
      plugins = [],
      datasets = []
    } = options;

    let currentThemeName = theme === 'dark' ? 'dark' : 'light';
    let T = CHART_THEMES[currentThemeName];

    // 1. Canvas Background Plugin
    const canvasBackgroundPlugin = {
      id: 'canvasBackground',
      beforeDraw: (chart) => {
        const { ctx, width, height } = chart;
        ctx.save();
        ctx.fillStyle = T.bg;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    };

    // 2. FTIR Spectral Region Delimitation Plugin
    const ftirRegionsPlugin = {
      id: 'ftirRegions',
      beforeDraw: (chart) => {
        if (!isFtir && !chart._showFtirRegions) return;
        const { ctx, chartArea: { top, bottom, left, right }, scales: { x } } = chart;
        if (!x) return;

        const splitX = x.getPixelForValue(1500);
        if (splitX < left || splitX > right) return;

        ctx.save();

        // Diagnostic Region (4000 - 1500 cm^-1)
        const diagLeft = Math.min(left, splitX);
        const diagWidth = Math.abs(splitX - left);
        ctx.fillStyle = T.ftirDiagBg;
        ctx.fillRect(diagLeft, top, diagWidth, bottom - top);

        // Fingerprint Region (1500 - 400 cm^-1)
        const fpLeft = Math.min(splitX, right);
        const fpWidth = Math.abs(right - splitX);
        ctx.fillStyle = T.ftirFpBg;
        ctx.fillRect(fpLeft, top, fpWidth, bottom - top);

        // Region dividing line
        ctx.strokeStyle = T.ftirSplitLine;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(splitX, top);
        ctx.lineTo(splitX, bottom);
        ctx.stroke();

        // Region Header Labels
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = T.ftirDiagText;
        ctx.fillText('DIAGNOSTIC (4000–1500 cm⁻¹)', left + 10, top + 14);

        ctx.fillStyle = T.ftirFpText;
        ctx.fillText('FINGERPRINT (1500–400 cm⁻¹)', splitX + 10, top + 14);

        ctx.restore();
      }
    };

    // 3. Baseline Integration Tangents & Shading Plugin (GC & HPLC)
    const baselineIntegrationPlugin = {
      id: 'baselineIntegration',
      beforeDatasetsDraw: (chart) => {
        if (chart._showBaselineIntegrations === false || !chart._baselineIntegrations || !chart._baselineIntegrations.length) return;
        const { ctx, scales: { x, y } } = chart;
        if (!x || !y) return;

        ctx.save();
        chart._baselineIntegrations.forEach(peak => {
          const x1 = x.getPixelForValue(peak.startX || (peak.apexX - (peak.width || 0.1) / 2));
          const x2 = x.getPixelForValue(peak.endX || (peak.apexX + (peak.width || 0.1) / 2));
          const yBase1 = y.getPixelForValue(peak.baselineY1 || 0);
          const yBase2 = y.getPixelForValue(peak.baselineY2 || 0);
          const xApex = x.getPixelForValue(peak.apexX);
          const yApex = y.getPixelForValue(peak.apexY);

          // Integrated Area Fill
          ctx.beginPath();
          ctx.moveTo(x1, yBase1);
          ctx.lineTo(xApex, yApex);
          ctx.lineTo(x2, yBase2);
          ctx.closePath();
          ctx.fillStyle = T.baselineFill;
          ctx.fill();

          // Baseline Tangent Line
          ctx.beginPath();
          ctx.moveTo(x1, yBase1);
          ctx.lineTo(x2, yBase2);
          ctx.strokeStyle = T.baselineTangent;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Start & End Tick Marks
          ctx.beginPath();
          ctx.moveTo(x1, yBase1 - 4);
          ctx.lineTo(x1, yBase1 + 4);
          ctx.moveTo(x2, yBase2 - 4);
          ctx.lineTo(x2, yBase2 + 4);
          ctx.stroke();
        });
        ctx.restore();
      }
    };

    // 4. Peak Apex Drop-Needle & Callout Flag Plugin
    const peakCalloutsPlugin = {
      id: 'peakCallouts',
      afterDraw: (chart) => {
        if (chart._showPeakCallouts === false || !chart._peakCallouts || !chart._peakCallouts.length) return;
        const { ctx, chartArea: { top, bottom, left, right }, scales: { x, y } } = chart;
        if (!x || !y) return;

        ctx.save();
        chart._peakCallouts.forEach(peak => {
          const px = x.getPixelForValue(peak.x);
          const py = y.getPixelForValue(peak.y);
          if (px < left || px > right || py < top || py > bottom) return;

          const basePy = y.getPixelForValue(peak.baseY !== undefined ? peak.baseY : (isFtir ? 100 : 0));
          const isTTransmission = isFtir;

          // Drop-Needle
          ctx.strokeStyle = peak.color || T.needleColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, basePy);
          ctx.stroke();

          // Apex Target Dot
          ctx.setLineDash([]);
          ctx.fillStyle = peak.color || T.apexDot;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
          ctx.fill();

          // Callout Badge Dimensions
          const primaryText = peak.label || `${peak.x.toFixed(1)}`;
          const subText = peak.sublabel || '';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          const primaryWidth = ctx.measureText(primaryText).width;
          ctx.font = '500 9px "JetBrains Mono", monospace';
          const subWidth = subText ? ctx.measureText(subText).width : 0;
          const boxWidth = Math.max(primaryWidth, subWidth) + 14;
          const boxHeight = subText ? 28 : 18;

          // Badge Positioning
          let badgeX = px - boxWidth / 2;
          badgeX = Math.max(left + 4, Math.min(right - boxWidth - 4, badgeX));

          let badgeY = isTTransmission ? py + 12 : py - boxHeight - 10;
          if (badgeY < top + 4) badgeY = py + 10;
          if (badgeY + boxHeight > bottom - 4) badgeY = py - boxHeight - 10;

          // Connector Line
          ctx.strokeStyle = peak.color || T.badgeBorder;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, isTTransmission ? badgeY : badgeY + boxHeight);
          ctx.stroke();

          // Callout Box
          ctx.fillStyle = T.badgeBg;
          ctx.strokeStyle = peak.color || T.badgeBorder;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, boxWidth, boxHeight, 4);
          ctx.fill();
          ctx.stroke();

          // Primary Text
          ctx.fillStyle = peak.color || T.badgePrimary;
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.fillText(primaryText, badgeX + 6, badgeY + (subText ? 11 : 13));

          // Sublabel Text
          if (subText) {
            ctx.fillStyle = T.badgeSecondary;
            ctx.font = '500 9px "JetBrains Mono", monospace';
            ctx.fillText(subText, badgeX + 6, badgeY + 23);
          }
        });
        ctx.restore();
      }
    };

    // 5. Scientific HUD Crosshair Plugin
    const crosshairPlugin = {
      id: 'scientificCrosshair',
      afterDraw: (chart) => {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { x, y } } = chart;
        if (!x || !y) return;

        ctx.save();

        // 1. Ambient HUD (Top Right)
        const activePt = chart._activeCrosshairPoint;
        let hudText = '';
        if (activePt) {
          hudText = `CURSOR [ ${activePt.hudX} | ${activePt.hudY} ]`;
        } else {
          hudText = `TRACE READY [ SPAN: ${x.min.toFixed(0)}–${x.max.toFixed(0)} ]`;
        }

        ctx.font = '600 10px "JetBrains Mono", monospace';
        const hudWidth = ctx.measureText(hudText).width;
        const hudX = right - hudWidth - 14;
        const hudY = top + 14;

        ctx.fillStyle = T.hudBg;
        ctx.strokeStyle = T.hudBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(hudX - 6, hudY - 11, hudWidth + 12, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = activePt ? T.hudActive : T.hudText;
        ctx.fillText(hudText, hudX, hudY + 2);

        // 2. Active Crosshair Lines on Pointer Scrub
        if (activePt) {
          const { px, py } = activePt;
          ctx.strokeStyle = T.crosshairLine;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);

          // Vertical crosshair
          ctx.beginPath();
          ctx.moveTo(px, top);
          ctx.lineTo(px, bottom);
          ctx.stroke();

          // Horizontal crosshair
          ctx.beginPath();
          ctx.moveTo(left, py);
          ctx.lineTo(right, py);
          ctx.stroke();
        }

        ctx.restore();
      }
    };

    const config = {
      type: 'line',
      data: {
        datasets: datasets.length > 0 ? datasets : [{
          label: 'Signal',
          data: [],
          borderColor: T.traceColor,
          borderWidth: 1.8,
          pointRadius: 0,
          fill: false,
          tension: 0.12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            type: 'linear',
            min: xMin,
            max: xMax,
            reverse: xInverted,
            title: {
              display: true,
              text: xTitle,
              color: T.axisTitle,
              font: { family: '"JetBrains Mono", monospace', size: 11, weight: '600' }
            },
            grid: {
              color: T.grid,
              borderColor: T.axisBorder
            },
            ticks: {
              color: T.axisTicks,
              font: { family: '"JetBrains Mono", monospace', size: 10 }
            }
          },
          y: {
            type: 'linear',
            min: yMin,
            max: yMax,
            title: {
              display: true,
              text: yTitle,
              color: T.axisTitle,
              font: { family: '"JetBrains Mono", monospace', size: 11, weight: '600' }
            },
            grid: {
              color: T.grid,
              borderColor: T.axisBorder
            },
            ticks: {
              color: T.axisTicks,
              font: { family: '"JetBrains Mono", monospace', size: 10 }
            }
          }
        }
      },
      plugins: [canvasBackgroundPlugin, ftirRegionsPlugin, baselineIntegrationPlugin, peakCalloutsPlugin, crosshairPlugin, ...plugins]
    };

    const chart = new Chart(canvas, config);
    chart._theme = currentThemeName;

    // Theme Management API
    chart.setTheme = function(themeName) {
      if (!CHART_THEMES[themeName]) return;
      currentThemeName = themeName;
      T = CHART_THEMES[themeName];
      this._theme = themeName;

      // Update Scales
      if (this.options.scales.x) {
        this.options.scales.x.title.color = T.axisTitle;
        this.options.scales.x.grid.color = T.grid;
        this.options.scales.x.grid.borderColor = T.axisBorder;
        this.options.scales.x.ticks.color = T.axisTicks;
      }
      if (this.options.scales.y) {
        this.options.scales.y.title.color = T.axisTitle;
        this.options.scales.y.grid.color = T.grid;
        this.options.scales.y.grid.borderColor = T.axisBorder;
        this.options.scales.y.ticks.color = T.axisTicks;
      }

      // Update Default Dataset Colors if present
      if (this.data.datasets[0]) {
        this.data.datasets[0].borderColor = T.traceColor;
        if (this.data.datasets[0].fill) {
          this.data.datasets[0].backgroundColor = T.traceFill;
        }
      }

      this.update('none');
    };

    chart.toggleTheme = function() {
      const nextTheme = this._theme === 'light' ? 'dark' : 'light';
      this.setTheme(nextTheme);
      return nextTheme;
    };

    chart.exportImage = function(filename = 'analytical_trace.png') {
      const url = this.toBase64Image('image/png', 1.0);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    // Attach Annotations Helpers
    chart._showPeakCallouts = true;
    chart._showBaselineIntegrations = true;
    chart._showFtirRegions = true;

    chart.togglePeakCallouts = function() {
      this._showPeakCallouts = !this._showPeakCallouts;
      this._showBaselineIntegrations = this._showPeakCallouts;
      this.update('none');
      return this._showPeakCallouts;
    };

    chart.setPeakCalloutsVisible = function(visible) {
      this._showPeakCallouts = !!visible;
      this._showBaselineIntegrations = !!visible;
      this.update('none');
    };

    chart.setPeakCallouts = function(peaks) {
      this._peakCallouts = Array.isArray(peaks) ? peaks : [];
      this.update('none');
    };

    chart.setBaselineIntegrations = function(integrations) {
      this._baselineIntegrations = Array.isArray(integrations) ? integrations : [];
      this.update('none');
    };

    chart.clearPeakAnnotations = function() {
      this._peakCallouts = [];
      this._baselineIntegrations = [];
      this.update('none');
    };

    chart._defaultLimits = { xMin, xMax, yMin, yMax, xInverted };

    chart.resetZoom = function() {
      const def = this._defaultLimits;
      if (this.options.scales.x) {
        this.options.scales.x.min = def.xMin;
        this.options.scales.x.max = def.xMax;
      }
      if (this.options.scales.y) {
        this.options.scales.y.min = def.yMin;
        this.options.scales.y.max = def.yMax;
      }
      this.update();
    };

    chart.fitAll = function() {
      const pts = (this.data.datasets[0] && this.data.datasets[0].data) || [];
      if (!pts.length) return;
      const xs = pts.map(p => p.x !== undefined ? p.x : 0);
      const ys = pts.map(p => p.y !== undefined ? p.y : 0);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      if (this.options.scales.x) {
        this.options.scales.x.min = Math.max(0, Math.floor(minX * 0.98));
        this.options.scales.x.max = Math.ceil(maxX * 1.02);
      }
      if (this.options.scales.y) {
        this.options.scales.y.min = Math.max(0, minY < 0 ? minY * 1.1 : 0);
        this.options.scales.y.max = Math.max(0.1, maxY * 1.15);
      }
      this.update();
    };

    chart.fitPeaks = function() {
      const pts = (this.data.datasets[0] && this.data.datasets[0].data) || [];
      if (!pts.length) return;

      if (instrumentType === 'uvvis') {
        const maxY = Math.max(...pts.map(p => p.y));
        const apexPt = pts.find(p => p.y === maxY);
        if (apexPt) {
          this.options.scales.x.min = Math.max(190, apexPt.x - 50);
          this.options.scales.x.max = Math.min(800, apexPt.x + 50);
          this.options.scales.y.min = -0.02;
          this.options.scales.y.max = Math.max(0.1, maxY * 1.25);
          this.update();
        }
      } else if (instrumentType === 'ftir') {
        this.options.scales.x.min = 500;
        this.options.scales.x.max = 3600;
        this.options.scales.y.min = 0;
        this.options.scales.y.max = 105;
        this.update();
      } else if (instrumentType === 'gc' || instrumentType === 'hplc') {
        if (this._peakCallouts && this._peakCallouts.length > 0) {
          const apexTimes = this._peakCallouts.map(p => p.x);
          const minT = Math.min(...apexTimes);
          const maxT = Math.max(...apexTimes);
          const pad = Math.max(0.3, (maxT - minT) * 0.35 + 0.3);
          this.options.scales.x.min = Math.max(0, minT - pad);
          this.options.scales.x.max = maxT + pad;
          const apexSignals = this._peakCallouts.map(p => p.y);
          const maxSig = Math.max(...apexSignals);
          this.options.scales.y.min = 0;
          this.options.scales.y.max = Math.max(0.1, maxSig * 1.25);
        } else {
          const maxY = Math.max(...pts.map(p => p.y));
          const apexPt = pts.find(p => p.y === maxY);
          if (apexPt) {
            this.options.scales.x.min = Math.max(0, apexPt.x - 1.0);
            this.options.scales.x.max = apexPt.x + 1.5;
            this.options.scales.y.min = 0;
            this.options.scales.y.max = Math.max(0.1, maxY * 1.25);
          }
        }
        this.update();
      }
    };

    // Crosshair mousemove & touch listeners
    const handlePointerMove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      const { left, right, top, bottom } = chart.chartArea;
      if (px < left || px > right || py < top || py > bottom) {
        chart._activeCrosshairPoint = null;
        chart.draw();
        return;
      }

      const xVal = chart.scales.x.getValueForPixel(px);
      const yVal = chart.scales.y.getValueForPixel(py);

      let hudX = `${xVal.toFixed(1)}`;
      let hudY = `${yVal.toFixed(3)}`;

      if (instrumentType === 'uvvis') {
        const trans = Math.max(0, Math.min(100, Math.pow(10, -yVal) * 100));
        hudX = `λ: ${xVal.toFixed(1)} nm`;
        hudY = `A: ${yVal.toFixed(4)} AU (${trans.toFixed(1)}%T)`;
      } else if (instrumentType === 'ftir') {
        hudX = `ν: ${xVal.toFixed(0)} cm⁻¹`;
        hudY = `T: ${yVal.toFixed(1)}%T`;
      } else if (instrumentType === 'gc') {
        hudX = `tR: ${xVal.toFixed(2)} min`;
        hudY = `FID: ${yVal.toFixed(2)} pA`;
      } else if (instrumentType === 'hplc') {
        hudX = `tR: ${xVal.toFixed(2)} min`;
        hudY = `UV: ${(yVal * 1000).toFixed(1)} mAU`;
      }

      chart._activeCrosshairPoint = {
        px,
        py,
        hudX,
        hudY
      };
      chart.draw();
    };

    const handlePointerLeave = () => {
      chart._activeCrosshairPoint = null;
      chart.draw();
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseleave', handlePointerLeave);
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('touchend', handlePointerLeave);

    return chart;
  }

  /**
   * Generates a floating/inline laboratory chart toolbar above a canvas.
   * @param {HTMLElement} container
   * @param {Chart} chartInstance
   * @param {Object} options
   */
  static attachToolbar(container, chartInstance, options = {}) {
    if (!container || !chartInstance) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'scientific-chart-toolbar';
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      padding: 6px 10px;
      background: rgba(15, 23, 42, 0.6);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px 8px 0 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
    `;

    // Theme Toggle Button
    const themeBtn = document.createElement('button');
    themeBtn.className = 'chart-tb-btn';
    themeBtn.innerHTML = '🌙 Dark';
    themeBtn.title = 'Toggle between Authentic Lab White and OLED Dark Theme';
    themeBtn.style.cssText = `
      padding: 3px 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      color: #e2e8f0;
      cursor: pointer;
      font-size: 0.72rem;
      transition: all 0.15s ease;
    `;
    themeBtn.onclick = () => {
      const next = chartInstance.toggleTheme();
      themeBtn.innerHTML = next === 'light' ? '🌙 Dark' : '☀️ Lab White';
    };

    // Auto-Fit / Reset Zoom Button
    const fitBtn = document.createElement('button');
    fitBtn.className = 'chart-tb-btn';
    fitBtn.innerHTML = '🔍 Fit';
    fitBtn.title = 'Auto-scale and fit graph trace';
    fitBtn.style.cssText = themeBtn.style.cssText;
    fitBtn.onclick = () => {
      if (options.onFit) {
        options.onFit();
      } else if (chartInstance.resetZoom) {
        chartInstance.resetZoom();
      } else {
        chartInstance.update();
      }
    };

    // Toggle Labels / Annotations Button
    const labelBtn = document.createElement('button');
    labelBtn.className = 'chart-tb-btn';
    labelBtn.innerHTML = '🏷️ Labels';
    labelBtn.title = 'Toggle Peak Labels, Baseline Tangents, and Annotations';
    labelBtn.style.cssText = themeBtn.style.cssText;
    labelBtn.onclick = () => {
      const show = chartInstance.togglePeakCallouts ? chartInstance.togglePeakCallouts() : true;
      labelBtn.innerHTML = show ? '🏷️ Labels' : '👁️ Raw Trace';
    };

    // Export PNG Button
    const exportBtn = document.createElement('button');
    exportBtn.className = 'chart-tb-btn';
    exportBtn.innerHTML = '📷 Export';
    exportBtn.title = 'Download High-Resolution PNG';
    exportBtn.style.cssText = themeBtn.style.cssText;
    exportBtn.onclick = () => {
      const name = options.exportName || 'analytical_spectrum.png';
      chartInstance.exportImage(name);
    };

    toolbar.appendChild(themeBtn);
    toolbar.appendChild(labelBtn);
    toolbar.appendChild(fitBtn);
    toolbar.appendChild(exportBtn);

    container.insertBefore(toolbar, container.firstChild);
    return toolbar;
  }
}
