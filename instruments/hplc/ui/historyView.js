/**
 * historyView.js - Timeline View of Session Run History (Method 1 -> Method 2 -> ...)
 */
export class HistoryView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(methodHistory) {
    if (!this.container) return;

    if (!methodHistory || methodHistory.length <= 1) {
      this.container.innerHTML = '';
      return;
    }

    let html = `
      <div style="margin-top:20px; padding:16px; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <h3 style="margin-top:0; color:#1565c0;">📜 Session Method History (${methodHistory.length} Runs)</h3>
        <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;">
    `;

    methodHistory.forEach((run, index) => {
      const p = run.methodParams;
      const score = run.exerciseScore ? run.exerciseScore.score : 0;
      const isOptimal = score === 100;

      html += `
        <div style="min-width:180px; padding:10px; background:${isOptimal ? '#f1f8e9' : '#fafafa'}; border:1px solid ${isOptimal ? '#aed581' : '#e0e0e0'}; border-radius:6px; font-size:0.8rem;">
          <div style="font-weight:bold; color:#1565c0; margin-bottom:4px;">Method ${index + 1}</div>
          <div>Flow: ${p.flowRate} mL/min</div>
          <div>%B: ${p.organicPercent}% | Temp: ${p.temperature || 25}°C</div>
          <div style="margin-top:4px;">Press: ${Math.round(run.maxPressure)} bar</div>
          <div>Time: ${run.elapsedTime.toFixed(1)} min</div>
          <div style="margin-top:4px; font-weight:600; color:${isOptimal ? '#2e7d32' : '#e65100'};">
            Score: ${score}%
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }
}
