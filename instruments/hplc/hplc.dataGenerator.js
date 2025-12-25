export function generateHPLCData(state) {
  let data = [];

  const hydrophobicity = 0.55;

  const baseRT = 2.0;
  const rt =
    baseRT +
    (hydrophobicity * state.column.factor) /
    (state.mobilePhase.strength * state.flow);

  const peakWidth =
    0.15 / state.column.efficiency;

  for (let t = 0; t <= 12; t += 0.05) {
    let signal = Math.random() * 0.02;

    signal += Math.exp(
      -Math.pow(t - rt, 2) / peakWidth
    );

    data.push({ x: t, y: signal });
  }

  return data;
}