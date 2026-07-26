/**
 * WorkspaceMemory.js — P8 Persistent Workspace State
 *
 * Saves and restores: active tab, mode, collapsed panels, slider values.
 * Uses localStorage with a versioned key so stale state doesn't break new builds.
 */

const STORAGE_KEY = 'hplc_workspace_v1';

export const WorkspaceMemory = {
  _defaults: {
    activeTab: 'tab-run',
    mode: 'beginner',
    accordionOpen: false,
    flowRate: 1.0,
    organicPercent: 40,
    temperature: 25,
    ph: 7.0,
    wavelength: 254,
    sensitivity: 1.0,
    sampleKey: null
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...this._defaults };
      return { ...this._defaults, ...JSON.parse(raw) };
    } catch {
      return { ...this._defaults };
    }
  },

  save(patch) {
    try {
      const current = this.load();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {
      // Storage unavailable — silently degrade
    }
  },

  clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
  }
};
