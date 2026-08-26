/**
 * LabBottomSheet.js — High-End Contextual Bottom Sheet & Modal Component
 *
 * Provides spring-loaded bottom sheet animations for 'Why?' explanations,
 * diagnostic guidance, and peak integration inspector.
 */

export class LabBottomSheet extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="bottom-sheet-backdrop" id="labSheetBackdrop"></div>
      <div class="bottom-sheet double-bezel-sheet" id="labSheet" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="bottom-sheet-drag-handle">
          <div class="drag-bar"></div>
        </div>
        <div class="bottom-sheet-header">
          <div class="bottom-sheet-title-wrap">
            <span class="bottom-sheet-icon" id="labSheetIcon">ℹ️</span>
            <h3 class="bottom-sheet-title" id="labSheetTitle">Information</h3>
          </div>
          <button type="button" class="bottom-sheet-close-btn" id="labSheetCloseBtn" aria-label="Close modal">✕</button>
        </div>
        <div class="bottom-sheet-body" id="labSheetBody">
          <!-- Dynamic Content -->
        </div>
      </div>
    `;

    this._backdrop = this.querySelector('#labSheetBackdrop');
    this._sheet = this.querySelector('#labSheet');
    this._title = this.querySelector('#labSheetTitle');
    this._icon = this.querySelector('#labSheetIcon');
    this._body = this.querySelector('#labSheetBody');
    this._closeBtn = this.querySelector('#labSheetCloseBtn');

    this._closeBtn.addEventListener('click', () => this.close());
    this._backdrop.addEventListener('click', () => this.close());

    // Expose instance on window
    window.labBottomSheet = this;
  }

  /**
   * Opens the bottom sheet with title, icon, and HTML/DOM content.
   */
  open(title, icon, content) {
    if (this._title) this._title.textContent = title || 'Details';
    if (this._icon) this._icon.textContent = icon || 'ℹ️';

    if (this._body) {
      if (typeof content === 'string') {
        this._body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this._body.innerHTML = '';
        this._body.appendChild(content);
      }
    }

    if (this._backdrop) this._backdrop.classList.add('active');
    if (this._sheet) {
      this._sheet.classList.add('active');
      this._sheet.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Closes the bottom sheet.
   */
  close() {
    if (this._backdrop) this._backdrop.classList.remove('active');
    if (this._sheet) {
      this._sheet.classList.remove('active');
      this._sheet.setAttribute('aria-hidden', 'true');
    }
  }
}

if (!customElements.get('lab-bottom-sheet')) {
  customElements.define('lab-bottom-sheet', LabBottomSheet);
}
