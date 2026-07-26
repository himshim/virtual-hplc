/**
 * Modal.js - Educational Info & Onboarding Dialog Component
 */
export class ModalComponent {
  constructor() {
    this.overlay = null;
    this.createModalDOM();
  }

  createModalDOM() {
    if (document.getElementById("uiModalOverlay")) return;

    this.overlay = document.createElement("div");
    this.overlay.id = "uiModalOverlay";
    this.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); display: none; justify-content: center;
      align-items: center; z-index: 10000; backdrop-filter: blur(3px);
    `;

    this.overlay.innerHTML = `
      <div style="background: #fff; border-radius: 12px; max-width: 480px; width: 90%; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: system-ui, sans-serif;">
        <h3 id="uiModalTitle" style="margin-top:0; color:#1565c0; font-size: 1.25rem;">Modal Title</h3>
        <div id="uiModalBody" style="font-size:0.95rem; color:#333; line-height:1.5; margin: 16px 0;">Body content</div>
        <button id="uiModalCloseBtn" style="width:100%; padding:10px; background:#1565c0; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Got it!</button>
      </div>
    `;

    document.body.appendChild(this.overlay);

    const closeBtn = document.getElementById("uiModalCloseBtn");
    if (closeBtn) closeBtn.onclick = () => this.hide();
  }

  show(title, htmlBody) {
    const titleEl = document.getElementById("uiModalTitle");
    const bodyEl = document.getElementById("uiModalBody");
    const overlay = document.getElementById("uiModalOverlay");

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = htmlBody;
    if (overlay) overlay.style.display = "flex";
  }

  hide() {
    const overlay = document.getElementById("uiModalOverlay");
    if (overlay) overlay.style.display = "none";
  }
}

export const globalModal = new ModalComponent();
