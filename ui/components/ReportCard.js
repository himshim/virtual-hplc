/**
 * ReportCard.js - Score-First Decision Report Card Component (P4)
 * Method Quality Score, Delta Progress, Status Pills, Next Tip, Primary CTA.
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

    // Retrieve previous run for delta progress calculation
    const sessionHistory = JSON.parse(localStorage.getItem("hplc_session_history") || "[]");
    let progressDeltaHtml = '<span style="font-size:0.8rem; color:var(--text-muted);">First Run Baseline</span>';
    
    if (sessionHistory.length > 0) {
      const lastRun = sessionHistory[sessionHistory.length - 1];
      const delta = score - (lastRun.score || 0);
      if (delta > 0) {
        progressDeltaHtml = `<span style="font-size:0.85rem; font-weight:700; color:var(--brand-success);">📈 +${delta}% since previous run</span>`;
      } else if (delta < 0) {
        progressDeltaHtml = `<span style="font-size:0.85rem; font-weight:700; color:var(--brand-danger);">📉 ${delta}% since previous run</span>`;
      } else {
        progressDeltaHtml = `<span style="font-size:0.85rem; font-weight:700; color:var(--text-secondary);">➡️ Same score as previous run</span>`;
      }
    }

    // Save current run score into session history
    sessionHistory.push({
      timestamp: new Date().toLocaleTimeString(),
      sampleName: runResult.sampleName,
      score: score,
      flowRate: runResult.methodParams.flowRate,
      organicPercent: runResult.methodParams.organicPercent
    });
    localStorage.setItem("hplc_session_history", JSON.stringify(sessionHistory.slice(-10))); // Max 10 recent

    // Find Best Run in session
    const bestRun = sessionHistory.reduce((max, r) => r.score > max.score ? r : max, sessionHistory[0]);

    const isOptimized = score >= 85;
    const badgeColor = isOptimized ? "#16a34a" : (score >= 70 ? "#d97706" : "#dc2626");
    const badgeIcon = isOptimized ? "🟢 PASS" : "🔴 ACTION REQUIRED";
    const stars = this.getStarRating(score);
    const nextTip = this.getNextTip(bottleneck, score);

    // Dynamic Summary Pills
    const pressureSafe = runResult.maxPressure < 350;
    const resGood = !bottleneck || bottleneck.bottleneck !== "RESOLUTION_LOW";
    const runFast = !bottleneck || bottleneck.bottleneck !== "RUN_TIME_LONG";

    this.container.innerHTML = `
      <div class="instrument-card" style="background:var(--bg-surface); border:1px solid var(--border-subtle); padding:20px;">
        <!-- Header & Pass/Fail Badge -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <h3 style="margin:0; font-size:1.1rem; color:var(--brand-primary);">Method Quality Report (${runResult.sampleName})</h3>
            <div style="margin-top:4px;">${progressDeltaHtml}</div>
          </div>
          <span style="background:${badgeColor}; color:#fff; padding:5px 14px; border-radius:var(--radius-full); font-size:0.8rem; font-weight:700;">
            ${badgeIcon}
          </span>
        </div>

        <!-- Big Score & Star Rating -->
        <div style="margin:16px 0; padding:14px; background:#f0f9ff; border-radius:var(--radius-md); border:1px solid #bae6fd; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div>
            <div style="font-size:0.8rem; text-transform:uppercase; font-weight:700; color:#0369a1;">Overall Score</div>
            <div style="font-size:2.2rem; font-weight:800; color:#0284c7; line-height:1.1;">${score}%</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.95rem; font-weight:700; color:#334155;">${stars}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:2px;">Target Criteria: ${exerciseProfile ? exerciseProfile.name : 'QC Assay'}</div>
          </div>
        </div>

        <!-- Decision Summary Status Pills -->
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
          <span class="tag-badge" style="background:${pressureSafe ? '#dcfce7' : '#fee2e2'}; color:${pressureSafe ? '#15803d' : '#991b1b'};">
            ${pressureSafe ? '🟢 Pressure Safe' : '⚠️ High Pressure'}
          </span>
          <span class="tag-badge" style="background:${resGood ? '#dcfce7' : '#fef3c7'}; color:${resGood ? '#15803d' : '#92400e'};">
            ${resGood ? '🟢 Resolution Good' : '⚠️ Peak Overlap'}
          </span>
          <span class="tag-badge" style="background:${runFast ? '#dcfce7' : '#f1f5f9'}; color:${runFast ? '#15803d' : '#475569'};">
            ${runFast ? '🟢 Run Time Fast' : '⏱️ Long Run Time'}
          </span>
        </div>

        <!-- Actionable Educational Tip Box -->
        <div style="background:#fff8e1; border-left:4px solid #ffa000; padding:12px 14px; border-radius:var(--radius-sm); font-size:0.88rem; color:#451a03; margin-bottom:16px;">
          <strong>💡 Actionable Optimization Tip:</strong> ${nextTip}
        </div>

        <!-- Session Comparison Bar -->
        <div style="padding:10px 14px; background:var(--bg-app); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:0.82rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
          <div>🏆 <strong>Session Best:</strong> Run ${sessionHistory.indexOf(bestRun) + 1} (${bestRun.score}%)</div>
          <div>⏱️ <strong>Current:</strong> Run ${sessionHistory.length} (${score}%)</div>
        </div>

        <!-- Primary & Secondary Action CTAs -->
        <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
          <button id="compareRunsBtn" style="flex:1; background:var(--brand-primary); color:white; font-size:0.9rem; margin-bottom:0;">
            📊 Compare Runs
          </button>
          <button id="exportReportBtn" style="background:var(--bg-app); border:1px solid var(--border-strong); color:var(--text-primary); font-size:0.85rem; margin-bottom:0;">
            📄 Export Summary
          </button>
        </div>
      </div>
    `;

    // Bind Compare Runs CTA
    const compareBtn = document.getElementById("compareRunsBtn");
    if (compareBtn) {
      compareBtn.onclick = () => {
        const historySection = document.getElementById("historyContainer");
        if (historySection) historySection.scrollIntoView({ behavior: 'smooth' });
      };
    }

    // Bind Export Summary CTA
    const exportBtn = document.getElementById("exportReportBtn");
    if (exportBtn) {
      exportBtn.onclick = () => {
        window.print();
      };
    }
  }
}
