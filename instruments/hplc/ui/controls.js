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
    this.sensitivityInput = document.getElementById("sensitivityInput");
    this.sensitivityVal = document.getElementById("sensitivityVal");
    this.compoundSelect = document.getElementById("compoundSelect");
    this.speedSelect = document.getElementById("speedSelect");
    this.profileSelect = document.getElementById("profileSelect");
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
    if (this.compoundSelect) this.compoundSelect.disabled = (state === 'RUNNING');
    if (this.injectBtn) this.injectBtn.disabled = (state !== 'READY');
    if (this.pumpBtn) {
      this.pumpBtn.disabled = (state === 'BOOTING');
      this.pumpBtn.textContent = isPumpOff ? "▶ Pump START" : "⏹ Pump STOP";
    }
  }
}
