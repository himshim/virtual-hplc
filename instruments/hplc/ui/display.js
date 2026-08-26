import { formatTimeMinutes, formatPressure } from '../utils/formatting.js';

/**
 * display.js - Status, Gauge & Expandable Peak Metrics Component (P4)
 * Wraps raw peak tables in a decision-first collapsible accordion drawer.
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
      const mode = localStorage.getItem('val_expertise_mode') || 'beginner';
      if (mode === 'beginner' && (status === 'OVERPRESSURE' || status === 'DETECTOR_SATURATION')) {
        this.statusEl.textContent = 'RUN PAUSED';
        this.statusEl.className = 'status-badge warning';
      } else {
        this.statusEl.textContent = status;
        if (status === 'OVERPRESSURE' || status === 'DETECTOR_SATURATION') {
          this.statusEl.className = 'status-badge error';
        } else {
          this.statusEl.className = 'status-badge';
        }
      }
    }
  }

  setPressure(bar) {
    if (this.pressureMeter) this.pressureMeter.value = bar;
    if (this.pressureVal) {
      this.pressureVal.textContent = formatPressure(bar);
      if (bar < 250) {
        this.pressureVal.style.color = '#34d399'; // 🟢 Normal
      } else if (bar < 330) {
        this.pressureVal.style.color = '#facc15'; // 🟡 High
      } else if (bar < 390) {
        this.pressureVal.style.color = '#fb923c'; // 🟠 Near Limit
      } else {
        this.pressureVal.style.color = '#f87171'; // 🔴 Dangerous / Overpressure Warning
      }
    }
  }

  setWarnings(warnings) {
    const mode = localStorage.getItem('val_expertise_mode') || 'beginner';
    if (mode === 'beginner') {
      if (this.satWarning) this.satWarning.style.display = 'none';
      if (this.pressureWarning) this.pressureWarning.style.display = 'none';
      return;
    }

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

    const sst = runResult.systemSuitability || {};
    const isPassed = sst && sst.status !== 'FAILED';

    let html = `
      <div class="instrument-card" style="margin-top:16px; padding:16px;">
        
        <!-- Accordion Toggle Button (Collapsed by Default) -->
        <button id="toggleMetricsAccordionBtn" style="width:100%; background:var(--bg-app); border:1px solid var(--border-subtle); color:var(--text-primary); text-align:left; display:flex; justify-space-between; align-items:center; border-radius:var(--radius-sm); padding:12px 16px; font-weight:600; margin-bottom:0;">
          <span>📊 Raw Peak Metrics & Diagnostic Details</span>
          <span id="accordionArrow">▼</span>
        </button>

        <!-- Collapsible Container (Hidden by default) -->
        <div id="metricsAccordionBody" style="display:none; margin-top:14px;">
          
          <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:10px;">
            Method: Flow ${runResult.methodParams.flowRate} mL/min | Organic %B: ${runResult.methodParams.organicPercent}% | Speed: ${runResult.methodParams.speedMultiplier}x
          </p>

          <!-- Peak Metrics Table -->
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem;">
              <thead>
                <tr style="border-bottom:2px solid var(--border-subtle); background:var(--bg-app);">
                  <th style="padding:8px; text-align:left;">#</th>
                  <th style="padding:8px; text-align:left;">Compound</th>
                  <th style="padding:8px; text-align:right;">t<sub>R</sub> (min)</th>
                  <th style="padding:8px; text-align:right;">Height</th>
                  <th style="padding:8px; text-align:right;">k'</th>
                  <th style="padding:8px; text-align:right;">Plates (N)</th>
                  <th style="padding:8px; text-align:right;">R<sub>s</sub></th>
                  <th style="padding:8px; text-align:right;">α</th>
                  <th style="padding:8px; text-align:right;">T<sub>f</sub></th>
                </tr>
              </thead>
              <tbody class="tabular-nums">
      `;

      runResult.peaks.forEach((peak, index) => {
        const tRVal = (peak.tR !== undefined && peak.tR !== null) ? peak.tR.toFixed(2) : "0.00";
        const heightVal = (peak.height !== undefined && peak.height !== null) ? peak.height.toFixed(3) : "0.000";
        const kVal = (peak.kPrime !== undefined && peak.kPrime !== null) ? peak.kPrime.toFixed(2) : "0.00";
        const platesVal = (peak.plates !== undefined && peak.plates !== null) ? Math.round(peak.plates) : 0;
        const rsDisplay = (peak.resolution !== undefined && peak.resolution !== null) ? peak.resolution.toFixed(2) : "-";
        const alphaDisplay = (peak.selectivity !== undefined && peak.selectivity !== null) ? peak.selectivity.toFixed(2) : "-";

        html += `
          <tr style="border-bottom:1px solid var(--border-subtle);">
            <td style="padding:8px; text-align:left;">${index + 1}</td>
            <td style="padding:8px; text-align:left; font-weight:600;">${peak.compound}</td>
            <td style="padding:8px; text-align:right;">${tRVal}</td>
            <td style="padding:8px; text-align:right;">${heightVal}</td>
            <td style="padding:8px; text-align:right;">${kVal}</td>
            <td style="padding:8px; text-align:right;">${platesVal}</td>
            <td style="padding:8px; text-align:right; font-weight:${peak.resolution && peak.resolution < 1.5 ? 'bold' : 'normal'}; color:${peak.resolution && peak.resolution < 1.5 ? 'var(--brand-danger)' : 'inherit'};">
              ${rsDisplay}
            </td>
            <td style="padding:8px; text-align:right;">${alphaDisplay}</td>
            <td style="padding:8px; text-align:right;">1.00</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
      `;

      // Diagnostic Hints List inside Accordion
      if (sst.diagnostics && sst.diagnostics.length > 0) {
        html += `
          <div style="margin-top:14px; padding:12px; background:var(--status-warning-bg); border-left:4px solid var(--status-warning-border); border-radius:4px;">
            <h4 style="margin:0 0 8px 0; color:var(--status-warning-fg); font-size:0.9rem;">💡 Diagnostic Rule Analysis</h4>
            <ul style="margin:0; padding-left:18px; font-size:0.82rem; color:var(--text-secondary);">
        `;

        sst.diagnostics.forEach(diag => {
          html += `
            <li style="margin-bottom:6px;">
              <strong>${diag.compound} (${diag.rule})</strong>: ${diag.cause}
              <br><span style="color:var(--brand-success);">👉 <em>Recommendation: ${diag.recommendation}</em></span>
            </li>
          `;
        });

        html += `
            </ul>
          </div>
        `;
      }

      html += `
        </div>
      </div>
    `;

    this.peakTableContainer.innerHTML = html;

    // Bind Accordion Toggle Button
    const toggleBtn = document.getElementById("toggleMetricsAccordionBtn");
    const bodyEl = document.getElementById("metricsAccordionBody");
    const arrowEl = document.getElementById("accordionArrow");

    if (toggleBtn && bodyEl) {
      toggleBtn.onclick = () => {
        const isHidden = bodyEl.style.display === "none";
        bodyEl.style.display = isHidden ? "block" : "none";
        if (arrowEl) arrowEl.textContent = isHidden ? "▲" : "▼";
      };
    }
  }
}
