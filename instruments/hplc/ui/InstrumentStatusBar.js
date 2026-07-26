/**
 * InstrumentStatusBar.js — P7 Instrument Status Header Strip
 * 
 * Displays live instrument status: state, pressure, flow rate, UV wavelength, temperature.
 * Mirrors the status strip pattern used in commercial CDS software (Waters Empower, Agilent OpenLAB).
 */
export class InstrumentStatusBar {
  constructor(containerId = 'instrument-status-bar') {
    this.containerId = containerId;
    this.state = {
      instrument: 'Standard HPLC',
      status: 'IDLE',
      pressureBar: 0,
      flowRate: 1.0,
      wavelengthNm: 254,
      temperatureC: 25
    };
  }

  render() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    const statusColor = {
      IDLE: '#94a3b8',
      READY: '#22c55e',
      RUNNING: '#38bdf8',
      COMPLETED: '#22c55e',
      STOPPED: '#f59e0b',
      OVERPRESSURE: '#ef4444',
      DETECTOR_SATURATION: '#f97316'
    }[this.state.status] || '#94a3b8';

    el.innerHTML = `
      <div style="
        display: flex; align-items: center; gap: 0;
        background: #0f172a; border-radius: 10px; overflow: hidden;
        border: 1px solid rgba(56,189,248,0.15); font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem; flex-wrap: wrap;
      ">
        <!-- Instrument Name & Status -->
        <div style="
          padding: 10px 14px; display: flex; align-items: center; gap: 10px;
          border-right: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
        ">
          <span style="color:#94a3b8; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em;">Instrument</span>
          <span style="color:#f1f5f9; font-weight:700;">${this.state.instrument}</span>
          <span style="
            padding: 2px 8px; border-radius: 999px; font-size: 0.65rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.06em;
            background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}55;
          ">${this.state.status}</span>
        </div>

        <!-- Pressure -->
        <div style="padding: 10px 14px; border-right: 1px solid rgba(255,255,255,0.08); flex: 1; min-width: 90px;">
          <div style="color:#475569; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">Pressure</div>
          <div style="color:#38bdf8; font-weight:700;">${this.state.pressureBar.toFixed(0)} bar</div>
        </div>

        <!-- Flow Rate -->
        <div style="padding: 10px 14px; border-right: 1px solid rgba(255,255,255,0.08); flex: 1; min-width: 90px;">
          <div style="color:#475569; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">Flow</div>
          <div style="color:#a78bfa; font-weight:700;">${this.state.flowRate.toFixed(2)} mL/min</div>
        </div>

        <!-- UV Wavelength -->
        <div style="padding: 10px 14px; border-right: 1px solid rgba(255,255,255,0.08); flex: 1; min-width: 80px;">
          <div style="color:#475569; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">UV λ</div>
          <div style="color:#34d399; font-weight:700;">${this.state.wavelengthNm} nm</div>
        </div>

        <!-- Temperature -->
        <div style="padding: 10px 14px; flex: 1; min-width: 80px;">
          <div style="color:#475569; font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">Temp</div>
          <div style="color:#fbbf24; font-weight:700;">${this.state.temperatureC}°C</div>
        </div>
      </div>
    `;
  }

  update(patch) {
    Object.assign(this.state, patch);
    this.render();
  }
}
