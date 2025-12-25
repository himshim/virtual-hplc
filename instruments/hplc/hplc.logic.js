import { renderGraph } from "../../graph/graphEngine.js";
import { generateHPLCFrame } from "./hplc.dataGenerator.js";
import { HPLC_STATES } from "./hplc.state.js";

let graphTimer = null;
let liveData = [];

export function startBaseline(state) {
  stopGraph();

  liveData = [];
  state.runtime.time = 0;

  graphTimer = setInterval(() => {
    state.runtime.time += 0.1;

    // baseline only
    const y =
      (Math.random() - 0.5) *
      0.02 *
      state.detector.sensitivity;

    liveData.push({ x: state.runtime.time, y });
    renderGraph("graphCanvas", liveData, "HPLC Chromatogram");
  }, 100);
}

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

export function stopGraph() {
  if (graphTimer) clearInterval(graphTimer);
}