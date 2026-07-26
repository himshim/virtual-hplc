import { globalEntityRegistry } from '../../chemistry/registry/EntityRegistry.js';

/**
 * SampleBrowser.js - Registry-Driven Sample & Compound Browser Component
 * Zero-code compound addition: Auto-populates categories from globalEntityRegistry.
 */
export class SampleBrowserComponent {
  constructor(selectElementId) {
    this.selectEl = document.getElementById(selectElementId);
    this.populate();
  }

  populate() {
    if (!this.selectEl) return;

    const compounds = globalEntityRegistry.getAllCompounds();
    const mixtures = globalEntityRegistry.getAllMixtures();

    this.selectEl.innerHTML = "";

    // Add Mixtures Group
    const mixGroup = document.createElement("optgroup");
    mixGroup.label = "── Sample Mixtures ──";
    mixtures.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.components.length} components)`;
      mixGroup.appendChild(opt);
    });
    this.selectEl.appendChild(mixGroup);

    // Add Single Compounds Group
    const compGroup = document.createElement("optgroup");
    compGroup.label = "── Single Compounds ──";
    compounds.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.formula || 'C8H10N4O2'}, MW ${c.mw || 194})`;
      compGroup.appendChild(opt);
    });
    this.selectEl.appendChild(compGroup);

    // Select first mixture by default
    if (mixtures.length > 0) this.selectEl.value = mixtures[0].id;
  }
}
