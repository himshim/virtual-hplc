export function generateHPLCFrame(state) {
  const t = state.runtime.time;

  let signal = Math.random() * 0.02; // baseline noise

  const baseRT = 2.0;
  const flow = state.flow;
  const strength = state.mobilePhase.strength;
  const colFactor = state.column.factor;
  const eff = state.column.efficiency;

  state.sample.components.forEach(comp => {
    const rt =
      baseRT +
      (comp.hydrophobicity * colFactor) /
      (strength * flow);

    const width = 0.15 / eff;

    signal +=
      comp.response *
      Math.exp(-Math.pow(t - rt, 2) / width);
  });

  return { x: t, y: signal };
}