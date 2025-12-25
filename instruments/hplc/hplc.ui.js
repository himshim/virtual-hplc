import { hplcState, HPLC_STATES } from "./hplc.state.js";
import {
  updatePressure,
  updateMobilePhase,
  updateColumn,
  tickEquilibration,
  startBaseline,
  injectAndRun,
  stopGraph
} from "./hplc.logic.js";

import {
  startFlowAnimation,
  stopFlowAnimation,
  injectSampleAnimation,
  initAnimation
} from "./hplc.animation.js";

import { samples } from "./samples.js";

/* DOM */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const pressureDisplay = document.getElementById("pressureDisplay");
const rtDisplay = document.getElementById("rtDisplay");

const flow = document.getElementById("flow");
const solventB = document.getElementById("solventB");
const columnType = document.getElementById("columnType");
const sampleSelect = document.getElementById("sampleSelect");
const wavelength = document.getElementById("wavelength");
const sensitivity = document.getElementById("sensitivity");

/* Init */
setTimeout(() => {
  initAnimation();
  updateSystem();
}, 300);

/* Controls */
flow.oninput = () => {
  hplcState.flow = Number(flow.value);
  updateSystem();
};

solventB.oninput = () => {
  const b = Number(solventB.value);
  hplcState.mobilePhase.solventB.percent = b;
  hplcState.mobilePhase.solventA.percent = 100 - b;
  updateSystem();
};

columnType.onchange = () => {
  hplcState.column.type = columnType.value;
  updateSystem();
};

sampleSelect.onchange = () => {
  hplcState.sample = samples[sampleSelect.value];
};

wavelength.oninput = () => {
  hplcState.detector.wavelength = Number(wavelength.value);
};

sensitivity.oninput = () => {
  hplcState.detector.sensitivity = Number(sensitivity.value);
};

pumpBtn.onclick = () => {
  hplcState.pumpOn = !hplcState.pumpOn;

  pumpBtn.textContent = hplcState.pumpOn ? "Pump ON" : "Pump OFF";

  if (hplcState.pumpOn) {
    startFlowAnimation();
    hplcState.systemState = HPLC_STATES.EQUILIBRATING;
    hplcState.equilibration.timeLeft = 5;
    startBaseline(hplcState); // ✅ baseline starts immediately
  } else {
    stopFlowAnimation();
    stopGraph();
    hplcState.systemState = HPLC_STATES.IDLE;
  }

  updateUI();
};

injectBtn.onclick = () => {
  if (hplcState.systemState !== HPLC_STATES.READY) return;

  injectSampleAnimation();
  injectAndRun(hplcState); // ✅ reset graph & run
  updateUI();
};

/* Clock */
setInterval(() => {
  if (hplcState.systemState === HPLC_STATES.EQUILIBRATING) {
    tickEquilibration(hplcState);
    if (!hplcState.equilibration.required) {
      hplcState.systemState = HPLC_STATES.READY;
    }
  }
  updateUI();
}, 1000);

/* Helpers */
function updateSystem() {
  updateMobilePhase(hplcState);
  updateColumn(hplcState);
  updatePressure(hplcState);
}

function updateUI() {
  statusEl.textContent = `Status: ${hplcState.systemState}`;

  injectBtn.disabled =
    hplcState.systemState !== HPLC_STATES.READY;

  pressureDisplay.textContent =
    `Pressure: ${hplcState.pressure.toFixed(0)} bar`;

  const comp = hplcState.sample.components[0];
  const rt =
    2 +
    (comp.hydrophobicity * hplcState.column.factor) /
    (hplcState.mobilePhase.strength * hplcState.flow);

  rtDisplay.textContent = `Estimated RT: ${rt.toFixed(2)} min`;
}