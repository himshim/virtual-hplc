import { globalModal } from '../../../ui/components/Modal.js';

/**
 * controls.js - DOM Inputs, User Action Bindings & Educational Tooltips ⓘ
 *
 * Updated for CDS acquisition lifecycle:
 *   IDLE → PRIMING → EQUILIBRATING → READY → RUNNING → COMPLETED
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
    this.bindTooltips();
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

    if (this.stopBtn) {
      this.stopBtn.onclick = () => {
        this.controller.stopPump();
      };
    }
  }

  bindTooltips() {
    const tooltipMap = {
      infoFlow: {
        title: "ⓘ Flow Rate (mL/min)",
        body: "<strong>What is this?</strong> Speed at which mobile phase solvent is pumped through the column.<br><strong>What happens?</strong> Higher flow rate speeds up analysis (shorter run time) but increases system backpressure ($P \\propto F$).<br><strong>Lab Note:</strong> Standard $4.6\\text{ mm}$ columns operate at $1.0 - 1.5\\text{ mL/min}$."
      },
      infoOrganic: {
        title: "ⓘ Mobile Phase %B (Organic Solvent)",
        body: "<strong>What is this?</strong> Percentage of strong organic solvent (Methanol/Acetonitrile) in mobile phase.<br><strong>What happens?</strong> Higher %B reduces solute retention on hydrophobic C18 column ($t_R \\downarrow$).<br><strong>Lab Note:</strong> 10% change in %B typically shifts retention by $2\\times - 3\\times$."
      },
      infoTemp: {
        title: "ⓘ Column Temperature (°C)",
        body: "<strong>What is this?</strong> Thermostatic column oven temperature.<br><strong>What happens?</strong> Higher temperature lowers mobile phase viscosity, reducing system backpressure by ~28% @ 50°C while slightly accelerating elution.<br><strong>Lab Note:</strong> Used to manage high backpressure without sacrificing flow rate."
      },
      infoPh: {
        title: "ⓘ Mobile Phase pH",
        body: "<strong>What is this?</strong> Acidity/alkalinity of mobile phase aqueous buffer.<br><strong>What happens?</strong> Alters ionization state of weak acids and bases. Ionized species ($\text{COO}^-$) are hydrophilic and elute much faster.<br><strong>Lab Note:</strong> Maintain $\\text{pH} = \\text{p}K_a \\pm 2$ for robust un-ionized or fully ionized method control."
      },
      infoBuffer: {
        title: "ⓘ Buffer System Entity",
        body: "<strong>What is this?</strong> Weak acid/conjugate base solution maintaining constant mobile phase pH.<br><strong>What happens?</strong> Prevents pH drift during sample injection.<br><strong>Lab Note:</strong> Ensure selected pH falls within buffer's effective buffering range ($\text{p}K_a \\pm 1.0$)."
      },
      infoWavelength: {
        title: "ⓘ UV Wavelength λ (nm)",
        body: "<strong>What is this?</strong> Optical wavelength of UV/Vis detector cell.<br><strong>What happens?</strong> Peak height depends on analyte extinction coefficient $\\epsilon(\\lambda)$ at selected wavelength according to Beer-Lambert Law.<br><strong>Lab Note:</strong> Set $\\lambda = \\lambda_{\\max}$ for maximum sensitivity or selective detection."
      }
    };

    Object.keys(tooltipMap).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.cursor = "pointer";
        el.onclick = () => globalModal.show(tooltipMap[id].title, tooltipMap[id].body);
      }
    });
  }

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
