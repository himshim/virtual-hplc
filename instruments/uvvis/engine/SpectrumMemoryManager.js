/**
 * SpectrumMemoryManager.js — Decoupled UV-Vis Spectrum Memory & Overlay Manager
 *
 * Manages spectrum memory snapshots, reference lock comparison mode, 5-trace capacity,
 * WCAG-accessible line styling (colors + dash patterns), and analytical report exports.
 */

export const OVERLAY_PALETTE = [
  { color: '#34d399', dash: [],           width: 2, label: 'Emerald' },   // Trace 1: Emerald Green (Solid)
  { color: '#fbbf24', dash: [6, 4],       width: 2, label: 'Amber' },     // Trace 2: Amber Yellow (Dashed)
  { color: '#c084fc', dash: [3, 3],       width: 2, label: 'Purple' },    // Trace 3: Lavender Purple (Dotted)
  { color: '#f43f5e', dash: [10, 4, 2, 4],width: 2, label: 'Rose' },      // Trace 4: Rose Red (Dash-Dot)
  { color: '#a855f7', dash: [8, 2, 2, 2], width: 2, label: 'Violet' },    // Trace 5: Violet (Long Dash-Dot)
];

export class SpectrumMemoryManager {
  constructor(maxCapacity = 5) {
    this.maxCapacity = maxCapacity;
    this.snapshots = [];      // Array of SpectrumSnapshot objects
    this.referenceLock = null; // Reference lock snapshot if enabled
  }

  /**
   * Capture an immutable snapshot of a completed spectrum
   * @param {Object} state - Controller state (sample, conc, pH, method, optics, lab)
   * @param {Array} points - Spectrum points array [{x, y}]
   * @returns {Object} Created snapshot
   */
  pinSnapshot(state, points) {
    if (!points || points.length === 0) return null;

    const palette = OVERLAY_PALETTE[this.snapshots.length % OVERLAY_PALETTE.length];
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const sampleName = (state.sampleKey || 'sample').toUpperCase();
    const concVal = state.concUgMl ?? state.concentrationUgMl ?? 15.0;
    const conc = `${concVal.toFixed(1)} µg/mL`;
    const pHStr = state.pH !== undefined ? `pH ${state.pH.toFixed(1)}` : 'pH 7.0';
    
    const label = `${sampleName} ${conc} (${pHStr} · ${state.startLambda || 200}–${state.endLambda || 800}nm · ${timestamp})`;

    const snapshot = {
      schemaVersion: '1.0',
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      timeDisplay: timestamp,
      label,
      sampleName,
      metadata: {
        sampleKey:       state.sampleKey,
        concUgMl:        concVal,
        pH:              state.pH || 7.0,
        solventKey:      state.solventKey,
        cuvetteMaterial: state.cuvetteMaterial,
      },
      method: {
        startLambda:    state.startLambda || 200,
        endLambda:      state.endLambda || 800,
        scanStepNm:     state.scanStepNm || 1.0,
        scanSpeedNmMin: state.scanSpeedNmMin || 300,
      },
      optics: {
        slitWidth:        state.slitWidth || 1.0,
        strayLightPreset: state.strayLightPreset || 'routine',
      },
      labPractice: {
        smudgeLevel:    state.smudgeLevel || 'clean',
        turbidityLevel: state.turbidityLevel || 0.0,
      },
      points: JSON.parse(JSON.stringify(points)), // deep copy
      style: {
        borderColor:     palette.color,
        borderDash:      palette.dash,
        borderWidth:     palette.width,
        backgroundColor: 'transparent',
      }
    };

    // Enforce 5-spectrum FIFO capacity
    if (this.snapshots.length >= this.maxCapacity) {
      this.snapshots.shift(); // remove oldest
    }
    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Set or clear the Reference Lock spectrum
   * @param {Object|null} snapshot 
   */
  setReferenceLock(snapshot) {
    this.referenceLock = snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
  }

  /**
   * Remove a specific snapshot by ID
   * @param {string} id 
   */
  removeSnapshot(id) {
    this.snapshots = this.snapshots.filter(s => s.id !== id);
  }

  /**
   * Clear all stored memory snapshots
   */
  clear() {
    this.snapshots = [];
  }

  /**
   * Format snapshots for Chart.js dataset consumption
   * @returns {Array} Chart.js dataset objects
   */
  getChartDatasets() {
    const datasets = [];

    // 1. Reference Lock dataset (if active)
    if (this.referenceLock) {
      datasets.push({
        label: `🔒 Reference: ${this.referenceLock.label}`,
        data: this.referenceLock.points,
        borderColor: '#0284c7',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        isReference: true,
      });
    }

    // 2. Memory Overlays
    this.snapshots.forEach((snap) => {
      datasets.push({
        label: snap.label,
        data: snap.points,
        borderColor: snap.style.borderColor,
        borderDash: snap.style.borderDash,
        borderWidth: snap.style.borderWidth,
        pointRadius: 0,
        fill: false,
        isOverlay: true,
        snapshotId: snap.id,
      });
    });

    return datasets;
  }

  /**
   * Export-ready canonical data object for UI serializer (CSV, TXT, JSON)
   * @param {string} id 
   * @returns {Object|null} Clean snapshot data payload
   */
  getExportData(id) {
    const snap = this.snapshots.find(s => s.id === id) || (this.referenceLock && this.referenceLock.id === id ? this.referenceLock : null);
    if (!snap) return null;
    return JSON.parse(JSON.stringify(snap));
  }
}
