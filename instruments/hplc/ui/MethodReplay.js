/**
 * MethodReplay.js — v1.x Method Replay with Analyte Band Visualization
 *
 * After a run completes, stores the full signal timeline and allows
 * students to scrub back through it with a slider.
 *
 * As the replay head moves:
 *   - Chromatogram progressively redraws up to that time
 *   - Run Timeline phase updates to match elapsed time
 *   - Analyte band position column visualization updates
 *   - Narrator generates time-contextual commentary
 *   - Peak labels appear at the moment each peak is detected
 *
 * Uses only already-recorded data — no re-simulation required.
 */
export class MethodReplay {
  /**
   * @param {Object} options
   * @param {string} options.containerId  – DOM id of the replay strip container
   * @param {Chart}  options.chart        – Chart.js instance from GraphView
   * @param {Function} options.onScrub    – (time, fraction) => void — called on every frame
   * @param {Function} options.onPhase    – (phaseId) => void — called when phase changes
   */
  constructor({ containerId = 'replay-strip', chart, onScrub, onPhase } = {}) {
    this.containerId = containerId;
    this.chart = chart;
    this.onScrub = onScrub || (() => {});
    this.onPhase = onPhase || (() => {});

    this._allPoints = [];   // full [{x, y}] from recorded run
    this._peaks     = [];   // detected peaks with tR
    this._maxT      = 0;
    this._playing   = false;
    this._playRafId = null;
    this._playSpeed = 5;    // replay speed multiplier

    this._render();
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /**
   * Load a completed run for replay.
   * @param {Array<{x,y}>} points  – full signal array
   * @param {Array}        peaks   – detected peaks [{compound, tR, height}]
   */
  loadRun(points, peaks) {
    this._allPoints = points || [];
    this._peaks     = peaks  || [];
    this._maxT      = this._allPoints.length ? this._allPoints[this._allPoints.length - 1].x : 0;
    this._playing   = false;
    cancelAnimationFrame(this._playRafId);

    this._render();
    this._setSliderValue(0);
    this._scrubTo(0);

    const el = document.getElementById(this.containerId);
    if (el) el.style.display = 'block';
  }

  reset() {
    this._allPoints = [];
    this._peaks     = [];
    this._maxT      = 0;
    this._playing   = false;
    cancelAnimationFrame(this._playRafId);
    const el = document.getElementById(this.containerId);
    if (el) el.style.display = 'none';
  }

  /* ── DOM ─────────────────────────────────────────────────────────────────── */

  _render() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    el.innerHTML = `
      <div style="
        background: #0f172a; border: 1px solid rgba(56,189,248,0.2);
        border-radius: 12px; padding: 14px 16px; margin-bottom: 10px;
      " role="region" aria-label="Method Replay Controls">

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.65rem; text-transform:uppercase; letter-spacing:0.08em; color:#38bdf8; font-weight:800; font-family:'JetBrains Mono',monospace;">
              ⏮ Method Replay
            </span>
            <span id="replay-time-label" style="font-size:0.72rem; color:#475569; font-family:'JetBrains Mono',monospace;">
              0.00 min
            </span>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <button id="replay-play-btn" aria-label="Play or pause replay"
              style="background:#1e293b; border:1px solid #334155; color:#f1f5f9; border-radius:8px;
                     padding:5px 12px; font-size:0.8rem; min-height:34px; cursor:pointer;">
              ▶ Play
            </button>
            <select id="replay-speed-select" aria-label="Replay speed"
              style="background:#1e293b; border:1px solid #334155; color:#94a3b8;
                     border-radius:8px; padding:4px 8px; font-size:0.72rem; font-family:'JetBrains Mono',monospace; min-height:34px;">
              <option value="2">2×</option>
              <option value="5" selected>5×</option>
              <option value="10">10×</option>
              <option value="20">20×</option>
            </select>
          </div>
        </div>

        <!-- Timeline scrubber -->
        <div style="position:relative; margin-bottom:14px;">
          <input type="range" id="replay-slider" min="0" max="1000" value="0" step="1"
            aria-label="Replay position"
            style="width:100%; accent-color:#38bdf8; cursor:pointer; min-height:36px;" />
          <!-- Peak tick marks -->
          <div id="replay-peak-ticks" style="position:relative; height:14px; margin-top:2px;"></div>
        </div>

        <!-- Analyte Band Column Visualization -->
        <div id="replay-column-viz" style="display:none; padding:10px 0;"></div>

        <!-- Contextual Narrator commentary -->
        <div id="replay-narrator-line" style="
          font-size:0.78rem; color:#64748b; font-style:italic;
          border-top:1px solid #1e293b; padding-top:8px; margin-top:4px;
          min-height:20px; line-height:1.5;
        " aria-live="polite" aria-atomic="true"></div>
      </div>
    `;

    this._bindReplayControls();
    this._renderPeakTicks();
  }

  _bindReplayControls() {
    const slider    = document.getElementById('replay-slider');
    const playBtn   = document.getElementById('replay-play-btn');
    const speedSel  = document.getElementById('replay-speed-select');

    if (slider) {
      slider.addEventListener('input', () => {
        const frac = parseInt(slider.value) / 1000;
        const t    = frac * this._maxT;
        this._scrubTo(t);
        this._stopPlay();
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this._playing ? this._stopPlay() : this._startPlay();
      });
    }

    if (speedSel) {
      speedSel.addEventListener('change', () => {
        this._playSpeed = parseInt(speedSel.value);
      });
    }
  }

  _renderPeakTicks() {
    const ticksEl = document.getElementById('replay-peak-ticks');
    if (!ticksEl || !this._peaks.length || !this._maxT) return;

    ticksEl.innerHTML = this._peaks.map((peak, i) => {
      const pct = (peak.tR / this._maxT) * 100;
      const colors = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f87171','#fb923c'];
      const col = colors[i % colors.length];
      return `
        <span title="${peak.compound} tR=${peak.tR.toFixed(2)} min" style="
          position:absolute; left:${pct}%; transform:translateX(-50%);
          font-size:0.55rem; color:${col}; font-family:'JetBrains Mono',monospace;
          white-space:nowrap; cursor:default; top:0;
        ">▲</span>
      `;
    }).join('');
  }

  /* ── Scrubbing ───────────────────────────────────────────────────────────── */

  _scrubTo(t) {
    if (!this._allPoints.length) return;

    const clampedT = Math.max(0, Math.min(t, this._maxT));
    const fraction = this._maxT > 0 ? clampedT / this._maxT : 0;

    // Slice signal up to clampedT
    const sliced = this._allPoints.filter(p => p.x <= clampedT);

    // Redraw chart with sliced data (preserve original datasets 1+)
    if (this.chart) {
      this.chart.data.datasets[0].data = sliced;
      this.chart.update('none');
    }

    // Update slider
    this._setSliderValue(fraction * 1000);

    // Update time label
    const timeLabel = document.getElementById('replay-time-label');
    if (timeLabel) timeLabel.textContent = `${clampedT.toFixed(2)} min`;

    // Callback for RunTimeline phase
    let phase = 'prime';
    if (clampedT >= 0.3)  phase = 'equilibrate';
    if (clampedT >= 0.8)  phase = 'inject';
    if (clampedT >= 1.5)  phase = 'separation';
    if (fraction >= 0.98) phase = 'complete';
    this.onPhase(phase);

    // Update column visualization
    this._updateColumnViz(clampedT, fraction);

    // Update narrator commentary
    this._updateNarrator(clampedT, fraction);

    // Callback
    this.onScrub(clampedT, fraction);
  }

  _setSliderValue(val) {
    const slider = document.getElementById('replay-slider');
    if (slider) slider.value = Math.round(val);
  }

  /* ── Playback ────────────────────────────────────────────────────────────── */

  _startPlay() {
    if (this._playing) return;
    this._playing = true;

    const playBtn = document.getElementById('replay-play-btn');
    if (playBtn) playBtn.textContent = '⏸ Pause';

    // Start from beginning if at end
    const slider = document.getElementById('replay-slider');
    if (slider && parseInt(slider.value) >= 999) {
      this._scrubTo(0);
    }

    let lastTimestamp = null;

    const step = (timestamp) => {
      if (!this._playing) return;
      if (!lastTimestamp) lastTimestamp = timestamp;

      const deltaMs   = timestamp - lastTimestamp;
      lastTimestamp   = timestamp;

      const slider = document.getElementById('replay-slider');
      const currentFrac = slider ? parseInt(slider.value) / 1000 : 0;
      const currentT    = currentFrac * this._maxT;

      // Advance time proportional to real elapsed + speed
      const advanceT = (deltaMs / 1000) * this._playSpeed * (this._maxT / 10);
      const nextT    = currentT + advanceT;

      if (nextT >= this._maxT) {
        this._scrubTo(this._maxT);
        this._stopPlay();
        return;
      }

      this._scrubTo(nextT);
      this._playRafId = requestAnimationFrame(step);
    };

    this._playRafId = requestAnimationFrame(step);
  }

  _stopPlay() {
    this._playing = false;
    cancelAnimationFrame(this._playRafId);
    const playBtn = document.getElementById('replay-play-btn');
    if (playBtn) playBtn.textContent = '▶ Play';
  }

  /* ── Column Band Visualization ───────────────────────────────────────────── */

  _updateColumnViz(t, fraction) {
    const vizEl = document.getElementById('replay-column-viz');
    if (!vizEl || !this._peaks.length) return;

    vizEl.style.display = 'block';

    const colors = ['#38bdf8','#a78bfa','#34d399','#fbbf24','#f87171','#fb923c'];

    const bands = this._peaks.map((peak, i) => {
      // Band position: 0% (at column inlet) → 100% (eluted past detector)
      const progress = Math.min(1, t / peak.tR);
      const col = colors[i % colors.length];
      const eluted = t >= peak.tR;

      return { peak, progress, col, eluted };
    });

    vizEl.innerHTML = `
      <div style="font-size:0.65rem; color:#334155; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; font-family:'JetBrains Mono',monospace;">
        Column — Analyte Band Position
      </div>
      <div style="position:relative; background:#020810; border:1px solid #1e293b; border-radius:8px; padding:10px 12px; overflow:hidden;">
        <!-- Column tube representation -->
        <div style="
          position:absolute; top:0; bottom:0; left:60px; right:30px;
          background:linear-gradient(90deg, #0f172a, #1e293b); border-left:2px solid #334155; border-right:2px solid #334155;
        "></div>
        <!-- Detector marker -->
        <div style="position:absolute; right:30px; top:0; bottom:0; width:2px; background:#38bdf8; opacity:0.6;"></div>
        <div style="position:absolute; right:16px; top:4px; font-size:0.55rem; color:#38bdf8; font-family:'JetBrains Mono',monospace;">UV</div>

        ${bands.map(({ peak, progress, col, eluted }) => {
          const colWidth = `calc(100% - 90px)`;
          const bandLeft = `${progress * 100}%`;
          const opacity  = eluted ? 0.25 : Math.max(0.3, 1 - progress * 0.4);

          return `
            <div style="
              display:flex; align-items:center; gap:8px;
              position:relative; margin-bottom:8px; z-index:2;
            ">
              <span style="
                min-width:52px; font-size:0.65rem; color:${col}; font-weight:700;
                font-family:'JetBrains Mono',monospace; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;
                opacity:${eluted ? 0.5 : 1};
              " title="${peak.compound}">${peak.compound.length > 8 ? peak.compound.slice(0,7)+'…' : peak.compound}</span>
              <div style="flex:1; height:16px; position:relative; background:transparent;">
                <div style="
                  position:absolute; left:${Math.min(progress * 100, 100)}%; transform:translateX(-50%);
                  width:${eluted ? 0 : 18}px; height:16px;
                  background:${col}; border-radius:9px; opacity:${opacity};
                  transition:left 80ms linear, opacity 200ms ease;
                "></div>
                ${eluted ? `<div style="position:absolute;right:0;font-size:0.6rem;color:${col};opacity:0.6;">✓ detected</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ── Narrator Commentary ────────────────────────────────────────────────────── */

  _updateNarrator(t, fraction) {
    const narratorEl = document.getElementById('replay-narrator-line');
    if (!narratorEl) return;

    const nextPeak = this._peaks.find(p => p.tR > t);
    const justDetected = this._peaks.find(p => Math.abs(p.tR - t) < 0.15);

    let msg = '';

    if (fraction < 0.01) {
      msg = 'Pump started. Mobile phase flowing through the column…';
    } else if (t < 0.3) {
      msg = 'Priming: mobile phase is displacing residual solvent from the column void.';
    } else if (t < 0.8) {
      msg = 'Equilibrating: column stationary phase is equilibrating with the mobile phase composition.';
    } else if (t < 1.5) {
      msg = 'Sample injected. Analyte bands are entering the column and beginning to separate based on their affinity for the stationary phase.';
    } else if (justDetected) {
      msg = `Peak detected: ${justDetected.compound} — tR ${justDetected.tR.toFixed(2)} min, height ${justDetected.height?.toFixed(3)} AU.`;
    } else if (nextPeak) {
      const remaining = (nextPeak.tR - t).toFixed(2);
      msg = `Separating… Next expected: ${nextPeak.compound} in ~${remaining} min. Analyte bands are migrating through the stationary phase at different rates based on their polarity and kw.`;
    } else if (fraction >= 0.98) {
      msg = `Run complete. All ${this._peaks.length} analyte${this._peaks.length !== 1 ? 's' : ''} detected. Review peak metrics in the Results tab.`;
    } else {
      msg = `Separating… elapsed ${t.toFixed(2)} min of ${this._maxT.toFixed(2)} min total run.`;
    }

    narratorEl.textContent = msg;
  }
}
