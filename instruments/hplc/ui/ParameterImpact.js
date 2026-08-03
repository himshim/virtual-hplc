import { EducationalEngine } from '../education/EducationalEngine.js';

export class ParameterImpact {
  constructor(containerId = 'param-impact-panel') {
    this.containerId = containerId;
    this._lastParams = null;
  }

  /**
   * Predict qualitative impact of parameter changes.
   * @param {Object} newParams
   * @param {Object} oldParams
   * @returns {Array<{icon, label, direction, tooltip}>}
   */
  _computeImpacts(newParams, oldParams) {
    return EducationalEngine.computeImpacts(newParams, oldParams);
  }


  update(newParams, oldParams) {
    this._lastParams = { ...newParams };
    const impacts = this._computeImpacts(newParams, oldParams);
    this._render(impacts, newParams, oldParams);
  }

  _render(impacts, newParams, oldParams) {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    if (impacts.length === 0) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';

    // Summarize parameter deltas
    const changes = [];
    if (oldParams) {
      const fDelta = (newParams.flowRate - oldParams.flowRate).toFixed(2);
      const oDelta = (newParams.organicPercent - oldParams.organicPercent).toFixed(1);
      const tDelta = (newParams.temperature - oldParams.temperature).toFixed(1);
      if (Math.abs(fDelta) > 0.05) changes.push(`Flow ${fDelta > 0 ? '+' : ''}${fDelta} mL/min`);
      if (Math.abs(oDelta) > 0.5)  changes.push(`%B ${oDelta > 0 ? '+' : ''}${oDelta}%`);
      if (Math.abs(tDelta) > 0.5)  changes.push(`Temp ${tDelta > 0 ? '+' : ''}${tDelta}°C`);
    }

    el.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border: 1px solid rgba(167,139,250,0.25);
        border-radius: 10px; padding: 12px 14px; margin-bottom: 10px;
      ">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span style="font-size:0.75rem; color:#a78bfa; font-weight:700; font-family:'JetBrains Mono',monospace;">⚡ Parameter Impact Preview</span>
          <span style="font-size:0.65rem; color:#475569; font-style:italic;">before you run</span>
        </div>

        ${changes.length > 0 ? `
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
            ${changes.map(c => `
              <span style="
                background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.3);
                color: #c4b5fd; border-radius: 999px; padding: 2px 8px;
                font-size: 0.65rem; font-family: 'JetBrains Mono', monospace; font-weight: 600;
              ">${c}</span>
            `).join('')}
          </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px;">
          ${impacts.map(imp => `
            <div style="
              background: ${imp.color}0f; border: 1px solid ${imp.color}33;
              border-radius: 8px; padding: 8px 10px; display: flex;
              align-items: center; gap: 8px; cursor: help;
            " title="${imp.tooltip}">
              <span style="font-size: 1.1rem;">${imp.icon}</span>
              <div>
                <div style="font-size: 0.65rem; color: #64748b; font-family:'JetBrains Mono',monospace;">${imp.label}</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: ${imp.color}; line-height: 1.1;">${imp.direction}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 8px; font-size: 0.63rem; color: #334155; font-style: italic;">
          Hover arrows for theoretical explanation. Run the simulation to verify quantitatively.
        </div>
      </div>
    `;
  }

  reset() {
    const el = document.getElementById(this.containerId);
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
    this._lastParams = null;
  }
}
