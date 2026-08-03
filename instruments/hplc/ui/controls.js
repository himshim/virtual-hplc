// globalModal import removed — C1.1. Educational overlays route through UiCoordinator.showWhyModal().


/**
 * controls.js - DOM Inputs, User Action Bindings, Steppers & Educational Tooltips ⓘ
 *
 * Updated for Sprint U3 (Touch-First Steppers) & CDS Workstation telemetry
 */
export class ControlsView {
  constructor(controller) {
    this.controller = controller;

    // DOM Inputs
    this.flowInput        = document.getElementById("flowInput");
    this.flowVal          = document.getElementById("flowVal");
    this.organicInput     = document.getElementById("organicInput");
    this.organicVal       = document.getElementById("organicVal");
    this.tempInput        = document.getElementById("tempInput");
    this.tempVal          = document.getElementById("tempVal");
    this.wavelengthInput  = document.getElementById("wavelengthInput");
    this.wavelengthVal    = document.getElementById("wavelengthVal");
    this.phInput          = document.getElementById("phInput");
    this.phVal            = document.getElementById("phVal");
    this.bufferSelect     = document.getElementById("bufferSelect");
    this.sensitivityInput = document.getElementById("sensitivityInput");
    this.sensitivityVal   = document.getElementById("sensitivityVal");
    this.compoundSelect   = document.getElementById("compoundSelect");
    this.speedSelect      = document.getElementById("speedSelect");
    this.profileSelect    = document.getElementById("profileSelect");
    this.exerciseSelect   = document.getElementById("exerciseSelect");

    // Action Dock Buttons
    this.pumpBtn   = document.getElementById("pumpBtn");
    this.blankBtn  = document.getElementById("blankBtn");
    this.injectBtn = document.getElementById("injectBtn");
    this.stopBtn   = document.getElementById("stopBtn");

    this.bindEvents();
    this.bindSteppers();
    // NOTE: educational info-icon tooltips are handled exclusively by
    // UiCoordinator.bindWhyModal() → bottom sheet. Do NOT register onclick
    // here to avoid double-handler bug (C1.1).
  }

  bindEvents() {
    if (this.flowInput) {
      this.flowInput.oninput = (e) => {
        const val = e.target.value;
        if (this.flowVal) this.flowVal.textContent = `${parseFloat(val).toFixed(1)} mL/min`;
        const cdsFlow = document.getElementById("cdsFlowVal");
        if (cdsFlow) cdsFlow.textContent = `${parseFloat(val).toFixed(2)} mL/min`;
        this.controller.setFlowRate(val);
      };
    }

    if (this.organicInput) {
      this.organicInput.oninput = (e) => {
        const val = e.target.value;
        if (this.organicVal) this.organicVal.textContent = `${val}%`;
        this.controller.setOrganicPercent(val);
      };
    }

    if (this.tempInput) {
      this.tempInput.oninput = (e) => {
        const val = e.target.value;
        if (this.tempVal) this.tempVal.textContent = `${val}°C`;
        const cdsTemp = document.getElementById("cdsTempVal");
        if (cdsTemp) cdsTemp.textContent = `${parseFloat(val).toFixed(1)} °C`;
        this.controller.setTemperature(val);
      };
    }

    if (this.wavelengthInput) {
      this.wavelengthInput.oninput = (e) => {
        const val = e.target.value;
        if (this.wavelengthVal) this.wavelengthVal.textContent = `${val} nm`;
        const cdsUv = document.getElementById("cdsUvVal");
        if (cdsUv) cdsUv.textContent = `${val} nm`;
        this.controller.setWavelength(val);
      };
    }

    if (this.phInput) {
      this.phInput.oninput = (e) => {
        const val = e.target.value;
        if (this.phVal) this.phVal.textContent = `pH ${val}`;
        this.controller.setPh(val);
      };
    }

    if (this.bufferSelect) {
      this.bufferSelect.onchange = (e) => {
        this.controller.setBufferKey(e.target.value);
      };
    }

    if (this.sensitivityInput) {
      this.sensitivityInput.oninput = (e) => {
        const val = e.target.value;
        if (this.sensitivityVal) this.sensitivityVal.textContent = val;
        this.controller.setSensitivity(val);
      };
    }

    if (this.compoundSelect) {
      this.compoundSelect.onchange = (e) => {
        this.controller.setSampleKey(e.target.value);
      };
    }

    if (this.speedSelect) {
      this.speedSelect.onchange = (e) => {
        this.controller.setSpeed(Number(e.target.value));
      };
    }

    if (this.profileSelect) {
      this.profileSelect.onchange = (e) => {
        this.controller.setCriteriaProfile(e.target.value);
      };
    }

    if (this.exerciseSelect) {
      this.exerciseSelect.onchange = (e) => {
        this.controller.setExerciseProfile(e.target.value);
      };
    }

    // Action Dock Buttons
    if (this.pumpBtn) {
      this.pumpBtn.onclick = () => {
        const state = this.controller.getState();
        if (state === 'IDLE' || state === 'STOPPED' || state === 'COMPLETED' || state === 'OVERPRESSURE') {
          this.controller.startPump();
        } else {
          this.controller.stopPump();
        }
      };
    }

    if (this.blankBtn) {
      this.blankBtn.onclick = () => {
        if (typeof this.controller.injectBlank === 'function') {
          this.controller.injectBlank();
        }
      };
    }

    if (this.injectBtn) {
      this.injectBtn.onclick = () => {
        this.controller.injectSample();
      };
    }

    const runExpBtn = document.getElementById('runExperimentBtn');
    if (runExpBtn) {
      runExpBtn.onclick = () => {
        const state = this.controller.getState();
        if (state === 'IDLE' || state === 'STOPPED' || state === 'COMPLETED' || state === 'OVERPRESSURE') {
          this.controller.startPump();
          const checkReady = setInterval(() => {
            const currentState = this.controller.getState();
            if (currentState === 'READY') {
              clearInterval(checkReady);
              this.controller.injectSample();
            } else if (currentState === 'OVERPRESSURE' || currentState === 'STOPPED') {
              clearInterval(checkReady);
            }
          }, 150);
        } else if (state === 'READY') {
          this.controller.injectSample();
        } else {
          this.controller.stopPump();
        }
      };
    }

    if (this.stopBtn) {
      this.stopBtn.onclick = () => {
        this.controller.stopPump();
      };
    }
  }

  /** Touch-First Stepper Controls Binding (Sprint U3) */
  bindSteppers() {
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const param = btn.getAttribute('data-param');
        const step  = parseFloat(btn.getAttribute('data-step') || 1);

        const inputMap = {
          flow:    this.flowInput,
          organic: this.organicInput,
          temp:    this.tempInput,
          ph:      this.phInput
        };

        const targetInput = inputMap[param];
        if (!targetInput) return;

        const min = parseFloat(targetInput.min);
        const max = parseFloat(targetInput.max);
        let current = parseFloat(targetInput.value);
        let next = Math.max(min, Math.min(max, current + step));

        targetInput.value = next;
        targetInput.dispatchEvent(new Event('input'));

        // Contextual Why Micro-Chip 2.0s Debounce
        this._triggerContextWhyChip(param, current, next);
      };
    });

    // Save Inline Observation Button Event Binding
    const saveObsBtn = document.getElementById('saveObservationBtn');
    if (saveObsBtn) {
      saveObsBtn.onclick = () => {
        const input = document.getElementById('inlineObservationInput');
        const obs = input ? input.value.trim() : '';
        if (!obs) return;

        saveObsBtn.textContent = '✓ Saved';
        saveObsBtn.style.background = '#22c55e';
        if (this.controller.notebook) {
          this.controller.notebook.addEntry({
            title: 'Observation Note',
            content: obs,
            timestamp: new Date().toLocaleTimeString()
          });
        }
        setTimeout(() => {
          saveObsBtn.textContent = 'Save';
          saveObsBtn.style.background = '#16a34a';
        }, 2000);
      };
    }
  }

  _triggerContextWhyChip(param, prevVal, newVal) {
    if (this._whyDebounceTimer) clearTimeout(this._whyDebounceTimer);

    const inputMap = {
      flow: this.flowInput,
      organic: this.organicInput,
      temp: this.tempInput,
      ph: this.phInput
    };
    const inputEl = inputMap[param];
    if (!inputEl) return;

    this._whyDebounceTimer = setTimeout(() => {
      let chipId = `whyChip_${param}`;
      let chipEl = document.getElementById(chipId);
      if (!chipEl) {
        chipEl = document.createElement('div');
        chipEl.id = chipId;
        chipEl.className = 'context-why-chip';
        chipEl.style.cssText = `
          margin-top: 6px; padding: 6px 12px; background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; color: #38bdf8;
          font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex;
          align-items: center; gap: 6px; transition: all 0.3s ease; opacity: 0;
        `;
        inputEl.parentElement.appendChild(chipEl);
      }

      const questions = {
        flow: newVal > prevVal ? '❓ Why did retention time decrease?' : '❓ Why did retention time increase?',
        organic: newVal > prevVal ? '❓ Why did peaks elute faster at higher %B?' : '❓ Why did peaks retain longer at lower %B?',
        temp: newVal > prevVal ? '❓ Why did system backpressure decrease?' : '❓ Why did system backpressure increase?',
        ph: '❓ Why did ionizable compounds shift retention?'
      };

      const explanations = {
        flow: 'Higher flow rate increases mobile phase linear velocity (u), decreasing residence time in the column.',
        organic: 'Higher organic %B solvent strength weakens hydrophobic solute adsorption on C18 stationary phase.',
        temp: 'Higher temperature lowers mobile phase viscosity, dropping column backpressure without reducing flow.',
        ph: 'pH shifts change solute ionization (pK_a). Charged ions elute earlier in reverse-phase HPLC.'
      };

      chipEl.innerHTML = `<span>${questions[param]}</span> <span style="font-size:0.7rem; opacity:0.8;">▶</span>`;
      chipEl.style.opacity = '1';

      // Route through UiCoordinator bottom sheet (C1.1 — single educational overlay).
      // Dispatch a custom event that UiCoordinator.bindWhyModal() can intercept.
      chipEl.onclick = () => {
        const paramIdMap = { flow: 'flowRate', organic: 'organicPercent', temp: 'temperature', ph: 'ph' };
        document.dispatchEvent(new CustomEvent('whyRequested', { detail: { paramId: paramIdMap[param] || param } }));
      };
    }, 2000);
  }

  // bindTooltips() removed — C1.1 cleanup.
  // All info-icon educational overlays are handled by UiCoordinator.bindWhyModal().

  updateControlsForState(state) {
    const isOff = (state === 'IDLE' || state === 'STOPPED' || state === 'COMPLETED' || state === 'OVERPRESSURE');
    const isPreAcq = (state === 'PRIMING' || state === 'EQUILIBRATING');
    const isReady = (state === 'READY');
    const isRunning = (state === 'RUNNING');

    if (this.flowInput)       this.flowInput.disabled = !isOff;
    if (this.organicInput)    this.organicInput.disabled = !isOff;
    if (this.tempInput)       this.tempInput.disabled = !isOff;
    if (this.phInput)         this.phInput.disabled = isRunning;
    if (this.bufferSelect)    this.bufferSelect.disabled = isRunning;
    if (this.wavelengthInput) this.wavelengthInput.disabled = isRunning;
    if (this.compoundSelect)  this.compoundSelect.disabled = isRunning;

    if (this.pumpBtn) {
      this.pumpBtn.disabled  = (state === 'BOOTING' || isPreAcq);
      this.pumpBtn.textContent = isOff ? "▶ Pump START" : isPreAcq ? "⏳ Equilibrating..." : "⏹ Pump STOP";
    }

    if (this.blankBtn) {
      this.blankBtn.disabled = !isReady;
    }

    if (this.injectBtn) {
      this.injectBtn.disabled = !isReady;
    }

    if (this.stopBtn) {
      this.stopBtn.disabled = isOff;
    }
  }
}
