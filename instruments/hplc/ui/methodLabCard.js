/**
 * methodLabCard.js - Renders Method Exercise Objectives & Dynamic Ranked Optimization Hints
 */
export class MethodLabCardView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(runResult, exerciseProfile) {
    if (!this.container || !exerciseProfile) return;

    const scoreData = runResult ? runResult.exerciseScore : null;
    const bottleneckData = runResult ? runResult.bottleneckAnalysis : null;

    let html = `
      <div style="margin-top:20px; padding:16px; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
          <h3 style="margin:0; color:#1565c0;">🔬 Method Development Lab — ${exerciseProfile.name}</h3>
          ${scoreData ? `
            <span style="background:${scoreData.score === 100 ? '#e8f5e9' : '#fff3e0'}; color:${scoreData.score === 100 ? '#2e7d32' : '#e65100'}; padding:6px 14px; border-radius:20px; font-weight:bold; font-size:0.85rem;">
              ${scoreData.grade} (${scoreData.score}%)
            </span>
          ` : ''}
        </div>

        <p style="font-size:0.85rem; color:#555; margin-bottom:14px;">${exerciseProfile.description}</p>

        <!-- Objectives Checklist -->
        <h4 style="margin:0 0 8px 0; font-size:0.9rem; color:#333;">Target Method Objectives</h4>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-bottom:16px;">
    `;

    if (scoreData && scoreData.objectives) {
      scoreData.objectives.forEach(obj => {
        const icon = obj.passed ? "🟢" : "🔴";
        const bg = obj.passed ? "#f1f8e9" : "#ffebee";
        const color = obj.passed ? "#33691e" : "#c62828";

        html += `
          <div style="padding:10px; background:${bg}; border-radius:6px; font-size:0.85rem; color:${color}; font-weight:600;">
            ${icon} ${obj.label}<br>
            <span style="font-weight:normal; font-size:0.8rem;">Actual: ${obj.actual}</span>
          </div>
        `;
      });
    } else {
      html += `
        <div style="padding:10px; background:#f5f5f5; border-radius:6px; font-size:0.85rem; color:#666;">
          Inject sample to evaluate method optimization goals.
        </div>
      `;
    }

    html += `</div>`;

    // Dynamic Ranked Optimization Recommendations
    if (bottleneckData && bottleneckData.recommendations && bottleneckData.recommendations.length > 0) {
      html += `
        <div style="padding:12px; background:#e3f2fd; border-left:4px solid #1976d2; border-radius:4px;">
          <h4 style="margin:0 0 8px 0; color:#0d47a1;">🧠 Hierarchical Optimization Troubleshooting</h4>
          <ol style="margin:0; padding-left:20px; font-size:0.85rem; color:#333;">
      `;

      bottleneckData.recommendations.forEach(rec => {
        html += `
          <li style="margin-bottom:8px;">
            <strong>Rank ${rec.rank} — ${rec.parameter} Adjustment:</strong> ${rec.primaryReason}
            <br><span style="color:#555;"><em>${rec.secondaryContributor}</em></span>
            <br><span style="color:#1565c0; font-weight:600;">👉 ${rec.recommendation}</span>
          </li>
        `;
      });

      html += `
          </ol>
        </div>
      `;
    }

    html += `</div>`;
    this.container.innerHTML = html;
  }
}
