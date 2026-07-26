/**
 * ChromatogramFullscreen.js — P8 Fullscreen & PNG Export
 *
 * Wraps the chromatogram container in a fullscreen overlay and provides
 * a PNG export that embeds run metadata (compound, method, timestamp).
 *
 * Uses the standard Fullscreen API with graceful fallback.
 */
export class ChromatogramFullscreen {
  /**
   * @param {string} containerId  – chromatogram-container element id
   * @param {string} canvasId     – graphCanvas element id
   * @param {Function} getMetadata – () => { compound, flowRate, organicPercent, wavelength }
   */
  constructor(containerId, canvasId, getMetadata = () => ({})) {
    this.container = document.getElementById(containerId);
    this.canvasId  = canvasId;
    this.getMetadata = getMetadata;
    this._isFullscreen = false;

    this._injectStyles();
    this._injectButtons();
    this._bindEvents();
  }

  _injectStyles() {
    if (document.getElementById('chrom-fs-styles')) return;
    const style = document.createElement('style');
    style.id = 'chrom-fs-styles';
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity:0; transform:translateY(10px); }
        to   { opacity:1; transform:translateY(0);    }
      }
      .chrom-fs-overlay {
        position: fixed !important;
        inset: 0 !important;
        z-index: 9000 !important;
        width: 100vw !important;
        height: 100vh !important;
        border-radius: 0 !important;
        background: #020810 !important;
      }
      .chrom-fs-btn-bar {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        gap: 8px;
        z-index: 9001;
      }
      .chrom-fs-btn {
        background: rgba(15,23,42,0.85);
        border: 1px solid rgba(56,189,248,0.3);
        color: #f1f5f9;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.75rem;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        cursor: pointer;
        min-height: 36px;
        transition: background 150ms ease;
        backdrop-filter: blur(8px);
      }
      .chrom-fs-btn:hover { background: rgba(30,41,59,0.95); }
    `;
    document.head.appendChild(style);
  }

  _injectButtons() {
    if (!this.container) return;

    const bar = document.createElement('div');
    bar.className = 'chrom-fs-btn-bar';
    bar.id = 'chromFsBtnBar';

    const fsBtn = document.createElement('button');
    fsBtn.className = 'chrom-fs-btn';
    fsBtn.id = 'chromFsBtn';
    fsBtn.title = 'Fullscreen (F)';
    fsBtn.innerHTML = '⛶ Fullscreen';
    fsBtn.onclick = () => this.toggle();

    const expBtn = document.createElement('button');
    expBtn.className = 'chrom-fs-btn';
    expBtn.id = 'chromExportBtn';
    expBtn.title = 'Export PNG (E)';
    expBtn.innerHTML = '↓ Export PNG';
    expBtn.onclick = () => this.exportPng();

    bar.appendChild(fsBtn);
    bar.appendChild(expBtn);
    this.container.appendChild(bar);
  }

  _bindEvents() {
    // ESC to exit fullscreen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isFullscreen) this.exit();
    });

    // Browser-native fullscreen exit (F11 or user gesture)
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this._isFullscreen) {
        this._exitCssFullscreen();
      }
    });
  }

  toggle() {
    this._isFullscreen ? this.exit() : this.enter();
  }

  enter() {
    if (!this.container) return;
    this._isFullscreen = true;
    this.container.classList.add('chrom-fs-overlay');
    document.body.style.overflow = 'hidden';

    const fsBtn = document.getElementById('chromFsBtn');
    if (fsBtn) fsBtn.innerHTML = '✕ Exit Fullscreen';

    // Request native fullscreen for true immersion
    this.container.requestFullscreen?.().catch(() => {});
  }

  exit() {
    this._exitCssFullscreen();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }

  _exitCssFullscreen() {
    if (!this.container) return;
    this._isFullscreen = false;
    this.container.classList.remove('chrom-fs-overlay');
    document.body.style.overflow = '';

    const fsBtn = document.getElementById('chromFsBtn');
    if (fsBtn) fsBtn.innerHTML = '⛶ Fullscreen';
  }

  exportPng() {
    const canvas = document.getElementById(this.canvasId);
    if (!canvas) return;

    const meta = this.getMetadata();
    const { compound = 'HPLC Run', flowRate = '?', organicPercent = '?', wavelengthNm = 254 } = meta;
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');

    // Draw metadata banner onto a temporary canvas
    const exportCanvas = document.createElement('canvas');
    const padding  = 44;
    exportCanvas.width  = canvas.width;
    exportCanvas.height = canvas.height + padding;
    const ctx = exportCanvas.getContext('2d');

    // Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Copy chromatogram
    ctx.drawImage(canvas, 0, 0);

    // Metadata banner at bottom
    ctx.fillStyle = 'rgba(15,23,42,0.95)';
    ctx.fillRect(0, canvas.height, exportCanvas.width, padding);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Virtual HPLC Simulator  |  ${compound}  |  Flow ${flowRate} mL/min  |  %B ${organicPercent}%  |  λ ${wavelengthNm}nm  |  ${ts}`,
      12, canvas.height + 28
    );

    const link = document.createElement('a');
    link.download = `hplc_${compound.replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }
}
