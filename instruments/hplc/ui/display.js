import { formatTimeMinutes, formatPressure } from '../utils/formatting.js';

/**
 * display.js - Status, Gauge & USP Peak Table UI Component
 */
export class DisplayView {
  constructor() {
    this.statusEl = document.getElementById("status");
    this.pressureMeter = document.getElementById("pressureMeter");
    this.pressureVal = document.getElementById("pressureVal");
    this.pressureWarning = document.getElementById("pressureWarning");
    this.satWarning = document.getElementById("satWarning");
    this.rtDisplay = document.getElementById("rtDisplay");
    this.peakTableContainer = document.getElementById("peakTableContainer");
  }

  setStatus(status) {
    if (this.statusEl) {
      this.statusEl.textContent = status;
      if (status === 'OVERPRESSURE' || status === 'DETECTOR_SATURATION') {
        this.statusEl.className = 'status-badge error';
      } else {
        this.statusEl.className = 'status-badge';
      }
    }
  }

  setPressure(bar) {
    if (this.pressureMeter) this.pressureMeter.value = bar;
    if (this.pressureVal) this.pressureVal.textContent = formatPressure(bar);
  }

  setWarnings(warnings) {
    if (this.satWarning) {
      this.satWarning.style.display = warnings.some(w => w.includes('SATURATED')) ? 'inline-block' : 'none';
    }
    if (this.pressureWarning) {
      this.pressureWarning.style.display = warnings.some(w => w.includes('OVERPRESSURE')) ? 'inline-block' : 'none';
    }
  }

  setTimeDisplay(t) {
    if (this.rtDisplay) {
      this.rtDisplay.textContent = `Elapsed Time: ${formatTimeMinutes(t)}`;
    }
  }

  renderPeakTable(runResult) {
    if (!this.peakTableContainer || !runResult) return;

    if (!runResult.peaks || runResult.peaks.length === 0) {
      this.peakTableContainer.innerHTML = '';
      return;
    }

    const sst = runResult.systemSuitability;
    const isPassed = sst && sst.status !== 'FAILED';
    const badgeBg = isPassed ? '#e8f5e9' : '#ffebee';
    const badgeColor = isPassed ? '#2e7d32' : '#c62828';
    const badgeIcon = isPassed ? '🟢' : '🔴';

    let html = `
      <div style="margin-top:20px; padding:16px; background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        
        <!-- System Suitability Header Badge -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
          <h3 style="margin:0; color:#1565c0;">📊 Pharmacopeial Report (${runResult.sampleName})</h3>
          <span style="background:${badgeBg}; color:${badgeColor}; padding:6px 14px; border-radius:20px; font-weight:bold; font-size:0.85rem;">
            ${badgeIcon} Score: ${sst.score}% — ${sst.methodQuality} (${sst.criteriaUsed})
          </span>
        </div>

        <p style="font-size:0.85rem; color:#666; margin-bottom:12px;">
          Method: Flow ${runResult.methodParams.flowRate} mL/min | Organic %B: ${runResult.methodParams.organicPercent}% | Speed: ${runResult.methodParams.speedMultiplier}x
        </p>

        <!-- Peak Metrics Table -->
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
            <thead>
              <tr style="border-bottom:2px solid #ddd; background:#f5f5f5;">
                <th style="padding:8px;">#</th>
                <th style="padding:8px;">Compound</th>
                <th style="padding:8px;">t<sub>R</sub> (min)</th>
                <th style="padding:8px;">Height (AU)</th>
                <th style="padding:8px;">Calculated k'</th>
                <th style="padding:8px;">Calculated N</th>
                <th style="padding:8px;">Calculated R<sub>s</sub></th>
                <th style="padding:8px;">Calculated α</th>
                <th style="padding:8px;">T<sub>f</sub> (Ideal)</th>
              </tr>
            </thead>
            <tbody>
    `;

    runResult.peaks.forEach((peak, index) => {
      const rsDisplay = peak.resolution !== null ? peak.resolution.toFixed(2) : "—";
      const alphaDisplay = peak.selectivity !== null ? peak.selectivity.toFixed(2) : "—";

      html += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px;">${index + 1}</td>
          <td style="padding:8px; font-weight:600;">${peak.compound}</td>
          <td style="padding:8px;">${peak.tR.toFixed(2)}</td>
          <td style="padding:8px;">${peak.height.toFixed(3)}</td>
          <td style="padding:8px;">${peak.kPrime.toFixed(2)}</td>
          <td style="padding:8px;">${Math.round(peak.plates)}</td>
          <td style="padding:8px; font-weight:${peak.resolution && peak.resolution < 1.5 ? 'bold' : 'normal'}; color:${peak.resolution && peak.resolution < 1.5 ? '#c62828' : 'inherit'};">
            ${rsDisplay}
          </td>
          <td style="padding:8px;">${alphaDisplay}</td>
          <td style="padding:8px;">1.00 (Ideal)</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
    `;

    // Data-Driven Educational Diagnostic Hints
    if (sst.diagnostics && sst.diagnostics.length > 0) {
      html += `
        <div style="margin-top:16px; padding:12px; background:#fff8e1; border-left:4px solid #ffa000; border-radius:4px;">
          <h4 style="margin:0 0 8px 0; color:#b78103;">💡 Educational Optimization Hints</h4>
          <ul style="margin:0; padding-left:20px; font-size:0.85rem; color:#444;">
      `;

      sst.diagnostics.forEach(diag => {
        html += `
          <li style="margin-bottom:6px;">
            <strong>${diag.compound} (${diag.rule})</strong>: ${diag.cause}
            <br><span style="color:#2e7d32;">👉 <em>Recommendation: ${diag.recommendation}</em></span>
          </li>
        `;
      });

      html += `
          </ul>
        </div>
      `;
    }

    html += `</div>`;
    this.peakTableContainer.innerHTML = html;
  }
}
