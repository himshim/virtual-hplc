/**
 * UvVisEvents.js — UV-Vis Instrument Event Constants
 * Single source of truth — no raw event strings anywhere else.
 */

export const UVVIS_EVENTS = Object.freeze({
  WARMUP_COMPLETE:   'uvvis:warmup_complete',
  BLANK_COMPLETE:    'uvvis:blank_complete',
  SCAN_COMPLETE:     'uvvis:scan_complete',
  PEAK_DETECTED:     'uvvis:peak_detected',
  REGION_CHANGED:    'uvvis:region_changed',   // UV <-> Visible boundary (400 nm)
});
