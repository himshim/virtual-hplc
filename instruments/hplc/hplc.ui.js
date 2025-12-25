import { hplcState } from "./hplc.state.js";
import { samples } from "./samples.js";

import {
  runHPLC,
  updatePressure,
  updateMobilePhase,
  updateColumn
} from "./hplc.logic.js";

import {
  startFlowAnimation,
  stopFlowAnimation,
  injectSampleAnimation
} from "./hplc.animation.js";

const flow = document.getElementById("flow");
const flowVal = document.getElementById("flowVal");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");

const solventB = document.getElementById("solventB");
const solventBVal = document.getElementById("solventBVal");

const columnType = document.getElementById("columnType");
const columnLength = document.getElementById("columnLength");
const columnLengthVal = document.getElementById("columnLengthVal");

const sampleSelect = document.getElementById("sampleSelect");

const pressureDisplay = document.getElementById("pressureDisplay");

/* ---------- Controls ---------- */

flow.oninput = () => {
  hplcState.flow = Number(flow.value);
  flowVal.textContent = flow.value;
  updateAll();
};

solventB.oninput = () => {
  const b = Number(solventB.value);
  hplcState.mobilePhase.solventB.percent = b;
  hplcState.mobilePhase.solventA.percent = 100 - b;
  solventBVal.textContent = `${b}% ACN`;
  updateAll();
};

columnType.onchange = () => {
  hplcState.column.type = columnType.value;
  updateAll();
};

columnLength.oninput = () => {
  hplcState.column.length = Number(columnLength.value);
  columnLengthVal.textContent = `${columnLength.value} mm`;
  updateAll();
};

sampleSelect.onchange = () => {
  hplcState.sample = samples[sampleSelect.value];
};

pumpBtn.onclick = () => {
  hplcState.pumpOn = !hplcState.pumpOn;
  pumpBtn.textContent = hplcState.pumpOn ? "Pump ON" : "Pump OFF";
  injectBtn.disabled = !hplcState.pumpOn;
  hplcState.pumpOn ? startFlowAnimation() : stopFlowAnimation();
};

injectBtn.onclick = () => {
  hplcState.injected = true;
  injectSampleAnimation();
  runHPLC(hplcState);
};

/* ---------- Update Logic ---------- */

function updateAll() {
  updateMobilePhase(hplcState);
  updateColumn(hplcState);
  updatePressure(hplcState);

  pressureDisplay.textContent =
    `Pressure: ${hplcState.pressure.toFixed(0)} bar`;

  pressureDisplay.style.color =
    hplcState.warning ? "#d32f2f" : "#2e7d32";
}