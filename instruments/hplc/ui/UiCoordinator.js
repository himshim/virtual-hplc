import { HPLC_EVENTS } from '../controller/HplcEvents.js';
import { EducationalEngine } from '../education/EducationalEngine.js';
import { formatPressureDecimal, formatTimeDecimal, formatWavelength, formatFlowRate } from '../utils/formatting.js';


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
    this.controller  = controller;
    this.views       = views;
    this._isBlankRun = false;
    this._maxRunTime = 0;
    this.bindEvents();
    this.bindWhyModal();
    this.bindBottomSheet();
    // Expose globally so CDS toolbar Compare button can call toggleCompareOverlay
    window._uiCoordinator = this;
  }

  /** Centralized Event Subscriptions */
  bindEvents() {
    const bus = this.controller.eventBus;

    // Initial state sync on load
    const initState = this.controller.getState();
    if (initState) {
      this._updateTimelinePhase(initState);
      this.renderTelemetry({ state: initState });
    }

    bus.on(HPLC_EVENTS.PUMP_STARTED, () => {
      if (this.views.graphView)   this.views.graphView.reset();
      if (this.views.runTimeline) this.views.runTimeline.setPhase('prime');
      this._setAcqPhaseLabel('⚡ PRIMING: Ramping pressure...');
      const diag = document.getElementById('diagText');
      if (diag) diag.innerHTML = '<strong>Stage 1 (Priming &amp; Equilibrating)</strong>: High-pressure dual-piston pump is drawing mobile phase through the reversed-phase C18 column to establish stable baseline pressure.';
      const phaseBadge = document.getElementById('hplcPhaseBadge');
      if (phaseBadge) phaseBadge.textContent = 'STATUS: PRIMING';
    });

    bus.on(HPLC_EVENTS.STATUS_CHANGED, ({ newState }) => {
      if (this.views.displayView)  this.views.displayView.setStatus(newState);
      if (this.views.controlsView) this.views.controlsView.updateControlsForState(newState);
      if (this.views.runTimeline)  this._updateTimelinePhase(newState);
      this.renderTelemetry({ state: newState });
      this._updateFabDockForState(newState);
      const phaseBadge = document.getElementById('hplcPhaseBadge');
      if (phaseBadge) phaseBadge.textContent = `STATUS: ${newState}`;
    });

    bus.on(HPLC_EVENTS.PRESSURE_CHANGED, ({ pressure }) => {
      if (this.views.displayView) this.views.displayView.setPressure(pressure);
      this.renderTelemetry({ pressure });
    });

    bus.on(HPLC_EVENTS.WAVELENGTH_CHANGED, ({ wavelengthNm }) => {
      if (this.views.spectrumView) {
        this.views.spectrumView.renderSpectrum(this.controller.simState.sampleKey, wavelengthNm);
      }
      this.renderTelemetry({ wavelength: wavelengthNm });
    });

    bus.on(HPLC_EVENTS.INJECTING_STARTED, () => {
      if (this.views.runTimeline) this.views.runTimeline.setPhase('inject');
      this._setAcqPhaseLabel('💉 INJECTING SAMPLE (Valve turning...)');
      const diag = document.getElementById('diagText');
      if (diag) diag.innerHTML = '<strong>Stage 2 (Sample Injection)</strong>: Rheodyne 6-port rotary injection valve switched. Sample plug is swept into the high-pressure mobile phase stream.';
      const phaseBadge = document.getElementById('hplcPhaseBadge');
      if (phaseBadge) phaseBadge.textContent = 'STATUS: INJECTING';
    });

    bus.on(HPLC_EVENTS.RUN_STARTED, ({ expectedAnalytes, isBlank, sampleName, estimatedMaxTime }) => {
      if (this.views.graphView)               this.views.graphView.reset();
      if (this.views.displayView)             this.views.displayView.renderPeakTable(null);
      if (this.views.runTimeline)             this.views.runTimeline.setPhase('separation');
      if (this.views.paramImpact)             this.views.paramImpact.reset();
      if (this.views.interactiveChromatogram) this.views.interactiveChromatogram.reset();
      if (this.views.narrator)                this.views.narrator.clear();
      if (this.views.methodReplay)            this.views.methodReplay.reset();

      this.pipDataPoints  = [];
      this._isBlankRun    = !!isBlank;
      this._maxRunTime    = estimatedMaxTime || 0;

      const diag = document.getElementById('diagText');
      if (diag) diag.innerHTML = '<strong>Stage 3 (Chromatographic Separation)</strong>: Analyte molecules partition between moving solvent (%B) and C18 stationary phase beads. Polar molecules elute faster; non-polar molecules stick longer.';
      const phaseBadge = document.getElementById('hplcPhaseBadge');
      if (phaseBadge) phaseBadge.textContent = 'STATUS: SEPARATING';

      // Update CDS metadata strip
      this._updateMetaStrip({ sampleName: sampleName || '—', estimatedMaxTime });

      // Blank injection badge
      const badge = document.getElementById('blankInjectionBadge');
      if (badge) badge.style.display = isBlank ? 'inline-block' : 'none';

      // Clear previous integration status
      const cdsStatus = document.getElementById('cdsIntegrationStatus');
      if (cdsStatus) { cdsStatus.textContent = ''; cdsStatus.style.display = 'none'; }

      // Re-show PiP sparkline card in case user had closed it
      const pipCard = document.getElementById('liveChromatogramPip');
      if (pipCard) pipCard.style.display = '';


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
      const diag = document.getElementById('diagText');
      if (diag && compound) {
        diag.innerHTML = `🎉 <strong>Peak Eluted!</strong> Detected <strong>${compound.name || 'Analyte'}</strong> at $t_R = ${compound.retentionTime?.toFixed(2) || '—'}\\text{ min}$ (Signal: ${(compound.height || 0).toFixed(1)} mAU).`;
      }
    });

    bus.on(HPLC_EVENTS.RUNTIME_CHANGED, ({ runTimeMinutes }) => {
      this._maxRunTime = runTimeMinutes;
      if (this.views.graphView?.chart?.options?.scales?.x) {
        this.views.graphView.chart.options.scales.x.max = runTimeMinutes;
        this.views.graphView.chart.options.scales.x.suggestedMax = runTimeMinutes;
        this.views.graphView.chart.update('none');
      }
    });

    bus.on(HPLC_EVENTS.TICK, ({ time, signal, pressure, phase }) => {
      if (this.views.displayView) this.views.displayView.setTimeDisplay(time);
      this.renderTelemetry({ time });

      const state = this.controller.getState();
      if (state === 'PRIMING' || state === 'EQUILIBRATING' || state === 'READY' || state === 'RUNNING') {
        if (this.views.graphView) this.views.graphView.addPoint(time, signal);

        if (state === 'RUNNING') {
          if (this.views.interactiveChromatogram) {
            this.views.interactiveChromatogram.setCurrentAcquisitionTime(time);
          }
          // Auto-collapse pre-run prediction card during acquisition
          const predCard = document.getElementById('preRunPredictionCard');
          if (predCard && predCard.style.display !== 'none') predCard.style.display = 'none';

          this._updatePipSparkline(time, signal);

          // Update timeline acquire progress bar
          if (this.views.runTimeline && this._maxRunTime > 0) {
            this.views.runTimeline.setAcquireProgress(time / this._maxRunTime);
          }

          // Update run time in metadata strip
          const metaRunTime = document.getElementById('metaRunTime');
          if (metaRunTime) metaRunTime.textContent = time.toFixed(2) + ' min';
        }
      }
    });

    bus.on(HPLC_EVENTS.WARNING_RAISED, ({ warnings }) => {
      if (this.views.displayView) this.views.displayView.setWarnings(warnings);
    });

    bus.on(HPLC_EVENTS.RUN_COMPLETED, ({ runResult, exerciseProfile, methodComparison, methodHistory }) => {
      if (this.views.runTimeline) this.views.runTimeline.setPhase('report');
      const diag = document.getElementById('diagText');
      if (diag) {
        const peakCount = runResult?.peaks?.length || 0;
        diag.innerHTML = `✅ <strong>Separation Complete!</strong> Successfully resolved <strong>${peakCount} analyte peak${peakCount === 1 ? '' : 's'}</strong>. Switch to <strong>Tab 2 (Results &amp; System Suitability)</strong> to inspect retention times, theoretical plates ($N$), and USP resolution ($R_s$).`;
      }
      const phaseBadge = document.getElementById('hplcPhaseBadge');
      if (phaseBadge) phaseBadge.textContent = 'STATUS: COMPLETE';


      // Capture run trace for comparison overlay
      const snapshot = [...(this.views.graphView?.chart?.data?.datasets?.[0]?.data || [])];
      if (this.currentRunTrace) this.previousRunTrace = this.currentRunTrace;
      this.currentRunTrace = {
        params:      { ...this.controller.simState },
        data:        snapshot,
        peaks:       runResult?.peaks || [],
        maxPressure: runResult?.maxPressure || 0,
        elapsedTime: runResult?.elapsedTime || 0
      };

      if (runResult?.peaks && this.views.interactiveChromatogram) {
        this.views.interactiveChromatogram.setPeaks(runResult.peaks);
      }
      if (runResult?.peaks && this.views.graphView?.setPeaks) {
        this.views.graphView.setPeaks(runResult.peaks);
      }

      if (this._showCompareOverlay && this.previousRunTrace && snapshot.length) {
        if (this.views.interactiveChromatogram) {
          this.views.interactiveChromatogram.setReferenceRun(this.previousRunTrace.data);
        }
        this._generateTeacherSummary(this.previousRunTrace, this.currentRunTrace);
      }

      const replayPoints = [...(this.views.graphView?.chart?.data?.datasets?.[0]?.data || [])];
      if (replayPoints.length && runResult?.peaks && this.views.methodReplay) {
        this.views.methodReplay.loadRun(replayPoints, runResult.peaks);
      }

      // Clear blank badge
      const badge = document.getElementById('blankInjectionBadge');
      if (badge) badge.style.display = 'none';

      const resultsBtn = document.getElementById('tabBtn-results');
      const badgeDot   = document.getElementById('resultsBadge');
      if (resultsBtn) resultsBtn.disabled = false;
      if (badgeDot)   badgeDot.style.display = 'inline-block';

      // ── Post-run CDS integration animation (≤1.1s total) ──────────────────
      const cdsStatus = document.getElementById('cdsIntegrationStatus');
      const showCds = (msg) => { if (cdsStatus) { cdsStatus.textContent = msg; cdsStatus.style.display = 'inline'; } };

      if (this.views.runTimeline) this.views.runTimeline.setPhase('integrate');
      showCds('Processing peaks...');

      setTimeout(() => {
        if (this.views.compareView)  this.views.compareView.render(methodComparison);
        if (this.views.historyView)  this.views.historyView.render(methodHistory);
        if (this.views.reportCard)   this.views.reportCard.render(runResult, exerciseProfile);
        if (this.views.narrator)     this.views.narrator.onRunCompleted(runResult);
        if (this.views.notebook)     this.views.notebook.attachRunResult(runResult?.id || Date.now(), runResult);

        showCds('✓ Integration complete');
        if (this.views.runTimeline) this.views.runTimeline.setPhase('report');

        setTimeout(() => {
          if (this.views.displayView) this.views.displayView.renderPeakTable(runResult);
          const obsCard = document.getElementById('inlineObservationCard');
          if (obsCard) obsCard.style.display = 'block';
          this._evaluatePrediction(runResult);
          if (cdsStatus) { cdsStatus.textContent = ''; cdsStatus.style.display = 'none'; }
        }, 400);
      }, 700);
    });
  }

  /* ── CDS Metadata Strip ─────────────────────────────────────────────────── */

  _updateMetaStrip({ sampleName, estimatedMaxTime } = {}) {
    const s = this.controller.simState;
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

    set('metaSample',     sampleName || '-');
    set('metaFlow',       formatFlowRate(s.flowRate || 1.0));
    set('metaWavelength', formatWavelength(s.wavelengthNm || 254));
    set('metaTemp',       (s.temperature  || 25)  + ' °C');
    set('metaRunTime',    estimatedMaxTime ? formatTimeDecimal(estimatedMaxTime, 2) : '-');

    // Reactively update physical SVG Visualizer Hero text nodes
    const elTemp = document.getElementById('heroColumnTemp');
    if (elTemp) elTemp.textContent = `COLUMN OVEN (C18, ${(s.temperature || 25).toFixed(0)}°C)`;

    const elUv = document.getElementById('heroUvWavelength');
    if (elUv) elUv.textContent = `${(s.wavelengthNm || 254).toFixed(0)} nm`;

    const elSolvA = document.getElementById('heroSolventA');
    if (elSolvA) elSolvA.textContent = `A:${s.solventA || 'H₂O'}`;

    const elSolvB = document.getElementById('heroSolventB');
    if (elSolvB) elSolvB.textContent = `B:${s.solventB || 'ACN'}`;
  }

  /* ── Compare Overlay Toggle (for CDS toolbar "Compare" button) ───────────── */
  toggleCompareOverlay() {
    this._showCompareOverlay = !this._showCompareOverlay;
    if (this.views.interactiveChromatogram) {
      if (this._showCompareOverlay && this.previousRunTrace) {
        this.views.interactiveChromatogram.setReferenceRun(this.previousRunTrace.data);
      } else {
        this.views.interactiveChromatogram.clearReference();
      }
    }
    const card = document.getElementById('teacherSummaryCard');
    if (card) {
      card.style.display = this._showCompareOverlay ? 'block' : 'none';
    }
    const btn = document.getElementById('toolCompare');
    if (btn) btn.classList.toggle('active', this._showCompareOverlay);
  }

  _updateTimelinePhase(state) {
    if (!this.views.runTimeline) return;
    const phaseMap = {
      PRIMING:      'prime',
      EQUILIBRATING:'equilibrate',
      READY:        'inject',
      INJECTING:    'inject',
      RUNNING:      'separation',
      COMPLETED:    'report'
    };
    if (phaseMap[state]) this.views.runTimeline.setPhase(phaseMap[state]);
  }


  /* ── 4-Step Structured Teacher Summary & Prediction Evaluator ──────────── */

  _evaluatePrediction(runResult) {
    const selectedRad = document.querySelector('input[name="prediction"]:checked');
    const fbBox = document.getElementById('predictionFeedbackBox');
    if (!selectedRad || !fbBox) return;

    const val = selectedRad.value;
    let text = '';
    let isCorrect = false;

    if (this.previousRunTrace) {
      const prevTR = this.previousRunTrace.peaks?.[0]?.tR || 0;
      const currTR = runResult?.peaks?.[0]?.tR || 0;
      const deltaTR = currTR - prevTR;

      if (val === 'earlier' && deltaTR < -0.05) isCorrect = true;
      else if (val === 'later' && deltaTR > 0.05) isCorrect = true;
      else if (val === 'pressure' && (runResult.maxPressure > this.previousRunTrace.maxPressure)) isCorrect = true;
      else if (val === 'resolution') {
        const prevRs = this.previousRunTrace.peaks?.[1]?.resolution || 0;
        const currRs = runResult?.peaks?.[1]?.resolution || 0;
        if (currRs > prevRs) isCorrect = true;
      }
    } else {
      isCorrect = true; // First run baseline hypothesis validated
    }

    fbBox.style.display = 'block';
    if (isCorrect) {
      fbBox.style.background = 'rgba(34,197,94,0.15)';
      fbBox.style.color = '#4ade80';
      fbBox.style.border = '1px solid rgba(34,197,94,0.3)';
      fbBox.textContent = '✓ You predicted correctly! Observed chromatographic trends match your hypothesis.';
    } else {
      fbBox.style.background = 'rgba(234,179,8,0.15)';
      fbBox.style.color = '#facc15';
      fbBox.style.border = '1px solid rgba(234,179,8,0.3)';
      fbBox.textContent = '💡 Hypothesis note: Parameter shifts altered retention dynamics differently than predicted.';
    }
  }

  _generateTeacherSummary(prevRun, currRun) {
    const summaryCard = document.getElementById('teacherSummaryCard');
    if (!summaryCard) return;

    if (!prevRun || !prevRun.params || !currRun || !currRun.params) {
      const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
      set('tsParamChanged', 'Initial Baseline Run Completed.');
      set('tsObservedEffect', 'No previous run trace available for comparison yet.');
      set('tsScientificReason', 'Change a parameter (e.g., %B or Flow Rate) and run a 2nd experiment to see side-by-side trace comparison!');
      set('tsSuggestedNext', 'Try adjusting %B on the Method tab to observe retention shift.');
      if (!this._compareCardUserDismissed) summaryCard.style.display = 'block';
      return;
    }

    const pA = prevRun.params;
    const pB = currRun.params;


    // Detect primary changed parameter
    let changedText = 'Method parameters were adjusted.';
    let scientificReason = 'Solute distribution equilibrium shifted based on modified conditions.';
    let suggestedNext = 'Try fine-tuning flow rate or %B to optimize resolution.';

    if (pB.flowRate !== pA.flowRate) {
      const diff = (pB.flowRate - pA.flowRate).toFixed(1);
      changedText = `Flow rate ${diff > 0 ? 'increased' : 'decreased'} from ${pA.flowRate} to ${pB.flowRate} mL/min.`;
      scientificReason = diff > 0 
        ? 'Higher mobile phase linear velocity reduces solute residence time inside the column.'
        : 'Lower linear velocity increases residence time, allowing longer interaction with stationary phase.';
      suggestedNext = diff > 0 
        ? 'If peaks overlap, reduce flow to 1.1–1.2 mL/min to improve separation.' 
        : 'If analysis is too slow, increase flow to 1.0–1.2 mL/min.';
    } else if (pB.organicPercent !== pA.organicPercent) {
      const diff = pB.organicPercent - pA.organicPercent;
      changedText = `Mobile phase %B ${diff > 0 ? 'increased' : 'decreased'} from ${pA.organicPercent}% to ${pB.organicPercent}%.`;
      scientificReason = diff > 0 
        ? 'Higher organic solvent strength weakens hydrophobic retention on C18 stationary phase.'
        : 'Lower organic solvent strength strengthens hydrophobic retention on C18 stationary phase.';
      suggestedNext = 'Adjust %B by ±5% increments to fine-tune retention factor (k\').';
    } else if (pB.temperature !== pA.temperature) {
      const diff = pB.temperature - pA.temperature;
      changedText = `Column temperature ${diff > 0 ? 'increased' : 'decreased'} from ${pA.temperature}°C to ${pB.temperature}°C.`;
      scientificReason = 'Temperature alters mobile phase viscosity and mass transfer diffusion rate.';
      suggestedNext = 'Keep column temperature around 25°C–30°C for reproducible HPLC runs.';
    }

    // Quantitative observed effect
    const prevTR = prevRun.peaks?.[0]?.tR || 0;
    const currTR = currRun.peaks?.[0]?.tR || 0;
    const pctDiff = prevTR > 0 ? (((currTR - prevTR) / prevTR) * 100).toFixed(1) : 0;
    const observedEffect = `Retention time ${pctDiff < 0 ? 'decreased' : 'increased'} by ${Math.abs(pctDiff)}% (ΔtR = ${(currTR - prevTR).toFixed(2)} min).`;

    // Check for multi-parameter shifts (One-Parameter-at-a-Time Rule)
    const changedParams = [];
    if (pB.flowRate !== pA.flowRate) changedParams.push('Flow Rate');
    if (pB.organicPercent !== pA.organicPercent) changedParams.push('Mobile Phase %B');
    if (pB.temperature !== pA.temperature) changedParams.push('Column Temperature');
    if (pB.pH !== pA.pH) changedParams.push('pH');

    let multiParamNotice = '';
    if (changedParams.length > 1) {
      multiParamNotice = ` ⚠️ Note: You changed ${changedParams.length} parameters at once (${changedParams.join(', ')}). For authentic cause-and-effect learning, try changing only ONE parameter per experiment!`;
    }

    // C3B: Integrate EducationalEngine diagnostic evaluation
    const evaluation = EducationalEngine.evaluateRunResult(currRun);
    if (evaluation.recommendations && evaluation.recommendations.length > 0) {
      suggestedNext += ` (Tutor Tip: ${evaluation.recommendations[0]})`;
    }

    document.getElementById('tsParamChanged').textContent = changedText + multiParamNotice;
    document.getElementById('tsObservedEffect').textContent = observedEffect;
    document.getElementById('tsScientificReason').textContent = scientificReason;
    document.getElementById('tsSuggestedNext').textContent = suggestedNext;


    // C1.4: only open if user hasn't explicitly dismissed it
    if (!this._compareCardUserDismissed) {
      summaryCard.style.display = 'block';
    }
  }

  /* ── DOM Update Helpers for NEW Modern CDS UI ───────────────────────────── */

  _setAcqPhaseLabel(text) {
    const acqLabel = document.getElementById('acqPhaseLabel');
    if (acqLabel) acqLabel.textContent = text;
  }

  /**
   * C2.5: Single telemetry renderer. Pass only what changed.
   * Fans updates to: CDS strip (FULL) + sticky PiP (COMPACT).
   * @param {object} patch - { state?, pressure?, wavelength?, time? }
   */
  renderTelemetry(patch = {}) {
    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
    if (patch.state     !== undefined) {
      set('cdsStateVal',   `● ${patch.state}`);
      set('pipStateVal',   `● ${patch.state}`);
    }
    if (patch.pressure  !== undefined) {
      set('cdsPressureVal', `${patch.pressure.toFixed(1)} bar`);
      set('pipPressureVal', `${patch.pressure.toFixed(1)} bar`);
    }
    if (patch.wavelength !== undefined) {
      set('cdsUvVal', `${patch.wavelength} nm`);
    }
    if (patch.time !== undefined) {
      set('pipTimerVal', `${patch.time.toFixed(2)} min`);
    }
  }

  // _updateCdsStateVal / _updateCdsPressureVal / _updateCdsUvVal replaced by renderTelemetry — C2.5
  // _updateStepHighlight removed C2.1 — guided-step-banner deleted; RunTimeline is sole workflow indicator.

  /** C1.1: Bind 'Why?' explanation triggers — Bottom Sheet is the ONLY educational overlay */
  bindWhyModal() {
    const paramMap = {
      infoFlow:       'flowRate',
      infoOrganic:    'organicPercent',
      infoTemp:       'temperature',
      infoPh:         'ph',
      infoBuffer:     'buffer',
      infoWavelength: 'wavelength'
    };

    // Info icons (ⓘ buttons beside each parameter slider)
    Object.entries(paramMap).forEach(([elementId, paramId]) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.style.cursor = 'pointer';
        el.title = 'Click for Educational Explanation';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.showWhyModal(paramId);
        });
      }
    });

    // Why-chips (context bubbles from controls.js steppers) — C1.1
    document.addEventListener('whyRequested', (e) => {
      this.showWhyModal(e.detail?.paramId);
    });
  }

  /** Render EducationalExplanation payload in contextual Bottom Sheet */
  showWhyModal(paramId) {
    const exp = EducationalEngine.getParameterExplanation(paramId);
    if (!exp) return;

    const htmlContent = `
      <div style="space-y:12px; font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
        <div style="margin-bottom:12px;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--brand-primary); font-weight:700; margin-bottom:4px;">Physical Effect</div>
          <p style="margin:0; font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">${exp.physicalEffect}</p>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#8b5cf6; font-weight:700; margin-bottom:4px;">Observed Effect</div>
          <p style="margin:0; font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">${exp.observedEffect}</p>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--brand-success); font-weight:700; margin-bottom:4px;">Learner Outcome</div>
          <p style="margin:0; font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">${exp.learnerOutcome}</p>
        </div>

        <div style="margin-bottom:12px; background:#f0f9ff; border-left:3px solid var(--brand-primary); padding:10px 12px; border-radius:4px;">
          <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--brand-primary); font-weight:700; margin-bottom:2px;">💡 Practical Tip</div>
          <p style="margin:0; font-size:0.85rem; color:var(--text-primary);">${exp.practicalTip || 'N/A'}</p>
        </div>

        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); font-weight:700; margin-bottom:4px;">References</div>
          <ul style="margin:0; padding-left:18px; font-size:0.78rem; color:var(--text-secondary); font-family:var(--font-mono);">
            ${(exp.references || []).map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    this.openBottomSheet(`Why? ${exp.parameter}`, '❓', htmlContent);
  }

  /** Contextual Bottom Sheet Overlay Handlers */
  bindBottomSheet() {
    const bottomSheetBackdrop = document.getElementById('bottomSheetBackdrop');
    const closeBottomSheetBtn = document.getElementById('closeBottomSheetBtn');
    const closeSheet = () => {
      const sheet = document.getElementById('bottomSheet');
      if (sheet) sheet.classList.remove('active');
      if (bottomSheetBackdrop) bottomSheetBackdrop.classList.remove('active');
    };
    if (closeBottomSheetBtn) {
      closeBottomSheetBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); closeSheet(); };
    }
    if (bottomSheetBackdrop) {
      bottomSheetBackdrop.onclick = (e) => { e.preventDefault(); closeSheet(); };
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSheet();
    });
  }

  openBottomSheet(title, icon, contentHtmlOrElement) {
    const sheet = document.getElementById('bottomSheet');
    const backdrop = document.getElementById('bottomSheetBackdrop');
    const titleText = document.getElementById('bottomSheetTitleText');
    const iconEl = document.getElementById('bottomSheetIcon');
    const sheetBody = document.getElementById('bottomSheetBody');

    if (!sheet || !backdrop || !sheetBody) return;

    if (titleText) titleText.textContent = title;
    if (iconEl) iconEl.textContent = icon;

    if (typeof contentHtmlOrElement === 'string') {
      sheetBody.innerHTML = contentHtmlOrElement;
    } else if (contentHtmlOrElement instanceof HTMLElement) {
      sheetBody.innerHTML = '';
      sheetBody.appendChild(contentHtmlOrElement);
    }

    backdrop.classList.add('active');
    sheet.classList.add('active');
  }

  /** Sprint E3: Bind Floating Quick Action Dock */
  bindFloatingDock() {
    const fabMethod = document.getElementById('fabMethodBtn');
    const fabSample = document.getElementById('fabSampleBtn');
    const fabWhy = document.getElementById('fabWhyBtn');
    const fabNotebook = document.getElementById('fabNotebookBtn');

    if (fabMethod) {
      fabMethod.addEventListener('click', () => {
        const methodTab = document.getElementById('tabBtn-method');
        if (methodTab) methodTab.click();
      });
    }

    if (fabSample) {
      fabSample.addEventListener('click', () => {
        const sampleTab = document.getElementById('tabBtn-sample');
        if (sampleTab) sampleTab.click();
      });
    }

    if (fabWhy) {
      fabWhy.addEventListener('click', () => {
        this.showWhyModal('flowRate');
      });
    }

    if (fabNotebook) {
      fabNotebook.addEventListener('click', () => {
        const resultsTab = document.getElementById('tabBtn-results');
        if (resultsTab) resultsTab.click();
      });
    }
  }

  /** Render real-time mini sparkline trace inside PiP Canvas */
  _updatePipSparkline(time, signal) {
    if (!this.pipDataPoints) this.pipDataPoints = [];
    this.pipDataPoints.push({ time, signal });
    if (this.pipDataPoints.length > 150) this.pipDataPoints.shift();

    const canvas = document.getElementById('pipSparklineCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const maxSig = Math.max(10, ...this.pipDataPoints.map(p => p.signal));
    this.pipDataPoints.forEach((pt, idx) => {
      const x = (idx / (this.pipDataPoints.length - 1 || 1)) * w;
      const y = h - (pt.signal / maxSig) * (h - 6) - 3;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  /** Update Floating Quick Dock labeled chips dynamically based on experiment state */
  _updateFabDockForState(state) {
    const fabMethod = document.getElementById('fabMethodBtn');
    const fabSample = document.getElementById('fabSampleBtn');
    const fabWhy = document.getElementById('fabWhyBtn');
    const fabNotebook = document.getElementById('fabNotebookBtn');

    if (state === 'RUNNING' || state === 'INJECTING') {
      if (fabMethod) fabMethod.style.display = 'none';
      if (fabSample) fabSample.style.display = 'none';
      if (fabWhy)    fabWhy.style.display = 'inline-flex';
      if (fabNotebook) fabNotebook.style.display = 'inline-flex';
    } else if (state === 'COMPLETED') {
      if (fabMethod) fabMethod.style.display = 'inline-flex';
      if (fabSample) fabSample.style.display = 'inline-flex';
      if (fabWhy)    fabWhy.style.display = 'inline-flex';
      if (fabNotebook) fabNotebook.style.display = 'inline-flex';
    } else {
      if (fabMethod) fabMethod.style.display = 'inline-flex';
      if (fabSample) fabSample.style.display = 'inline-flex';
      if (fabWhy)    fabWhy.style.display = 'inline-flex';
      if (fabNotebook) fabNotebook.style.display = 'inline-flex';
    }
  }
}
