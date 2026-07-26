/**
 * ReportCard.js - Visual Method Result Report Cards Component with Star Rating & Next Tip
 */
export class ReportCardComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  getStarRating(score) {
    if (score >= 95) return "⭐⭐⭐⭐⭐ (Excellent)";
    if (score >= 85) return "⭐⭐⭐⭐☆ (Good)";
    if (score >= 70) return "⭐⭐⭐☆☆ (Acceptable)";
    if (score >= 50) return "⭐⭐☆☆☆ (Needs Improvement)";
    return "⭐☆☆☆☆ (Failed)";
  }

  getNextTip(bottleneck, score) {
    if (score >= 95) return "Method fully optimized! Great job.";
    if (!bottleneck) return "Fine-tune mobile phase %B or flow rate to increase resolution.";

    switch (bottleneck.bottleneck) {
      case "PRESSURE_HIGH":
        return "Increase Column Temperature to 40°C–50°C to lower viscosity before reducing flow rate.";
      case "RESOLUTION_LOW":
        return "Lower Mobile Phase %B by 5%–10% to increase solute retention & resolution.";
      case "RUN_TIME_LONG":
        return "Increase Mobile Phase %B or Flow Rate slightly to shorten total run time.";
      default:
        return "Adjust method parameters to balance system pressure vs peak resolution.";
    }
  }

  render(runResult, exerciseProfile) {
    if (!this.container) return;
    if (!runResult || !runResult.exerciseScore) {
      this.container.innerHTML = "";
      return;
    }

    const { score, criteriaResults } = runResult.exerciseScore;
    const bottleneck = runResult.bottleneckAnalysis;

    const isOptimized = score >= 90;
    const badgeColor = isOptimized ? "#2e7d32" : (score >= 70 ? "#f57f17" : "#c62828");
    const badgeIcon = isOptimized ? "🟢 PASS" : "🔴 ACTION REQUIRED";
    const stars = this.getStarRating(score);
    const nextTip = this.getNextTip(bottleneck, score);

    let criteriaHTML = "";
    if (criteriaResults) {
      criteriaResults.forEach(c => {
        const icon = c.passed ? "✅" : "❌";
        criteriaHTML += `<div style="font-size:0.85rem; margin:2px 0;">${icon} <strong>${c.name}</strong>: ${c.value} (Target: ${c.target})</div>`;
      });
    }

    this.container.innerHTML = `
      <div style="background: #f9f9f9; border:1px solid #e0e0e0; border-radius:10px; padding:16px; margin-top:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
          <h4 style="margin:0; color:#1565c0;">Method Evaluation Report</h4>
          <span style="background:${badgeColor}; color:#fff; padding:4px 10px; border-radius:20px; font-size:0.8rem; font-weight:bold;">${badgeIcon}</span>
        </div>
        <div style="margin: 8px 0; font-size: 0.95rem; font-weight: 600; color: #333;">Rating: ${stars}</div>
        <div style="margin-top:8px;">${criteriaHTML}</div>

        <div style="background:#e8f5e9; border-left:4px solid #2e7d32; padding:10px 12px; margin-top:12px; border-radius:4px; font-size:0.85rem;">
          <strong>💡 Next Tip:</strong> ${nextTip}
        </div>
      </div>
    `;
  }
}
