/**
 * ReportCard.js - Visual Method Result Report Cards Component (Passed, Failed, Why, Fix)
 */
export class ReportCardComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render(runResult, exerciseProfile) {
    if (!this.container) return;
    if (!runResult || !runResult.exerciseScore) {
      this.container.innerHTML = "";
      return;
    }

    const { score, grade, criteriaResults } = runResult.exerciseScore;
    const bottleneck = runResult.bottleneckAnalysis;

    const isOptimized = score >= 90;
    const badgeColor = isOptimized ? "#2e7d32" : (score >= 70 ? "#f57f17" : "#c62828");
    const badgeIcon = isOptimized ? "🟢 PASS" : "🔴 ACTION REQUIRED";

    let criteriaHTML = "";
    if (criteriaResults) {
      criteriaResults.forEach(c => {
        const icon = c.passed ? "✅" : "❌";
        criteriaHTML += `<div style="font-size:0.85rem; margin:2px 0;">${icon} <strong>${c.name}</strong>: ${c.value} (Target: ${c.target})</div>`;
      });
    }

    let fixHTML = "";
    if (bottleneck && bottleneck.recommendations && bottleneck.recommendations.length > 0) {
      const topRec = bottleneck.recommendations[0];
      fixHTML = `
        <div style="background:#fff3e0; border-left:4px solid #ff9800; padding:8px 12px; margin-top:8px; border-radius:4px; font-size:0.85rem;">
          <strong>💡 Why:</strong> ${bottleneck.bottleneck} bottleneck.<br>
          <strong>🛠 Fix:</strong> ${topRec.recommendation}
        </div>
      `;
    }

    this.container.innerHTML = `
      <div style="background: #f9f9f9; border:1px solid #e0e0e0; border-radius:10px; padding:16px; margin-top:16px;">
        <div style="display:flex; justify-size:space-between; align-items:center; flex-wrap:wrap;">
          <h4 style="margin:0; color:#1565c0;">Method Evaluation Report</h4>
          <span style="background:${badgeColor}; color:#fff; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:bold;">${badgeIcon} (${score}%)</span>
        </div>
        <div style="margin-top:10px;">${criteriaHTML}</div>
        ${fixHTML}
      </div>
    `;
  }
}
