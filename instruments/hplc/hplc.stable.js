/* ==================================================
   STABLE REAL-TIME HPLC SIMULATOR
   STEP B: READ-ONLY DIAGRAM SYNC
   ================================================== */

let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

let flowRate = 1.0;
let organicPercent = 40;
let hydrophobicity = 0.55;

const VOID_TIME = 1.0;
const COLUMN_FACTOR = 1.0;

let injecting = false;
let peakRT = null;
let peakWidth = 0.25;

/* DOM */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const rtDisplay = document.getElementById("rtDisplay");

const flowInput = document.getElementById("flowInput");
const flowVal = document.getElementById("flowVal");
const organicInput = document.getElementById("organicInput");
const organicVal = document.getElementById("organicVal");
const compoundSelect = document.getElementById("compoundSelect");

/* Diagram elements (loaded later) */
let flowDot, injectorBox;

/* INIT GRAPH */
function initGraph() {
  const ctx = document.getElementById("graphCanvas").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: { datasets: [{ data: [], borderColor: "#1565c0", pointRadius: 0 }] },
    options: { animation: false, scales: { x: { type: "linear", min: 0, max: MAX_TIME } } }
  });
}

/* RT CALC */
function calculateRT() {
  const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;
  return Math.min(
    VOID_TIME + (hydrophobicity * COLUMN_FACTOR) / (flowRate * elutionStrength),
    MAX_TIME - 1
  );
}

/* BASELINE LOOP */
function startRun() {
  stopRun();
  resetGraph();
  animateFlow(true);

  timer = setInterval(() => {
    time += 0.05;
    let signal = (Math.random() - 0.5) * 0.02;

    if (injecting && peakRT !== null) {
      signal += Math.exp(-Math.pow(time - peakRT, 2) / (2 * peakWidth * peakWidth));
    }

    chart.data.datasets[0].data.push({ x: time, y: signal });
    chart.update("none");
    if (time >= MAX_TIME) stopRun();
  }, 100);
}

/* INJECT */
function injectSample() {
  resetGraph();
  injecting = true;
  peakRT = calculateRT();
  rtDisplay.textContent = `Estimated RT: ${peakRT.toFixed(2)} min`;
  flashInjector();
  startRun();
}

/* HELPERS */
function resetGraph() {
  stopRun();
  time = 0;
  chart.data.datasets[0].data = [];
  chart.update();
}

function stopRun() {
  if (timer) clearInterval(timer);
  animateFlow(false);
}

/* DIAGRAM ANIMATION */
function animateFlow(on) {
  if (!flowDot) return;
  flowDot.style.opacity = on ? 1 : 0;
}

function flashInjector() {
  if (!injectorBox) return;
  injectorBox.style.fill = "#ffccbc";
  setTimeout(() => injectorBox.style.fill = "#f5f5f5", 600);
}

/* CONTROLS */
flowInput.oninput = () => {
  flowRate = Number(flowInput.value);
  flowVal.textContent = flowRate.toFixed(1);
  rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;
};

organicInput.oninput = () => {
  organicPercent = Number(organicInput.value);
  organicVal.textContent = `${organicPercent}%`;
  rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;
};

compoundSelect.onchange = () => {
  hydrophobicity = Number(compoundSelect.value);
  rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;
};

pumpBtn.onclick = () => {
  const running = pumpBtn.textContent.includes("STOP");
  pumpBtn.textContent = running ? "Pump START" : "Pump STOP";
  injectBtn.disabled = running;
  statusEl.textContent = running ? "Status: IDLE" : "Status: MOBILE PHASE RUNNING";
  running ? stopRun() : startRun();
};

injectBtn.onclick = () => {
  statusEl.textContent = "Status: SAMPLE INJECTED";
  injectSample();
};

/* WAIT FOR SVG */
setTimeout(() => {
  flowDot = document.getElementById("flowDot");
  injectorBox = document.getElementById("injectorBox");
}, 500);

/* START */
initGraph();
rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;