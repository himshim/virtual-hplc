/**
 * GcEvents.js — GC-FID Instrument Event Constants
 *
 * Defines event names as a single frozen object so no raw strings
 * are scattered across controller, UI, and tests.
 */

export const GC_EVENTS = Object.freeze({
  RUN_COMPLETE:    'gc:run_complete',
  PEAK_DETECTED:   'gc:peak_detected',
  WARMUP_COMPLETE: 'gc:warmup_complete',
});
