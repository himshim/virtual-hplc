import { formatResolutionTrend, formatPressureTrend, formatTimeTrend } from '../utils/delta.js';

/**
 * MethodComparison.js - Side-by-Side Method Comparison Container (Method A vs Method B)
 */
export class MethodComparison {
  constructor(methodPrev, methodCurr) {
    this.methodA = methodPrev; // RunResult for Method A
    this.methodB = methodCurr; // RunResult for Method B

    this.trends = this.computeTrends();
  }

  computeTrends() {
    if (!this.methodA || !this.methodB) return null;

    const prevParams = this.methodA.methodParams;
    const currParams = this.methodB.methodParams;

    const prevMinRs = this.getMinResolution(this.methodA);
    const currMinRs = this.getMinResolution(this.methodB);

    return {
      flowDelta: currParams.flowRate - prevParams.flowRate,
      organicDelta: currParams.organicPercent - prevParams.organicPercent,
      tempDelta: (currParams.temperature || 25) - (prevParams.temperature || 25),
      pressureTrend: formatPressureTrend(this.methodB.maxPressure, this.methodA.maxPressure),
      timeTrend: formatTimeTrend(this.methodB.elapsedTime, this.methodA.elapsedTime),
      resolutionTrend: formatResolutionTrend(currMinRs, prevMinRs)
    };
  }

  getMinResolution(runResult) {
    if (!runResult || !runResult.peaks || runResult.peaks.length <= 1) return null;
    const validRs = runResult.peaks.filter(p => p.resolution !== null).map(p => p.resolution);
    return validRs.length > 0 ? Math.min(...validRs) : null;
  }
}
