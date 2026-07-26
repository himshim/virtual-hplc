/**
 * controls.js - DOM Inputs & User Action Bindings
 */
export class ControlsView {
  constructor(controller) {
    this.controller = controller;

    // DOM Inputs
    this.flowInput = document.getElementById("flowInput");
    this.flowVal = document.getElementById("flowVal");
    this.organicInput = document.getElementById("organicInput");
    this.organicVal = document.getElementById("organicVal");
    this.tempInput = document.getElementById("tempInput");
    this.tempVal = document.getElementById("tempVal");
    this.wavelengthInput = document.getElementById("wavelengthInput");
    this.wavelengthVal = document.getElementById("wavelengthVal");
    this.phInput = document.getElementById("phInput");
    this.phVal = document.getElementById("phVal");
    this.bufferSelect = document.getElementById("bufferSelect");
    this.sensitivityInput = document.getElementById("sensitivityInput");
    this.sensitivityVal = document.getElementById("sensitivityVal");
    this.compoundSelect = document.getElementById("compoundSelect");
    this.speedSelect = document.getElementById("speedSelect");
    this.profileSelect = document.getElementById("profileSelect");
    this.exerciseSelect = document.getElementById("exerciseSelect");
    this.pumpBtn = document.getElementById("pumpBtn");
    this.injectBtn = document.getElementById("injectBtn");

    this.bindEvents();
  }

  bindEvents() {
    if (this.flowInput) {
      this.flowInput.oninput = (e) => {
        const val = e.target.value;
        if (this.flowVal) this.flowVal.textContent = val;
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
        this.controller.setTemperature(val);
      };
    }

    if (this.wavelengthInput) {
      this.wavelengthInput.oninput = (e) => {
        const val = e.target.value;
        if (this.wavelengthVal) this.wavelengthVal.textContent = `${val} nm`;
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

    if (this.pumpBtn) {
      this.pumpBtn.onclick = () => {
        const state = this.controller.getState();
        if (state === 'IDLE' || state === 'STOPPED' || state === 'COMPLETED' || state === 'OVERPRESSURE') {
          this.controller.startPump();
        } else if (state === 'READY' || state === 'RUNNING') {
          this.controller.stopPump();
        }
      };
    }

    if (this.injectBtn) {
      this.injectBtn.onclick = () => {
        this.controller.injectSample();
      };
    }
  }

  updateControlsForState(state) {
    const isPumpOff = (state === 'IDLE' || state === 'STOPPED' || state === 'COMPLETED' || state === 'OVERPRESSURE');
    
    if (this.flowInput) this.flowInput.disabled = !isPumpOff;
    if (this.organicInput) this.organicInput.disabled = !isPumpOff;
    if (this.tempInput) this.tempInput.disabled = !isPumpOff;
    if (this.phInput) this.phInput.disabled = (state === 'RUNNING');
    if (this.bufferSelect) this.bufferSelect.disabled = (state === 'RUNNING');
    if (this.wavelengthInput) this.wavelengthInput.disabled = (state === 'RUNNING');
    if (this.compoundSelect) this.compoundSelect.disabled = (state === 'RUNNING');
    if (this.injectBtn) this.injectBtn.disabled = (state !== 'READY');
    if (this.pumpBtn) {
      this.pumpBtn.disabled = (state === 'BOOTING');
      this.pumpBtn.textContent = isPumpOff ? "▶ Pump START" : "⏹ Pump STOP";
    }
  }
}
