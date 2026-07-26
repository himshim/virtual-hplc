/**
 * KeyboardShortcuts.js — P8 Global Keyboard Shortcut Manager
 *
 * Provides:
 *   R          → Run / Stop experiment (Beginner mode single-tap)
 *   F          → Toggle fullscreen chromatogram
 *   E          → Export chromatogram as PNG
 *   1–5        → Navigate to tab 1–5
 *   Escape     → Exit fullscreen / close any open modal
 *
 * Displays a floating shortcut hint on first visit.
 */
export class KeyboardShortcuts {
  /**
   * @param {Object} handlers – map of action → callback function
   *   { run, fullscreen, export: exportFn, tabs: [fn0..fn4] }
   */
  constructor(handlers = {}) {
    this.handlers = handlers;
    this._active = true;
    this._bind();
    this._maybeShowHint();
  }

  _bind() {
    document.addEventListener('keydown', (e) => {
      if (!this._active) return;
      // Don't fire shortcuts when typing in inputs/selects
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          this.handlers.run?.();
          break;
        case 'f':
          e.preventDefault();
          this.handlers.fullscreen?.();
          break;
        case 'e':
          e.preventDefault();
          this.handlers.export?.();
          break;
        case 'escape':
          this.handlers.escape?.();
          break;
        case '1': this.handlers.tabs?.[0]?.(); break;
        case '2': this.handlers.tabs?.[1]?.(); break;
        case '3': this.handlers.tabs?.[2]?.(); break;
        case '4': this.handlers.tabs?.[3]?.(); break;
        case '5': this.handlers.tabs?.[4]?.(); break;
        case '?':
          this._showHint(true);
          break;
      }
    });
  }

  _maybeShowHint() {
    const seen = localStorage.getItem('hplc_kb_hint_seen');
    if (!seen) {
      setTimeout(() => this._showHint(false), 2500);
    }
  }

  _showHint(force = false) {
    if (!force) localStorage.setItem('hplc_kb_hint_seen', '1');

    const existing = document.getElementById('kb-shortcut-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'kb-shortcut-toast';
    toast.innerHTML = `
      <div style="
        position: fixed; bottom: 80px; right: 16px; z-index: 9999;
        background: #0f172a; border: 1px solid rgba(56,189,248,0.3);
        border-radius: 12px; padding: 14px 18px; font-family: 'JetBrains Mono', monospace;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4); color: #f1f5f9;
        font-size: 0.78rem; min-width: 220px; animation: fadeInUp 250ms ease;
      ">
        <div style="font-size: 0.65rem; text-transform:uppercase; letter-spacing:0.08em; color:#38bdf8; margin-bottom:10px; font-weight:800;">
          ⌨ Keyboard Shortcuts
        </div>
        <table style="border-collapse:collapse; width:100%;">
          ${[
            ['R', 'Run / Stop'],
            ['F', 'Fullscreen chromatogram'],
            ['E', 'Export PNG'],
            ['1–5', 'Switch tab'],
            ['Esc', 'Exit fullscreen'],
            ['?', 'Show this help'],
          ].map(([key, desc]) => `
            <tr>
              <td style="padding:3px 10px 3px 0; white-space:nowrap;">
                <kbd style="background:#1e293b; border:1px solid #334155; border-radius:4px; padding:1px 5px; font-size:0.72rem; color:#38bdf8;">${key}</kbd>
              </td>
              <td style="color:#94a3b8; padding:3px 0;">${desc}</td>
            </tr>
          `).join('')}
        </table>
        <div style="margin-top:10px; color:#475569; font-size:0.65rem;">Click anywhere to dismiss</div>
      </div>
    `;

    document.body.appendChild(toast);
    toast.addEventListener('click', () => toast.remove());
    if (!force) setTimeout(() => toast.remove(), 5000);
  }

  disable() { this._active = false; }
  enable()  { this._active = true;  }
}
