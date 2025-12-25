import { samples } from "./samples.js";

export const HPLC_STATES = {
  IDLE: "IDLE",
  EQUILIBRATING: "EQUILIBRATING",
  READY: "READY",
  RUNNING: "RUNNING",
  COMPLETE: "COMPLETE",
  ERROR: "ERROR"
};

export const hplcState = {
  systemState: HPLC_STATES.IDLE,

  pumpOn: false,
  flow: 1.0,
  injected: false,

  column: {
    type: "C18",
    length: 150,
    particleSize: 5,
    factor: 1.0,
    resistance: 1.2,
    efficiency: 1.0
  },

  mobilePhase: {
    solventA: { name: "Water", percent: 60, viscosity: 1.0 },
    solventB: { name: "Acetonitrile", percent: 40, viscosity: 0.4 },
    strength: 0.6,
    viscosity: 0.76
  },

  sample: samples.mixture_pc,

  pressure: 0,
  maxPressure: 400,
  warning: false,

  equilibration: {
    required: true,
    timeLeft: 0
  },

  runtime: {
    time: 0,
    duration: 12
  }
};