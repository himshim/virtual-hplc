let chart;
let time = 0;
let timer = null;
let injecting = false;
let injectionTime = null;

const MAX_TIME = 10; // minutes

export function initRealtimeGraph() {
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
        x: {
          type: "linear",
          min: 0,
          max: MAX_TIME,
          title: { display: true, text: "Time (min)" }
        },
        y: {
          min: -0.2,
          max: 2.5,
          title: { display: true, text: "Response (AU)" }
        }
      }
    }
  });
}

export function startBaseline() {
  stopGraph();
  resetGraph();

  timer = setInterval(() => {
    time += 0.05;

    const noise = (Math.random() - 0.5) * 0.02;
    addPoint(time, noise);

    if (time >= MAX_TIME) stopGraph();
  }, 100);
}

export function injectSample(estimatedRT) {
  injecting = true;
  injectionTime = time + 0.5; // injector → column delay

  setTimeout(() => {
    addPeak(injectionTime + estimatedRT);
  }, 100);
}

function addPeak(rt) {
  for (let t = rt - 0.3; t <= rt + 0.3; t += 0.02) {
    const height = Math.exp(-Math.pow(t - rt, 2) / 0.01);
    addPoint(t, height);
  }
}

function addPoint(x, y) {
  chart.data.datasets[0].data.push({ x, y });
  chart.update("none");
}

export function stopGraph() {
  if (timer) clearInterval(timer);
}

export function resetGraph() {
  time = 0;
  chart.data.datasets[0].data = [];
  chart.update();
}