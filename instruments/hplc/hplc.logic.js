import { renderGraph } from "../../graph/graphEngine.js";
import { generateHPLCFrame } from "./hplc.dataGenerator.js";
import { HPLC_STATES } from "./hplc.state.js";

let graphTimer = null;
let liveData = [];

/* ================================
   GRAPH INITIALIZATION (CRITICAL)
   ================================ */
export function initGraph() {
  liveData = [{ x: 0, y: 0 }];
  renderGraph("graphCanvas", liveData, "HPLC Chromatogram");
}

/* ================================
   BASELINE MODE
   ================================ */
export function startBaseline(state) {
  stopGraph();

  liveData = [];
  state.runtime.time = 0;

  graphTimer = setInterval(() => {
    state.runtime.time += 0.1;

    const baseline =
      (Math.random() - 0.5) *
      0.02 *
      state.detector.sensitivity;

    liveData.push({
      x: state.runtime.time,
      y: baseline
    });

    renderGraph("graphCanvas", liveData, "HPLC Chromatogram");
  }, 100);
}

/* ================================
   SAMPLE INJECTION RUN
   ================================ */
export function injectAndRun(state) {
  stopGraph();

  liveData = [];
  state.runtime.time = 0;
  state.systemState = HPLC_STATES.RUNNING;

  graphTimer = setInterval(() => {
    state.runtime.time += 0.1;

    const frame = generateHPLCFrame(state);
    liveData.push(frame);

    renderGraph("graphCanvas", liveData, "HPLC Chromatogram");

    if (state.runtime.time >= state.runtime.duration) {
      stopGraph();
      state.systemState = HPLC_STATES.COMPLETE;
    }
  }, 100);
}

/* ================================
   STOP GRAPH
   ================================ */
export function stopGraph() {
  if (graphTimer) {
    clearInterval(graphTimer);
    graphTimer = null;
  }
}