import { hplcState } from "./hplc.state.js";

let flowInterval;
let sampleInterval;

const path = document.getElementById("flowPath");
const flowDot = document.getElementById("flowDot");
const sampleDot = document.getElementById("sampleDot");

const pathLength = path.getTotalLength();

function moveDot(dot, speed, loop = true) {
  let pos = 0;
  dot.style.opacity = 1;

  return setInterval(() => {
    pos += speed;
    if (pos > pathLength) {
      if (loop) pos = 0;
      else {
        dot.style.opacity = 0;
        clearInterval(sampleInterval);
      }
    }
    const p = path.getPointAtLength(pos);
    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);
  }, 30);
}

export function startFlowAnimation() {
  stopFlowAnimation();
  flowInterval = moveDot(flowDot, hplcState.flow * 2);
}

export function stopFlowAnimation() {
  if (flowInterval) clearInterval(flowInterval);
  flowDot.style.opacity = 0;
}

export function injectSampleAnimation() {
  sampleInterval = moveDot(sampleDot, hplcState.flow * 1.5, false);
}