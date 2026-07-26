/**
 * EducationalNarrator.js — P10 Real-Time Chromatographic Tutor
 *
 * Transforms parameter changes and run results into plain-language
 * explanations with confidence indicators and linked theory.
 *
 * Design: students read WHY something happened, not just WHAT changed.
 * Each narrative follows: Observation → Physics → Prediction → Confidence
 */

const CONFIDENCE = {
  CERTAIN:   { label: 'Certain',    color: '#22c55e', bars: 3 },
  LIKELY:    { label: 'Likely',     color: '#38bdf8', bars: 2 },
  MODERATE:  { label: 'Moderate',   color: '#fbbf24', bars: 2 },
  VARIABLE:  { label: 'Variable',   color: '#f59e0b', bars: 1 },
  UNCERTAIN: { label: 'Uncertain',  color: '#94a3b8', bars: 1 }
};

export class EducationalNarrator {
  constructor(containerId = 'edu-narrator-panel') {
    this.containerId = containerId;
    this._messages = [];
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /** Called when a method parameter changes */
  onParameterChange(paramId, oldVal, newVal) {
    const messages = this._generateParamNarrative(paramId, oldVal, newVal);
    this._messages = messages;
    this._render();
  }

  /** Called after run completes with peak data */
  onRunCompleted(runResult) {
    const messages = this._generateRunNarrative(runResult);
    this._messages = messages;
    this._render();
  }

  /** Called when a fault is injected */
  onFaultInjected(faultType) {
    this._messages = this._generateFaultNarrative(faultType);
    this._render();
  }

  clear() {
    this._messages = [];
    this._render();
  }

  /* ── Narrative Generators ────────────────────────────────────────────────── */

  _generateParamNarrative(paramId, oldVal, newVal) {
    const delta = newVal - oldVal;
    const sign  = delta > 0 ? 'increased' : 'decreased';
    const up    = delta > 0;

    const narratives = {
      flowRate: [
        {
          heading: `Flow rate ${sign} (${oldVal.toFixed(2)} → ${newVal.toFixed(2)} mL/min)`,
          body: `Higher flow rate reduces the time analytes spend in the column. Each compound elutes earlier because mobile phase carries them through faster, reducing the retention factor k'.`,
          predictions: [
            { label: 'Retention time',  arrow: up ? '↓' : '↑', conf: CONFIDENCE.CERTAIN  },
            { label: 'Back-pressure',   arrow: up ? '↑' : '↓', conf: CONFIDENCE.CERTAIN  },
            { label: 'Peak width',      arrow: up ? '↓' : '↑', conf: CONFIDENCE.LIKELY   },
            { label: 'Resolution Rs',   arrow: '?',             conf: CONFIDENCE.VARIABLE, note: 'Depends on selectivity at new flow. Efficiency (N) may drop if above optimal Van Deemter velocity.' }
          ],
          equation: 'Van Deemter: H = A + B/u + C·u',
          equationNote: 'At high flow (u), C-term dominates → H rises → N falls → Rs may drop'
        }
      ],
      organicPercent: [
        {
          heading: `Mobile phase %B ${sign} (${oldVal.toFixed(0)}% → ${newVal.toFixed(0)}%)`,
          body: `In reversed-phase HPLC, increasing organic modifier (acetonitrile/MeOH) weakens analyte retention. The linear solvent strength (LSS) model predicts log k decreases linearly with φ.`,
          predictions: [
            { label: 'Retention time',    arrow: up ? '↓' : '↑', conf: CONFIDENCE.CERTAIN  },
            { label: 'Peak spacing (α)',   arrow: '?',             conf: CONFIDENCE.VARIABLE, note: 'Selectivity changes depend on analyte polarity differences — may improve or worsen separation.' },
            { label: 'Resolution Rs',      arrow: '?',             conf: CONFIDENCE.UNCERTAIN, note: 'Could improve (more spacing) or worsen (compression into void).' },
            { label: 'Peak width (W½)',    arrow: up ? '↓' : '↑', conf: CONFIDENCE.LIKELY   }
          ],
          equation: 'LSS: log k = log kw − S·φ',
          equationNote: 'S = slope of log k vs. φ (compound-specific). Larger S → greater sensitivity to %B change.'
        }
      ],
      temperature: [
        {
          heading: `Column temperature ${sign} (${oldVal.toFixed(0)}°C → ${newVal.toFixed(0)}°C)`,
          body: `Temperature affects mobile phase viscosity and analyte diffusion. Higher temperature lowers viscosity (reduces pressure) and increases B-term diffusion, sharpening peaks. Retention decreases due to reduced analyte-stationary phase interactions.`,
          predictions: [
            { label: 'Retention time',  arrow: up ? '↓' : '↑', conf: CONFIDENCE.LIKELY   },
            { label: 'Peak width',      arrow: up ? '↓' : '↑', conf: CONFIDENCE.LIKELY   },
            { label: 'Back-pressure',   arrow: up ? '↓' : '↑', conf: CONFIDENCE.CERTAIN  },
            { label: 'Resolution Rs',   arrow: '?',             conf: CONFIDENCE.VARIABLE, note: 'Peak sharpening may improve Rs, but selectivity change depends on analyte chemistry.' }
          ],
          equation: "van 't Hoff: ln k = −ΔH°/(RT) + ΔS°/R",
          equationNote: 'Higher T → smaller k for most analytes. Effect size varies by analyte.'
        }
      ],
      ph: [
        {
          heading: `Mobile phase pH ${sign} (${oldVal.toFixed(1)} → ${newVal.toFixed(1)})`,
          body: `pH controls the ionisation state of acidic/basic analytes. At pH below pKa, weak acids are neutral (hydrophobic, retained). Above pKa they ionise, becoming polar and eluting near the void.`,
          predictions: [
            { label: 'Ionisable analyte retention', arrow: '?', conf: CONFIDENCE.VARIABLE, note: 'Direction depends on compound pKa relative to new pH.' },
            { label: 'Peak shape (Tf)',              arrow: '?', conf: CONFIDENCE.VARIABLE, note: 'Partial ionisation near pKa causes peak splitting or tailing.' }
          ],
          equation: 'Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])',
          equationNote: 'Retention changes sharply within ±1 pH unit of compound pKa.'
        }
      ],
      wavelength: [
        {
          heading: `Detection wavelength changed (${oldVal.toFixed(0)} → ${newVal.toFixed(0)} nm)`,
          body: `UV detector response depends on the molar absorptivity (ε) at the selected wavelength. At the analyte's λmax, sensitivity is maximised. Off-peak wavelengths reduce signal height without changing retention.`,
          predictions: [
            { label: 'Peak height / area', arrow: up > 0 ? '?' : '?', conf: CONFIDENCE.VARIABLE, note: 'Depends on each compound\'s UV spectrum. Run a PDA scan to find λmax.' },
            { label: 'Retention time',     arrow: '—',                  conf: CONFIDENCE.CERTAIN,  note: 'Wavelength has no effect on chromatographic retention.' }
          ],
          equation: 'Beer-Lambert: A = ε·c·l',
          equationNote: 'ε varies strongly with wavelength — aromatics absorb well at 254 nm.'
        }
      ]
    };

    return narratives[paramId] || [];
  }

  _generateRunNarrative(runResult) {
    if (!runResult || !runResult.peaks) return [];
    const peaks = runResult.peaks;
    const sst   = runResult.systemSuitability || {};

    const messages = [];

    // Overall SST
    if (sst.status === 'PASSED') {
      messages.push({
        heading: '✅ Method Passes System Suitability',
        body: `All ${peaks.length} compound${peaks.length !== 1 ? 's' : ''} were detected and peak metrics meet USP suitability criteria. The method is suitable for quantitative analysis.`,
        predictions: [],
        equation: null
      });
    } else if (sst.status === 'FAILED') {
      messages.push({
        heading: '⚠ System Suitability Failure',
        body: `One or more peaks failed USP suitability criteria. Common causes: insufficient plates (N < 2000), poor resolution (Rs < 1.5), or excessive tailing (Tf > 2.0). Adjust mobile phase or flow rate.`,
        predictions: [],
        equation: null
      });
    }

    // Co-elution warning
    const poorRs = peaks.filter(p => p.resolution !== null && p.resolution < 1.5);
    if (poorRs.length > 0) {
      messages.push({
        heading: `⚡ Co-Elution Risk: ${poorRs.map(p => p.compound).join(', ')}`,
        body: `Resolution Rs < 1.5 indicates peaks are incompletely resolved. In quantitative analysis this causes integration errors and inaccurate assay results.`,
        predictions: [
          { label: 'Reduce %B to increase retention spacing', arrow: '→', conf: CONFIDENCE.LIKELY },
          { label: 'Lower flow rate to improve N',            arrow: '→', conf: CONFIDENCE.MODERATE }
        ],
        equation: 'Rs = (tR₂ − tR₁) / (0.5·(W₁ + W₂))',
        equationNote: 'Rs ≥ 1.5 required for baseline resolution (USP)'
      });
    }

    return messages;
  }

  _generateFaultNarrative(faultType) {
    const faults = {
      airbubble: {
        heading: '🫧 Air Bubble Injected',
        body: 'An air bubble in the flow path creates a pressure pulse and a spurious ghost peak in the chromatogram. In practice, this is caused by inadequate degassing of the mobile phase or a loose fitting.',
        predictions: [
          { label: 'Ghost peak at void volume', arrow: '↑', conf: CONFIDENCE.CERTAIN },
          { label: 'Baseline spike',            arrow: '↑', conf: CONFIDENCE.CERTAIN }
        ],
        equation: null
      },
      column_degradation: {
        heading: '📉 Column Degradation Active',
        body: 'Loss of theoretical plates simulates a worn, contaminated, or partially blocked column. Peak efficiency falls, causing broader peaks, increased tailing, and possible co-elution.',
        predictions: [
          { label: 'Plates (N)',     arrow: '↓', conf: CONFIDENCE.CERTAIN },
          { label: 'Peak width',    arrow: '↑', conf: CONFIDENCE.CERTAIN },
          { label: 'Resolution Rs', arrow: '↓', conf: CONFIDENCE.CERTAIN }
        ],
        equation: 'N = 16·(tR/W)² (USP tangent method)',
        equationNote: 'Column degradation increases W → reduces N → reduces Rs'
      }
    };

    const f = faults[faultType];
    return f ? [f] : [];
  }

  /* ── Renderer ────────────────────────────────────────────────────────────── */

  _render() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    if (!this._messages.length) {
      el.innerHTML = '';
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';

    el.innerHTML = this._messages.map((msg, mi) => `
      <div style="
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border: 1px solid rgba(56,189,248,0.2);
        border-radius: 12px; padding: 16px 18px; margin-bottom: 12px;
      ">
        <!-- Header -->
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span style="font-size: 0.65rem; text-transform:uppercase; letter-spacing:0.07em; color:#38bdf8; font-weight:800; font-family:'JetBrains Mono',monospace;">
            🎓 Tutor
          </span>
        </div>

        <div style="font-size:0.9rem; font-weight:700; color:#f1f5f9; margin-bottom:8px;">
          ${msg.heading}
        </div>
        <div style="font-size:0.82rem; color:#94a3b8; line-height:1.6; margin-bottom:${msg.predictions.length ? '12px' : '0'};">
          ${msg.body}
        </div>

        ${msg.predictions.length ? `
          <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:8px; margin-bottom:${msg.equation ? '12px' : '0'};">
            ${msg.predictions.map(pred => this._renderPrediction(pred)).join('')}
          </div>
        ` : ''}

        ${msg.equation ? `
          <div style="
            background: #020810; border:1px solid #1e293b; border-radius:8px;
            padding:10px 12px; font-family:'JetBrains Mono',monospace;
          ">
            <div style="font-size:0.72rem; color:#38bdf8; margin-bottom:4px;">${msg.equation}</div>
            ${msg.equationNote ? `<div style="font-size:0.68rem; color:#475569;">${msg.equationNote}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  _renderPrediction(pred) {
    const conf = pred.conf;
    const bars = '█'.repeat(conf.bars) + '░'.repeat(3 - conf.bars);

    return `
      <div style="
        background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07);
        border-radius:8px; padding:10px 12px; cursor:${pred.note ? 'help' : 'default'};
      " title="${pred.note || ''}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.7rem; color:#64748b;">${pred.label}</span>
          <span style="font-size:1.3rem; font-weight:900; color:${conf.color}; line-height:1;">${pred.arrow}</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:${conf.color}; letter-spacing:2px;">${bars}</span>
          <span style="font-size:0.65rem; color:${conf.color}; font-weight:700;">${conf.label}</span>
        </div>
        ${pred.note ? `<div style="margin-top:5px; font-size:0.62rem; color:#334155; font-style:italic; line-height:1.4;">${pred.note}</div>` : ''}
      </div>
    `;
  }
}
