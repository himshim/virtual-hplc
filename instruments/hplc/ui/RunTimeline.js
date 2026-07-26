/**
 * RunTimeline.js — P7 Live Acquisition Phase Timeline
 *
 * Shows students where they are in the chromatographic workflow.
 * Mirrors the acquisition queue concept from commercial CDS software.
 */
export class RunTimeline {
  constructor(containerId = 'run-timeline-container') {
    this.containerId = containerId;
    this.phases = [
      { id: 'prime',       label: 'Prime',       icon: '💧' },
      { id: 'equilibrate', label: 'Equilibrate', icon: '⚖️' },
      { id: 'inject',      label: 'Inject',      icon: '💉' },
      { id: 'separation',  label: 'Separation',  icon: '📈' },
      { id: 'wash',        label: 'Wash',        icon: '🧹' },
      { id: 'complete',    label: 'Complete',    icon: '✅' }
    ];
    this.currentPhase = null;
  }

  _phaseIndex(phaseId) {
    return this.phases.findIndex(p => p.id === phaseId);
  }

  setPhase(phaseId) {
    this.currentPhase = phaseId;
    this.render();
  }

  render() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    const currentIdx = this._phaseIndex(this.currentPhase);

    el.innerHTML = `
      <div style="
        background: #0f172a; border-radius: 10px;
        border: 1px solid rgba(56,189,248,0.15);
        padding: 12px 14px; margin-bottom: 10px;
      ">
        <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: #475569; margin-bottom: 10px; font-family: 'JetBrains Mono', monospace;">
          Method Timeline
        </div>
        <div style="display: flex; align-items: center; gap: 0; overflow-x: auto; scrollbar-width: none;">
          ${this.phases.map((phase, i) => {
            const isDone    = currentIdx > i;
            const isActive  = currentIdx === i;
            const isPending = currentIdx < i;
            const isLast    = i === this.phases.length - 1;

            const dotColor  = isDone ? '#22c55e' : isActive ? '#38bdf8' : '#1e293b';
            const dotBorder = isDone ? '#22c55e' : isActive ? '#38bdf8' : '#334155';
            const textColor = isDone ? '#22c55e' : isActive ? '#f1f5f9' : '#475569';
            const prefix    = isDone ? '✓' : isActive ? '▶' : '○';

            return `
              <div style="display: flex; align-items: center; flex-shrink: 0;">
                <div style="text-align: center; min-width: 72px;">
                  <div style="
                    width: 28px; height: 28px; border-radius: 50%;
                    background: ${dotColor}22; border: 2px solid ${dotBorder};
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 4px auto; font-size: 0.7rem; color: ${dotColor};
                    transition: all 200ms ease;
                  ">${prefix}</div>
                  <div style="font-size: 0.65rem; color: ${textColor}; font-weight: ${isActive ? '700' : '500'}; white-space: nowrap; font-family: 'JetBrains Mono', monospace;">
                    ${phase.icon} ${phase.label}
                  </div>
                </div>
                ${!isLast ? `<div style="width: 20px; height: 2px; background: ${isDone ? '#22c55e44' : '#1e293b'}; flex-shrink: 0; margin: 0 2px;"></div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  reset() {
    this.currentPhase = null;
    this.render();
  }
}
