/**
 * HplcEvents.js — Centralized Type-Safe Event Registry
 *
 * Single source of truth for all HplcController event names.
 * Prevents silent typos in event subscriptions and emissions.
 */
export const HPLC_EVENTS = Object.freeze({
  INSTRUMENT_INITIALIZED: 'instrumentInitialized',
  STATUS_CHANGED:         'statusChanged',
  PRESSURE_CHANGED:       'pressureChanged',
  WAVELENGTH_CHANGED:     'wavelengthChanged',
  PH_CHANGED:             'phChanged',
  BUFFER_CHANGED:         'bufferChanged',
  CRITERIA_CHANGED:       'criteriaChanged',
  EXERCISE_CHANGED:       'exerciseChanged',
  PUMP_STARTED:           'pumpStarted',
  INJECTING_STARTED:      'injectingStarted',
  RUN_STARTED:            'runStarted',
  TICK:                   'tick',
  WARNING_RAISED:         'warningRaised',
  BASELINE_STABILIZED:    'baselineStabilized',
  PEAK_DETECTED_LIVE:     'peakDetectedLive',
  RUN_COMPLETED:          'runCompleted'
});
