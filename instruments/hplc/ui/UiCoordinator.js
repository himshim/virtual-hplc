import { HPLC_EVENTS } from '../controller/HplcEvents.js';
import { EducationalEngine } from '../education/EducationalEngine.js';

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
    this.bindWhyModal();
    this.bindFloatingDockAndDrawers();
    this.bindStickyObserverAndPip();
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
      this._updateFabDockForState(newState);
      const pipState = document.getElementById('pipStateVal');
      if (pipState) pipState.textContent = `● ${newState}`;
    });

    bus.on(HPLC_EVENTS.PRESSURE_CHANGED, ({ pressure }) => {
      if (this.views.displayView)  this.views.displayView.setPressure(pressure);
      if (this.views.statusBar)    this.views.statusBar.update({ pressureBar: pressure });
      this._updateCdsPressureVal(pressure);
      const pipP = document.getElementById('pipPressureVal');
      if (pipP) pipP.textContent = `${pressure.toFixed(1)} bar`;
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

      this.pipDataPoints = [];
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
      const pipTimer = document.getElementById('pipTimerVal');
      if (pipTimer) pipTimer.textContent = `${time.toFixed(2)} min`;

      const state = this.controller.getState();
      if (state === 'PRIMING' || state === 'EQUILIBRATING' || state === 'READY' || state === 'RUNNING') {
        if (this.views.graphView) this.views.graphView.addPoint(time, signal);

        if (state === 'RUNNING') {
          this._updatePipSparkline(time, signal);
          if (this.views.runTimeline) {
            if (time < 0.3)      this.views.runTimeline.setPhase('prime');
            else if (time < 0.8) this.views.runTimeline.setPhase('equilibrate');
            else if (time < 1.5) this.views.runTimeline.setPhase('inject');
            else                 this.views.runTimeline.setPhase('separation');
          }
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
      if (this.views.notebook) this.views.notebook.attachRunResult(runResult?.id || Date.now(), runResult);

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

  /** Sprint E1: Bind 'Why?' explanation triggers */
  bindWhyModal() {
    const paramMap = {
      infoFlow: 'flowRate',
      infoOrganic: 'organicPercent',
      infoTemp: 'temperature',
      infoPh: 'ph',
      infoWavelength: 'wavelength'
    };

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

    const closeBtn = document.getElementById('closeWhyModal');
    const overlay = document.getElementById('whyModalOverlay');
    if (closeBtn && overlay) {
      closeBtn.addEventListener('click', () => overlay.style.display = 'none');
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    }
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

  /** Sprint E3: Bind Floating Quick Action Dock & Off-Canvas Drawers */
  bindFloatingDockAndDrawers() {
    const fabMethod = document.getElementById('fabMethodBtn');
    const fabSample = document.getElementById('fabSampleBtn');
    const fabWhy = document.getElementById('fabWhyBtn');
    const fabNotebook = document.getElementById('fabNotebookBtn');
    const drawer = document.getElementById('slideOverDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const closeBtn = document.getElementById('closeDrawerBtn');

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
        const notebookContainer = document.getElementById('experiment-notebook-container');
        if (notebookContainer) {
          this.openDrawer('Experiment Notebook', '📝', notebookContainer);
        } else {
          const resultsTab = document.getElementById('tabBtn-results');
          if (resultsTab) resultsTab.click();
        }
      });
    }

    const closeDrawer = () => {
      if (drawer) drawer.classList.remove('active');
      if (backdrop) backdrop.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
  }

  openDrawer(title, icon, contentElement) {
    const drawer = document.getElementById('slideOverDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const titleText = document.getElementById('drawerTitleText');
    const iconEl = document.getElementById('drawerIcon');
    const drawerBody = document.getElementById('drawerBody');

    if (!drawer || !backdrop || !drawerBody) return;

    if (titleText) titleText.textContent = title;
    if (iconEl) iconEl.textContent = icon;

    // Temporarily mount content inside drawer if needed
    drawerBody.innerHTML = '';
    if (contentElement) {
      const clone = contentElement.cloneNode(true);
      drawerBody.appendChild(clone);
    }

    backdrop.classList.add('active');
    drawer.classList.add('active');
  }

  /** Sprint U5 & U6: Morphing Single-Graph PiP & Contextual Bottom Sheets */
  bindStickyObserverAndPip() {
    this.pipDataPoints = [];
    const heroStrip = document.getElementById('cds-telemetry-strip');
    const chromContainer = document.querySelector('.chromatogram-container');
    const stickyPip = document.getElementById('stickyTelemetryPip');
    const bottomSheetBackdrop = document.getElementById('bottomSheetBackdrop');
    const closeBottomSheetBtn = document.getElementById('closeBottomSheetBtn');

    if (heroStrip && stickyPip && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            stickyPip.classList.add('visible');
          } else {
            stickyPip.classList.remove('visible');
          }
        });
      }, { threshold: 0.1 });
      observer.observe(heroStrip);
    }

    // Single GraphView Morphing PiP Observer & DOM Portal Manager
    if (chromContainer && 'IntersectionObserver' in window) {
      const originalParent = chromContainer.parentElement;
      const nextSibling = chromContainer.nextSibling;

      const setPipActive = (active) => {
        if (active) {
          if (!chromContainer.classList.contains('morph-pip-active')) {
            chromContainer.classList.add('morph-pip-active');
            if (chromContainer.parentElement !== document.body) {
              document.body.appendChild(chromContainer);
            }
          }
        } else {
          if (chromContainer.classList.contains('morph-pip-active')) {
            chromContainer.classList.remove('morph-pip-active');
            if (chromContainer.parentElement !== originalParent) {
              if (nextSibling) originalParent.insertBefore(chromContainer, nextSibling);
              else originalParent.appendChild(chromContainer);
            }
          }
        }
      };

      const checkEligibility = () => {
        const state = this.controller.getState();
        const dataLen = this.views.graphView?.chart?.data?.datasets?.[0]?.data?.length || 0;
        return state === 'RUNNING' || state === 'INJECTING' || state === 'COMPLETED' || dataLen > 0;
      };

      const sentinel = document.getElementById('chromatogramSentinel');
      const morphObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const eligible = checkEligibility();
          if (!entry.isIntersecting && eligible) {
            setPipActive(true);
          } else if (entry.isIntersecting) {
            setPipActive(false);
          }
        });
      }, { threshold: 0.1 });

      morphObserver.observe(sentinel || originalParent);

      // Handle Tab Switch: Morph graph into PiP when navigating away from Run tab if run has data
      document.querySelectorAll('.nav-tab-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          if (tab !== 'tab-run' && checkEligibility()) {
            setPipActive(true);
          } else if (tab === 'tab-run') {
            setPipActive(false);
          }
        });
      });

      chromContainer.addEventListener('click', (e) => {
        if (chromContainer.classList.contains('morph-pip-active')) {
          e.stopPropagation();
          setPipActive(false);
          const runTabBtn = document.getElementById('tabBtn-run');
          if (runTabBtn) runTabBtn.click();
          chromContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    const closeSheet = () => {
      const sheet = document.getElementById('bottomSheet');
      if (sheet) sheet.classList.remove('active');
      if (bottomSheetBackdrop) bottomSheetBackdrop.classList.remove('active');
    };

    if (closeBottomSheetBtn) closeBottomSheetBtn.addEventListener('click', closeSheet);
    if (bottomSheetBackdrop) bottomSheetBackdrop.addEventListener('click', closeSheet);
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

    sheetBody.innerHTML = '';
    if (typeof contentHtmlOrElement === 'string') {
      sheetBody.innerHTML = contentHtmlOrElement;
    } else if (contentHtmlOrElement) {
      sheetBody.appendChild(contentHtmlOrElement.cloneNode(true));
    }

    backdrop.classList.add('active');
    sheet.classList.add('active');
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
