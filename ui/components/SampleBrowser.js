import { globalEntityRegistry } from '../../chemistry/registry/EntityRegistry.js';

/**
 * SampleBrowser.js - Registry-Driven Sample & Compound Browser Component (P3)
 * Dynamic card generation, instant search, category filters, favorites & recents.
 */
export class SampleBrowserComponent {
  constructor(selectElementId, cardGridContainerId = "sampleGridContainer") {
    this.selectEl = document.getElementById(selectElementId);
    this.gridContainer = document.getElementById(cardGridContainerId);

    this.activeFilter = "all";
    this.searchQuery = "";
    this.selectedSampleId = null;

    // Load Favorites & Recents from localStorage
    this.favorites = new Set(JSON.parse(localStorage.getItem("hplc_fav_samples") || "[]"));
    this.recents = new Set(JSON.parse(localStorage.getItem("hplc_recent_samples") || "[]"));

    this.init();
  }

  init() {
    this.populateSelect();
    if (this.gridContainer) {
      this.renderCardBrowser();
    }
  }

  // Backward-compatible select dropdown population
  populateSelect() {
    if (!this.selectEl) return;

    const compounds = globalEntityRegistry.getAllCompounds();
    const mixtures = globalEntityRegistry.getAllMixtures();

    this.selectEl.innerHTML = "";

    const mixGroup = document.createElement("optgroup");
    mixGroup.label = "── Sample Mixtures ──";
    mixtures.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.components.length} components)`;
      mixGroup.appendChild(opt);
    });
    this.selectEl.appendChild(mixGroup);

    const compGroup = document.createElement("optgroup");
    compGroup.label = "── Single Compounds ──";
    compounds.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.formula || 'C8H10N4O2'}, MW ${c.mw || 194})`;
      compGroup.appendChild(opt);
    });
    this.selectEl.appendChild(compGroup);

    if (mixtures.length > 0 && !this.selectedSampleId) {
      this.selectedSampleId = mixtures[0].id;
      this.selectEl.value = this.selectedSampleId;
    }
  }

  // P3 Metadata Card Browser & Filter Bar
  renderCardBrowser() {
    if (!this.gridContainer) return;

    const compounds = globalEntityRegistry.getAllCompounds();
    const mixtures = globalEntityRegistry.getAllMixtures();

    // Prepare unified sample item list with UI metadata defaults
    const allSamples = [
      ...mixtures.map(m => ({
        id: m.id,
        type: "mixture",
        name: m.name,
        formula: `${m.components.length} Components`,
        mw: null,
        category: m.ui?.category || "Mixtures",
        difficulty: m.ui?.difficulty || "🟢 Beginner",
        estimatedRunTime: m.ui?.estimatedRunTime || "⏱️ 4.0 min",
        icon: m.ui?.icon || "🧪",
        tags: m.ui?.tags || ["QC Assay", "Mixture"],
        description: m.description || "Multi-component pharmaceutical mixture for separation testing."
      })),
      ...compounds.map(c => ({
        id: c.id,
        type: "compound",
        name: c.name,
        formula: c.formula || "C8H10N4O2",
        mw: c.mw ? `MW ${c.mw}` : null,
        category: c.ui?.category || "APIs",
        difficulty: c.ui?.difficulty || "🟢 Beginner",
        estimatedRunTime: c.ui?.estimatedRunTime || "⏱️ 2.5 min",
        icon: c.ui?.icon || "💊",
        tags: c.ui?.tags || ["API", "Single Compound"],
        description: c.description || "Single pharmaceutical compound."
      }))
    ];

    if (!this.selectedSampleId && allSamples.length > 0) {
      this.selectedSampleId = allSamples[0].id;
    }

    let html = `
      <div style="margin-bottom: 12px;">
        <!-- Search Input -->
        <input type="text" id="sampleSearchInput" placeholder="🔍 Search sample name, formula, or tag..." 
               value="${this.searchQuery}"
               style="width:100%; padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); font-size:0.9rem;">

        <!-- Filter Bar -->
        <div class="sample-filter-bar" id="sampleFilterBar">
          <button class="filter-pill ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${allSamples.length})</button>
          <button class="filter-pill ${this.activeFilter === 'recent' ? 'active' : ''}" data-filter="recent">Recent (${this.recents.size})</button>
          <button class="filter-pill ${this.activeFilter === 'favorites' ? 'active' : ''}" data-filter="favorites">Favorites (${this.favorites.size})</button>
          <button class="filter-pill ${this.activeFilter === 'apis' ? 'active' : ''}" data-filter="apis">APIs</button>
          <button class="filter-pill ${this.activeFilter === 'mixtures' ? 'active' : ''}" data-filter="mixtures">Mixtures</button>
        </div>
      </div>

      <!-- Sample Cards Grid -->
      <div class="sample-grid">
    `;

    // Filter & Search Logic
    const filteredSamples = allSamples.filter(s => {
      // Filter tab query
      if (this.activeFilter === 'recent' && !this.recents.has(s.id)) return false;
      if (this.activeFilter === 'favorites' && !this.favorites.has(s.id)) return false;
      if (this.activeFilter === 'apis' && s.type !== 'compound') return false;
      if (this.activeFilter === 'mixtures' && s.type !== 'mixture') return false;

      // Text search query
      if (this.searchQuery.trim() !== '') {
        const q = this.searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchFormula = s.formula.toLowerCase().includes(q);
        const matchTags = s.tags.some(t => t.toLowerCase().includes(q));
        return matchName || matchFormula || matchTags;
      }
      return true;
    });

    if (filteredSamples.length === 0) {
      html += `
        <div style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-muted); background:var(--bg-app); border-radius:var(--radius-md);">
          <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
          <div style="font-weight:600;">No samples found</div>
          <div style="font-size:0.85rem; margin-top:4px;">Try adjusting your search query or filter pills.</div>
        </div>
      `;
    } else {
      filteredSamples.forEach(s => {
        const isSelected = s.id === this.selectedSampleId;
        const isFav = this.favorites.has(s.id);
        const favIcon = isFav ? "❤️" : "🤍";

        html += `
          <div class="sample-card ${isSelected ? 'selected' : ''}" data-id="${s.id}">
            <div>
              <div class="sample-card-header">
                <div>
                  <h4 class="sample-title">${s.icon} ${s.name}</h4>
                  <div class="sample-formula">${s.formula} ${s.mw ? '• ' + s.mw : ''}</div>
                </div>
                <button class="sample-fav-btn" data-fav-id="${s.id}">${favIcon}</button>
              </div>
              <p style="font-size:0.8rem; color:var(--text-secondary); margin:6px 0 10px 0; line-height:1.4;">
                ${s.description}
              </p>
            </div>

            <div class="sample-tags">
              <span class="tag-badge ${s.type === 'mixture' ? 'mixture' : 'api'}">${s.category}</span>
              <span class="tag-badge difficulty">${s.difficulty}</span>
              <span class="tag-badge runtime">${s.estimatedRunTime}</span>
            </div>
          </div>
        `;
      });
    }

    html += `</div>`;
    this.gridContainer.innerHTML = html;

    this.bindEvents();
  }

  bindEvents() {
    // Search Input Event
    const searchInput = document.getElementById("sampleSearchInput");
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value;
        this.renderCardBrowser();
      };
    }

    // Filter Pills Event
    const filterPills = document.querySelectorAll(".filter-pill");
    filterPills.forEach(pill => {
      pill.onclick = () => {
        this.activeFilter = pill.getAttribute("data-filter");
        this.renderCardBrowser();
      };
    });

    // Sample Card Selection Event
    const cards = document.querySelectorAll(".sample-card");
    cards.forEach(card => {
      card.onclick = (e) => {
        if (e.target.classList.contains("sample-fav-btn")) return; // Don't trigger card select on fav click

        const id = card.getAttribute("data-id");
        this.selectedSampleId = id;

        // Record in recents
        this.recents.add(id);
        localStorage.setItem("hplc_recent_samples", JSON.stringify([...this.recents]));

        // Sync select dropdown if present
        if (this.selectEl) {
          this.selectEl.value = id;
          this.selectEl.dispatchEvent(new Event("change"));
        }

        this.renderCardBrowser();
      };
    });

    // Favorite Toggle Event
    const favBtns = document.querySelectorAll(".sample-fav-btn");
    favBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-fav-id");
        if (this.favorites.has(id)) {
          this.favorites.delete(id);
        } else {
          this.favorites.add(id);
        }
        localStorage.setItem("hplc_fav_samples", JSON.stringify([...this.favorites]));
        this.renderCardBrowser();
      };
    });
  }
}
