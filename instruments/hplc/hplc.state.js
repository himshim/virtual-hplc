export const hplcState = {
  pumpOn: false,
  flow: 1.0,
  injected: false,

  column: {
    factor: 1.0,      // placeholder (used in next steps)
    resistance: 1.2
  },

  mobilePhase: {
    solventA: {
      name: "Water",
      percent: 60,
      viscosity: 1.0
    },
    solventB: {
      name: "Acetonitrile",
      percent: 40,
      viscosity: 0.4
    },
    strength: 0.6,
    viscosity: 0.76
  },

  pressure: 0,
  maxPressure: 400,
  warning: false
};