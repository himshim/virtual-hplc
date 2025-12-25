/* ==================================================
   STABLE REAL-TIME HPLC SIMULATOR
   STEP C: INJECTOR + DEAD VOLUME (VOID TIME)
   ================================================== */

let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

/* --- METHOD PARAMETERS --- */
let flowRate = 1.0;
let organicPercent = 40;
let hydrophobicity = 0.55;

/* --- PHYSICAL CONSTANTS --- */
const VOID_TIME = 1.0;      // t0 (min) – dead volume
const COLUMN_FACTOR = 1.0; // column chemistry

/* --- PEAK STATE --- */
let injecting = false;
let injectionTime = null;
let peakRT = null;
let peakWidth = 0.25;

/* --- DOM --- */
const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const rtDisplay = document.getElementById("rtDisplay");

const flowInput = document.getElementById("flowInput");
const flowVal = document.getElementById("flowVal");
const organicInput = document.getElementById("organicInput");
const organicVal = document.getElementById("organicVal");
const compoundSelect = document.getElementById("compoundSelect");

/* --- DIAGRAM ELEMENTS --- */
let flowDot, injectorBox;

/* -------- INIT GRAPH -------- */
function initGraph() {
  const ctx = document.getElementById("graphCanvas").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: "HPLC Chromatogram",
        data: [],
        borderColor: "#1565c0",
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        x: { type: "linear", min: 0, max: MAX_TIME, title: { display: true, text: "Time (min)" } },
        y: { min: -0.1, max: 1.5, title: { display: true, text: "Response (AU)" } }
      }
    }
  });
}

/* -------- RT CALCULATION -------- */
function calculateRT() {
  const elutionStrength = 0.3 + (organicPercent / 100) * 0.7;

  const retention =
    (hydrophobicity * COLUMN_FACTOR) /
    (flowRate * elutionStrength);

  return VOID_TIME + retention;
}

/* -------- RUN LOOP -------- */
function startRun() {
  stopRun();
  resetGraph();
  animateFlow(true);

  timer = setInterval(() => {
    time += 0.05;

    /* Baseline noise */
    let signal = (Math.random() - 0.5) * 0.02;

    /* Peak cannot appear before VOID_TIME */
    if (
      injecting &&
      injectionTime !== null &&
      time >= injectionTime &&
      peakRT !== null
    ) {
      const peak =
        Math.exp(
          -Math.pow(time - peakRT, 2) /
          (2 * Math.pow(peakWidth, 2))
        );
      signal += peak;
    }

    chart.data.datasets[0].data.push({ x: time, y: signal });
    chart.update("none");

    if (time >= MAX_TIME) stopRun();
  }, 100);
}

/* -------- INJECT SAMPLE -------- */
function injectSample() {
  resetGraph();
  injecting = true;

  /* Injection happens NOW (injector event) */
  injectionTime = VOID_TIME;
  peakRT = calculateRT();

  rtDisplay.textContent =
    `Estimated RT: ${peakRT.toFixed(2)} min (t₀ = ${VOID_TIME} min)`;

  flashInjector();
  startRun();
}

/* -------- HELPERS -------- */
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

/* -------- DIAGRAM EFFECTS -------- */
function animateFlow(on) {
  if (flowDot) flowDot.style.opacity = on ? 1 : 0;
}

function flashInjector() {
  if (!injectorBox) return;
  injectorBox.style.fill = "#ffccbc";
  setTimeout(() => injectorBox.style.fill = "#f5f5f5", 600);
}

/* -------- CONTROL EVENTS -------- */
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

/* -------- BUTTONS -------- */
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

/* -------- WAIT FOR SVG -------- */
setTimeout(() => {
  flowDot = document.getElementById("flowDot");
  injectorBox = document.getElementById("injectorBox");
}, 500);

/* -------- STARTUP -------- */
initGraph();
rtDisplay.textContent = `Estimated RT: ${calculateRT().toFixed(2)} min`;