/**
 * AnalyticalInstrumentPlugin.js — Core Platform Plugin SDK (v1.0.0)
 *
 * Provides standard lifecycle, capability features, extension points,
 * and component accessors for all Virtual Analytical Lab plugins.
 */

export const PLATFORM_SDK_VERSION = '1.0.0';

export const GENERIC_LIFECYCLE = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  INITIALIZE: 'INITIALIZE',
  WARMUP: 'WARMUP',
  READY: 'READY',
  ACQUIRE: 'ACQUIRE',
  PROCESS: 'PROCESS',
  COMPLETE: 'COMPLETE',
  RESET: 'RESET',
  DISPOSED: 'DISPOSED'
});

export class AnalyticalInstrumentPlugin {
  /**
   * @param {Object} manifest - Standard plugin manifest definition
   */
  constructor(manifest = {}) {
    this.manifest = manifest;
    this.sdkVersion = manifest.sdkVersion || PLATFORM_SDK_VERSION;

    this.id = manifest.id || 'generic_plugin';
    this.name = manifest.name || 'Generic Analytical Plugin';
    this.pluginVersion = manifest.pluginVersion || '1.0.0';
    this.category = manifest.category || 'General';
    
    this.features = manifest.features || {
      graph: { type: 'none', live: false, zoom: false, compare: false },
      education: { prediction: false, notebook: false, replay: false },
      reporting: { export: false }
    };

    this.requires = manifest.requires || { platform: '>=1.0.0' };
    this.contributes = manifest.contributes || { telemetry: true, hero: 'graph', bottomSheet: true };
    this.lifecycleState = GENERIC_LIFECYCLE.UNINITIALIZED;
  }

  /** Initialize plugin resources */
  initialize() {
    this.lifecycleState = GENERIC_LIFECYCLE.INITIALIZE;
  }

  /** Warmup hardware (e.g. lamps, temperature, pumps) */
  warmup() {
    this.lifecycleState = GENERIC_LIFECYCLE.WARMUP;
  }

  /** Set ready for acquisition */
  setReady() {
    this.lifecycleState = GENERIC_LIFECYCLE.READY;
  }

  /** Start acquisition / scan */
  acquire() {
    this.lifecycleState = GENERIC_LIFECYCLE.ACQUIRE;
  }

  /** Process measurement / peak integration */
  process() {
    this.lifecycleState = GENERIC_LIFECYCLE.PROCESS;
  }

  /** Complete acquisition */
  complete() {
    this.lifecycleState = GENERIC_LIFECYCLE.COMPLETE;
  }

  /** Reset for next run */
  reset() {
    this.lifecycleState = GENERIC_LIFECYCLE.RESET;
  }

  /** Dispose all plugin resources, event listeners, timers, and canvas instances */
  dispose() {
    this.lifecycleState = GENERIC_LIFECYCLE.DISPOSED;
  }

  /** Component Accessor Hooks (Override in instrument subclasses) */
  getPhysicsEngine() { return null; }
  getEducationalEngine() { return null; }
  getController() { return null; }
}
