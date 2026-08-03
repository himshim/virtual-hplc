/**
 * RunTimeline.js — CDS Workflow Timeline
 *
 * Positioned above the chromatogram. Shows the full laboratory workflow
 * from pump start through to report, so students understand where they
 * are in the experiment at all times.
 *
 * Phases: prime → equilibrate → inject → separation → integrate → report
 *
 * v2.0: Added integrate + report phases (fire after RUN_COMPLETED).
 *       Added progress-bar fill for the 'separation' (acquire) phase.
 */
export class RunTimeline {
  constructor(containerId = 'run-timeline-container') {
    this.containerId  = containerId;
    this._progress    = 0; // 0–1 for the active acquire phase
    this.phases = [
      { id: 'prime',       label: 'Pump',       abbr: 'Pump'  },
      { id: 'equilibrate', label: 'Equilibrate', abbr: 'Equil' },
      { id: 'inject',      label: 'Inject',      abbr: 'Inject' },
      { id: 'separation',  label: 'Acquire',     abbr: 'Acq'   },
      { id: 'integrate',   label: 'Integrate',   abbr: 'Int'   },
      { id: 'report',      label: 'Report',      abbr: 'Rep'   }
    ];
    this.currentPhase = null;
  }

  _phaseIndex(phaseId) {
    return this.phases.findIndex(p => p.id === phaseId);
  }

  setPhase(phaseId, progress = 0) {
    this.currentPhase = phaseId;
    this._progress    = Math.min(1, Math.max(0, progress));
    this.render();
  }

  /** Update acquisition progress (0–1) without changing phase label */
  setAcquireProgress(fraction) {
    if (this.currentPhase !== 'separation') return;
    this._progress = Math.min(1, Math.max(0, fraction));
    this.render();
  }

  render() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    const currentIdx = this._phaseIndex(this.currentPhase);

    el.innerHTML = `
      <div class="cds-timeline-wrap">
        <div class="cds-timeline-label">Method Timeline</div>
        <div class="cds-timeline-phases">
          ${this.phases.map((phase, i) => {
            const isDone    = currentIdx > i;
            const isActive  = currentIdx === i;
            const isAcquire = phase.id === 'separation';

            const dotCls  = isDone ? 'done' : isActive ? 'active' : 'pending';
            const marker  = isDone ? '✓' : isActive ? '▶' : '○';
            const isLast  = i === this.phases.length - 1;

            const progressBar = (isActive && isAcquire) ? `
              <div class="cds-tl-progress-track">
                <div class="cds-tl-progress-fill" style="width:${(this._progress * 100).toFixed(1)}%"></div>
              </div>` : '';

            return `
              <div class="cds-tl-step">
                <div class="cds-tl-dot ${dotCls}">${marker}</div>
                <div class="cds-tl-name ${dotCls}">${phase.label}</div>
                ${progressBar}
              </div>
              ${!isLast ? `<div class="cds-tl-connector ${isDone ? 'done' : ''}"></div>` : ''}
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  reset() {
    this.currentPhase = null;
    this._progress    = 0;
    this.render();
  }
}
