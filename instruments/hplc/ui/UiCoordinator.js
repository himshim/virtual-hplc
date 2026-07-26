import { HPLC_EVENTS } from '../controller/HplcEvents.js';

/**
 * UiCoordinator.js — Central UI Presentation Coordinator
 *
 * Single Source of Truth for UI event subscriptions & component lifecycle coordination.
 * Directs events to the NEW Sprint U1 CDS Telemetry Strip & Sprint U4 Guided Step Unlock Banner.
 */
export class UiCoordinator {
  /**
   * @param {HplcController} controller
   * @param {Object} views - Bag of initialized UI view instances
   */
  constructor(controller, views = {}) {
    this.controller = controller;
    this.views = views;
    this.bindEvents();
  }

  /** Centralized Event Subscriptions */
  bindEvents() {
    const bus = this.controller.eventBus;

    bus.on(HPLC_EVENTS.PUMP_STARTED, () => {
      if (this.views.graphView)   this.views.graphView.reset();
      if (this.views.runTimeline) this.views.runTimeline.setPhase('prime');
      this._setAcqPhaseLabel('⚡ PRIMING: Ramping pressure...');
      this._updateStepHighlight('PRIMING');
    });

    bus.on(HPLC_EVENTS.STATUS_CHANGED, ({ newState }) => {
      if (this.views.displayView)  this.views.displayView.setStatus(newState);
      if (this.views.controlsView) this.views.controlsView.updateControlsForState(newState);
      if (this.views.statusBar)    this.views.statusBar.update({ status: newState });
      if (this.views.runTimeline)  this._updateTimelinePhase(newState);
      this._updateCdsStateVal(newState);
      this._updateStepHighlight(newState);
    });

    bus.on(HPLC_EVENTS.PRESSURE_CHANGED, ({ pressure }) => {
      if (this.views.displayView)  this.views.displayView.setPressure(pressure);
      if (this.views.statusBar)    this.views.statusBar.update({ pressureBar: pressure });
      this._updateCdsPressureVal(pressure);
    });

    bus.on(HPLC_EVENTS.WAVELENGTH_CHANGED, ({ wavelengthNm }) => {
      if (this.views.spectrumView) {
        this.views.spectrumView.renderSpectrum(this.controller.simState.sampleKey, wavelengthNm);
      }
      this._updateCdsUvVal(wavelengthNm);
    });

    bus.on(HPLC_EVENTS.INJECTING_STARTED, () => {
      if (this.views.runTimeline) this.views.runTimeline.setPhase('inject');
      this._setAcqPhaseLabel('💉 INJECTING SAMPLE (Valve turning...)');
      this._updateStepHighlight('INJECTING');
    });

    bus.on(HPLC_EVENTS.RUN_STARTED, ({ expectedAnalytes }) => {
      if (this.views.graphView)               this.views.graphView.reset();
      if (this.views.displayView)             this.views.displayView.renderPeakTable(null);
      if (this.views.runTimeline)             this.views.runTimeline.setPhase('separation');
      if (this.views.paramImpact)             this.views.paramImpact.reset();
      if (this.views.interactiveChromatogram) this.views.interactiveChromatogram.reset();
      if (this.views.narrator)                this.views.narrator.clear();
      if (this.views.methodReplay)            this.views.methodReplay.reset();

      this._updateStepHighlight('RUNNING');

      if (expectedAnalytes && expectedAnalytes.length && this.views.interactiveChromatogram) {
        this.views.interactiveChromatogram.setExpectedMarkers(expectedAnalytes);
      }

      const ghost = document.getElementById('ghostOverlay');
      if (ghost) ghost.classList.add('hidden');
    });

    bus.on(HPLC_EVENTS.PEAK_DETECTED_LIVE, ({ compound }) => {
      if (this.views.interactiveChromatogram) {
        this.views.interactiveChromatogram.markLiveDetected(compound);
      }
    });

    bus.on(HPLC_EVENTS.TICK, ({ time, signal, pressure, phase }) => {
      if (this.views.displayView) this.views.displayView.setTimeDisplay(time);

      const state = this.controller.getState();
      if (state === 'PRIMING' || state === 'EQUILIBRATING' || state === 'READY' || state === 'RUNNING') {
        if (this.views.graphView) this.views.graphView.addPoint(time, signal);

        if (state === 'RUNNING' && this.views.runTimeline) {
          if (time < 0.3)      this.views.runTimeline.setPhase('prime');
          else if (time < 0.8) this.views.runTimeline.setPhase('equilibrate');
          else if (time < 1.5) this.views.runTimeline.setPhase('inject');
          else                 this.views.runTimeline.setPhase('separation');
        }
      }
    });

    bus.on(HPLC_EVENTS.WARNING_RAISED, ({ warnings }) => {
      if (this.views.displayView) this.views.displayView.setWarnings(warnings);
    });

    bus.on(HPLC_EVENTS.RUN_COMPLETED, ({ runResult, exerciseProfile, methodComparison, methodHistory }) => {
      if (this.views.displayView)  this.views.displayView.renderPeakTable(runResult);
      if (this.views.reportCard)   this.views.reportCard.render(runResult, exerciseProfile);
      if (this.views.compareView)  this.views.compareView.render(methodComparison);
      if (this.views.historyView)  this.views.historyView.render(methodHistory);
      if (this.views.runTimeline)   this.views.runTimeline.setPhase('complete');
      this._updateStepHighlight('COMPLETED');

      if (this.views.statusBar) {
        this.views.statusBar.update({
          status: 'COMPLETED',
          flowRate: this.controller.simState.flowRate || 1.0,
          wavelengthNm: this.controller.simState.wavelengthNm || 254,
          temperatureC: this.controller.simState.temperature || 25
        });
      }

      if (runResult?.peaks && this.views.interactiveChromatogram) {
        this.views.interactiveChromatogram.setPeaks(runResult.peaks);
        const snapshot = [...(this.views.graphView?.chart?.data?.datasets?.[0]?.data || [])];
        if (snapshot.length) this.views.interactiveChromatogram.setReferenceRun(snapshot);
      }

      if (this.views.narrator) this.views.narrator.onRunCompleted(runResult);

      const replayPoints = [...(this.views.graphView?.chart?.data?.datasets?.[0]?.data || [])];
      if (replayPoints.length && runResult?.peaks && this.views.methodReplay) {
        this.views.methodReplay.loadRun(replayPoints, runResult.peaks);
      }

      const resultsBtn = document.getElementById('tabBtn-results');
      const badgeDot   = document.getElementById('resultsBadge');
      if (resultsBtn) resultsBtn.disabled = false;
      if (badgeDot)   badgeDot.style.display = 'inline-block';
    });
  }

  /* ── DOM Update Helpers for NEW Modern CDS UI ───────────────────────────── */

  _setAcqPhaseLabel(text) {
    const acqLabel = document.getElementById('acqPhaseLabel');
    if (acqLabel) acqLabel.textContent = text;
  }

  _updateCdsStateVal(state) {
    const cdsState = document.getElementById('cdsStateVal');
    if (cdsState) cdsState.textContent = `● ${state}`;
  }

  _updateCdsPressureVal(pressure) {
    const cdsP = document.getElementById('cdsPressureVal');
    if (cdsP) cdsP.textContent = `${pressure.toFixed(1)} bar`;
  }

  _updateCdsUvVal(wavelengthNm) {
    const cdsUv = document.getElementById('cdsUvVal');
    if (cdsUv) cdsUv.textContent = `${wavelengthNm} nm`;
  }

  _updateTimelinePhase(state) {
    if (!this.views.runTimeline) return;
    const phaseMap = {
      PRIMING:      'prime',
      EQUILIBRATING:'equilibrate',
      READY:        'ready',
      INJECTING:    'inject',
      RUNNING:      'separation',
      COMPLETED:    'complete'
    };
    if (phaseMap[state]) this.views.runTimeline.setPhase(phaseMap[state]);
  }

  _updateStepHighlight(state) {
    const stepMap = {
      PRIMING: 1, EQUILIBRATING: 2, READY: 3, INJECTING: 3, RUNNING: 4, COMPLETED: 5
    };
    const activeNum = stepMap[state] || 1;
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`gstep-${i}`);
      if (!el) continue;
      el.classList.remove('active', 'complete');
      if (i < activeNum)        el.classList.add('complete');
      else if (i === activeNum) el.classList.add('active');
    }
  }
}
