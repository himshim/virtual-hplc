/* ===============================
   GUARANTEED-STABLE HPLC GRAPH
   =============================== */

let chart;
let timer = null;
let time = 0;
const MAX_TIME = 10;

const statusEl = document.getElementById("status");
const pumpBtn = document.getElementById("pumpBtn");
const injectBtn = document.getElementById("injectBtn");
const rtDisplay = document.getElementById("rtDisplay");

/* ---------- INIT GRAPH ---------- */
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
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: MAX_TIME,
          title: { display: true, text: "Time (min)" }
        },
        y: {
          min: -0.1,
          max: 1.5,
          title: { display: true, text: "Response (AU)" }
        }
      }
    }
  });
}

/* ---------- BASELINE ---------- */
function startBaseline() {
  stopRun();
  resetGraph();

  timer = setInterval(() => {
    time += 0.05;
    const noise = (Math.random() - 0.5) * 0.02;
    addPoint(time, noise);

    if (time >= MAX_TIME) stopRun();
  }, 100);
}

/* ---------- INJECTION ---------- */
function injectSample() {
  resetGraph();
  const rt = 4.2; // fixed RT for now
  rtDisplay.textContent = `Estimated RT: ${rt.toFixed(2)} min`;

  // baseline first
  startBaseline();

  // injector → column delay
  setTimeout(() => {
    for (let t = rt - 0.3; t <= rt + 0.3; t += 0.02) {
      const height = Math.exp(-Math.pow(t - rt, 2) / 0.01);
      addPoint(t, height);
    }
  }, 600);
}

/* ---------- HELPERS ---------- */
function addPoint(x, y) {
  chart.data.datasets[0].data.push({ x, y });
  chart.update("none");
}

function resetGraph() {
  stopRun();
  time = 0;
  chart.data.datasets[0].data = [];
  chart.update();
}

function stopRun() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

/* ---------- BUTTONS ---------- */
pumpBtn.onclick = () => {
  if (!chart) initGraph();

  const running = pumpBtn.textContent.includes("STOP");

  if (running) {
    pumpBtn.textContent = "Pump START";
    statusEl.textContent = "Status: IDLE";
    injectBtn.disabled = true;
    stopRun();
  } else {
    pumpBtn.textContent = "Pump STOP";
    statusEl.textContent = "Status: MOBILE PHASE RUNNING";
    injectBtn.disabled = false;
    startBaseline();
  }
};

injectBtn.onclick = () => {
  statusEl.textContent = "Status: SAMPLE INJECTED";
  injectSample();
};

/* ---------- START ---------- */
initGraph();