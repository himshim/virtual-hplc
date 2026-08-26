/**
 * LabTabs.js — Standardized High-End 3-Tab Shell Component
 *
 * Provides a responsive, accessible 3-tab navigation bar with fluid
 * transitions and mobile touch-scrolling.
 */

export class LabTabs extends HTMLElement {
  connectedCallback() {
    const rawTabs = this.getAttribute('tabs');
    const tabs = rawTabs ? JSON.parse(rawTabs) : [
      { id: 'tab-1', label: '📈 Scan / Run' },
      { id: 'tab-2', label: '📊 Results & Quantitation' },
      { id: 'tab-3', label: '🎓 Learn Hub' }
    ];

    const activeTab = this.getAttribute('active-tab') || 'tab-1';

    this.innerHTML = `
      <div class="lab-tabs-container">
        <nav class="nav-tab-bar" role="tablist" aria-label="Instrument Navigation">
          ${tabs.map((tab, idx) => {
            const tabId = typeof tab === 'string' ? `tab-${idx + 1}` : tab.id;
            const tabLabel = typeof tab === 'string' ? tab : tab.label;
            const tabKey = tab.key || tabId.replace('tab-', '').replace('-view', '');
            const isActive = tabId === activeTab || (idx === 0 && !activeTab);
            return `
              <button type="button" 
                      class="nav-tab-item ${isActive ? 'active' : ''}" 
                      role="tab" 
                      id="tabBtn-${tabKey}" 
                      data-tab="${tabId}" 
                      aria-selected="${isActive ? 'true' : 'false'}"
                      aria-controls="panel-${tabId}">
                ${tabLabel}
              </button>
            `;
          }).join('')}
        </nav>
      </div>
    `;

    this._bindTabEvents();
  }

  _bindTabEvents() {
    const tabButtons = this.querySelectorAll('.nav-tab-item');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        
        // Update tab buttons
        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Update panels
        const panels = document.querySelectorAll('.tab-panel');
        panels.forEach(p => {
          if (p.id === `panel-${targetTabId}` || p.id === targetTabId || p.getAttribute('data-tab-content') === targetTabId) {
            p.classList.add('active');
            p.removeAttribute('hidden');
            p.style.display = 'block';
          } else {
            p.classList.remove('active');
            p.setAttribute('hidden', 'true');
            p.style.display = 'none';
          }
        });

        window.dispatchEvent(new CustomEvent('lab-tab-changed', { detail: { tabId: targetTabId } }));
      });
    });
  }
}

if (!customElements.get('lab-tabs')) {
  customElements.define('lab-tabs', LabTabs);
}
