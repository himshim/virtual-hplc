/**
 * LabHeader.js - Standardized Brand Identity & Navigation Header
 *
 * Implements the brandkit VAL identity system with unified glyph badge,
 * dynamic instrument title, projection mode toggle, and 3-mode selector.
 */

export class LabHeader extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || 'Analytical Instrument';
    const currentMode = localStorage.getItem('val_expertise_mode') || 'beginner';

    this.innerHTML = `
      <header class="app-header double-bezel-header" role="banner">
        <div class="header-content">
          <div class="brand-section">
            <a href="../../index.html" class="nav-home-link brand-mark" aria-label="Virtual Analytical Lab Home">
              <div class="brand-glyph" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4L28 26H4L16 4Z" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round" fill="rgba(2, 132, 199, 0.25)"/>
                  <path d="M16 12L24 26" stroke="#34d399" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M16 12L28 22" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M10 26L14 18L18 26" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="16" cy="12" r="2" fill="#ffffff"/>
                </svg>
              </div>
              <div class="brand-info">
                <span class="brand-platform-name">Virtual Analytical Lab</span>
                <span class="brand-instrument-title">${title}</span>
              </div>
            </a>
          </div>
          
          <div class="header-actions">
            <a href="https://himshim.github.io/" target="_blank" rel="noopener" class="header-maintainer-badge" title="Maintained by @himshim26 (himshim.github.io)">
              maintained by <span class="maintainer-handle">@himshim26</span>
            </a>

            <button type="button" class="header-tool-btn" id="headerProjBtn" title="Toggle 20-foot Classroom Projection Mode" aria-label="Toggle Projection Mode">
              📺 Projection
            </button>

            <div class="mode-selector" role="radiogroup" aria-label="Expertise Mode">
              <button type="button" class="mode-btn ${currentMode === 'beginner' ? 'active' : ''}" data-mode="beginner" title="Beginner: Guided workflow with step-by-step assistance">
                <span class="mode-indicator mode-beginner"></span>
                <span class="mode-label">Beginner</span>
              </button>
              <button type="button" class="mode-btn ${currentMode === 'standard' ? 'active' : ''}" data-mode="standard" title="Standard: Full instrument controls & quantitative tools">
                <span class="mode-indicator mode-standard"></span>
                <span class="mode-label">Standard</span>
              </button>
              <button type="button" class="mode-btn ${currentMode === 'advanced' ? 'active' : ''}" data-mode="advanced" title="Advanced: Unconstrained parameters, noise, & diagnostics">
                <span class="mode-indicator mode-advanced"></span>
                <span class="mode-label">Advanced</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    `;

    this._bindModeEvents();
    this._bindProjectionEvents();
  }

  _bindModeEvents() {
    const buttons = this.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        localStorage.setItem('val_expertise_mode', mode);
        document.body.setAttribute('data-expertise-mode', mode);
        window.dispatchEvent(new CustomEvent('expertise-mode-changed', { detail: { mode } }));
      });
    });

    const savedMode = localStorage.getItem('val_expertise_mode') || 'beginner';
    document.body.setAttribute('data-expertise-mode', savedMode);
  }

  _bindProjectionEvents() {
    const projBtn = this.querySelector('#headerProjBtn');
    if (projBtn) {
      projBtn.addEventListener('click', () => {
        const isProj = document.body.classList.toggle('projection-mode');
        projBtn.textContent = isProj ? '☀️ Normal View' : '📺 Projection';
        projBtn.classList.toggle('active', isProj);
      });
    }
  }
}

if (!customElements.get('lab-header')) {
  customElements.define('lab-header', LabHeader);
}

