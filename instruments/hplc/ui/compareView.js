/**
 * compareView.js - Side-by-Side Method Comparison Table View (Method A vs Method B)
 */
export class CompareView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(methodComparison) {
    if (!this.container) return;

    if (!methodComparison || !methodComparison.trends) {
      this.container.innerHTML = '';
      return;
    }

    const mA = methodComparison.methodA;
    const mB = methodComparison.methodB;
    const t = methodComparison.trends;

    const pA = mA.methodParams;
    const pB = mB.methodParams;

    let html = `
      <div style="margin-top:20px; padding:16px; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <h3 style="margin-top:0; color:#1565c0;">⚡ Method Comparison (Method A vs Method B)</h3>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
            <thead>
              <tr style="border-bottom:2px solid #ddd; background:#f5f5f5;">
                <th style="padding:8px;">Parameter / Metric</th>
                <th style="padding:8px;">Method A (Previous Run)</th>
                <th style="padding:8px;">Method B (Current Run)</th>
                <th style="padding:8px;">Optimization Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px; font-weight:600;">Flow Rate</td>
                <td style="padding:8px;">${pA.flowRate} mL/min</td>
                <td style="padding:8px;">${pB.flowRate} mL/min</td>
                <td style="padding:8px;">${t.flowDelta !== 0 ? `${t.flowDelta > 0 ? '+' : ''}${t.flowDelta.toFixed(1)} mL/min` : '⚪ Unchanged'}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px; font-weight:600;">Mobile Phase %B</td>
                <td style="padding:8px;">${pA.organicPercent}%</td>
                <td style="padding:8px;">${pB.organicPercent}%</td>
                <td style="padding:8px;">${t.organicDelta !== 0 ? `${t.organicDelta > 0 ? '+' : ''}${t.organicDelta}%` : '⚪ Unchanged'}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px; font-weight:600;">Column Temperature</td>
                <td style="padding:8px;">${pA.temperature || 25}°C</td>
                <td style="padding:8px;">${pB.temperature || 25}°C</td>
                <td style="padding:8px;">${t.tempDelta !== 0 ? `${t.tempDelta > 0 ? '+' : ''}${t.tempDelta}°C` : '⚪ Unchanged'}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px; font-weight:600;">System Pressure</td>
                <td style="padding:8px;">${Math.round(mA.maxPressure)} bar</td>
                <td style="padding:8px;">${Math.round(mB.maxPressure)} bar</td>
                <td style="padding:8px;">${t.pressureTrend.text}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px; font-weight:600;">Run Time</td>
                <td style="padding:8px;">${mA.elapsedTime.toFixed(1)} min</td>
                <td style="padding:8px;">${mB.elapsedTime.toFixed(1)} min</td>
                <td style="padding:8px;">${t.timeTrend.text}</td>
              </tr>
              <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px; font-weight:600;">Min Peak Resolution (Rs)</td>
                <td style="padding:8px;">${methodComparison.getMinResolution(mA) !== null ? methodComparison.getMinResolution(mA).toFixed(2) : '—'}</td>
                <td style="padding:8px;">${methodComparison.getMinResolution(mB) !== null ? methodComparison.getMinResolution(mB).toFixed(2) : '—'}</td>
                <td style="padding:8px;">${t.resolutionTrend.text}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }
}
