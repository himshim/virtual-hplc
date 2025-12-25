import { renderGraph } from "../../graph/graphEngine.js";
import { generateHPLCData } from "./hplc.dataGenerator.js";

/* Column chemistry presets */
const columnPresets = {
  C18: { factor: 1.0, resistance: 1.2 },
  C8: { factor: 0.7, resistance: 1.0 },
  Silica: { factor: 1.4, resistance: 1.5 }
};

export function updateColumn(state) {
  const preset = columnPresets[state.column.type];

  state.column.factor = preset.factor *
    (state.column.length / 150);

  state.column.resistance =
    preset.resistance *
    (state.column.length / 150) *
    (5 / state.column.particleSize);

  state.column.efficiency =
    (state.column.length / state.column.particleSize) / 30;
}

export function updateMobilePhase(state) {
  const A = state.mobilePhase.solventA;
  const B = state.mobilePhase.solventB;

  state.mobilePhase.strength =
    0.3 + (B.percent / 100) * 0.7;

  state.mobilePhase.viscosity =
    (A.percent * A.viscosity +
     B.percent * B.viscosity) / 100;
}

export function updatePressure(state) {
  state.pressure =
    state.flow *
    state.column.resistance *
    state.mobilePhase.viscosity *
    100;

  state.warning = state.pressure > state.maxPressure;
}

export function runHPLC(state) {
  if (!state.injected || state.warning) return;

  const data = generateHPLCData(state);

  renderGraph(
    "graphCanvas",
    data,
    "HPLC Chromatogram"
  );

  state.injected = false;
}