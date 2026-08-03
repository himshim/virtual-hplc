/**
 * InstrumentPlugin.js — Core Platform Instrument SDK Interface
 *
 * Defines the standard lifecycle, capabilities, and presentation contract
 * for all Virtual Analytical Lab instrument plugins (HPLC, UV-Vis, GC, FTIR, etc.).
 */

export const INSTRUMENT_CAPABILITIES = Object.freeze({
  REALTIME_GRAPH: 'supportsRealtimeGraph',
  SPECTRUM_SCAN: 'supportsSpectrumScan',
  CALIBRATION_CURVE: 'supportsCalibration',
  NOTEBOOK: 'supportsNotebook',
  METHOD_REPLAY: 'supportsReplay',
  PREDICTION_IMPACT: 'supportsPrediction',
  TRACE_COMPARISON: 'supportsCompare'
});

export const GENERIC_LIFECYCLE = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  INITIALIZE: 'INITIALIZE',
  WARMUP: 'WARMUP',
  READY: 'READY',
  ACQUIRE: 'ACQUIRE',
  PROCESS: 'PROCESS',
  COMPLETE: 'COMPLETE',
  RESET: 'RESET'
});

export class InstrumentPlugin {
  /**
   * @param {Object} manifest - Plugin manifest definition (id, name, capabilities)
   */
  constructor(manifest = {}) {
    this.id = manifest.id || 'generic_instrument';
    this.name = manifest.name || 'Generic Instrument';
    this.version = manifest.version || '1.0.0';
    this.capabilities = new Set(manifest.capabilities || []);
    this.lifecycleState = GENERIC_LIFECYCLE.UNINITIALIZED;
  }

  /** Initialize instrument plugin resources */
  initialize() {
    this.lifecycleState = GENERIC_LIFECYCLE.INITIALIZE;
  }

  /** Start instrument operation / acquisition */
  start() {
    this.lifecycleState = GENERIC_LIFECYCLE.ACQUIRE;
  }

  /** Stop instrument operation */
  stop() {
    this.lifecycleState = GENERIC_LIFECYCLE.READY;
  }

  /** Dispose instrument resources, timers, and Chart.js instances to prevent memory leaks */
  dispose() {
    this.lifecycleState = GENERIC_LIFECYCLE.UNINITIALIZED;
  }

  /** Check if instrument supports a specific platform capability */
  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  /** Get educational engine instance */
  getEducationalEngine() {
    throw new Error(`[${this.id}] getEducationalEngine() must be implemented by plugin subclass.`);
  }

  /** Get physics/simulation engine instance */
  getPhysicsEngine() {
    throw new Error(`[${this.id}] getPhysicsEngine() must be implemented by plugin subclass.`);
  }

  /** Get headless controller instance */
  getController() {
    throw new Error(`[${this.id}] getController() must be implemented by plugin subclass.`);
  }
}
