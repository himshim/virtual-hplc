/**
 * FtirController.js — Real-Time FTIR Spectrometer Controller
 *
 * Implements SimulationInstrument contract (tick(context)) for SimulationRunner.
 *
 * Real-time stages:
 *  1. Stage 1: Interferogram Acquisition (Moving Mirror OPD sweep -0.25 to +0.25 cm)
 *  2. Stage 2: Visible Fourier Transformation (FFT computation)
 *  3. Stage 3: Transmittance Spectrum Rendered (4000 to 400 cm^-1)
 */

import { FtirEngine, FTIR_COMPOUND_DATABASE } from '../engine/ftirEngine.js';

export class FtirController {
  constructor() {
    this.id           = 'ftir';
    this.capabilities = { playback: true, speedControl: true, step: true };

    // Run Parameters
    this._sampleKey       = 'ethanol';
    this._samplingMode    = 'atr'; // 'atr' (Diamond) vs 'kbr' (Pellet)
    this._numberOfScans   = 16;
    this._resolution      = 4; // cm^-1
    this._backgroundDone  = false;
    this._expertiseMode   = 'beginner';

    // Scan bounds
    this._opdStart        = -0.25; // cm
    this._opdEnd          = 0.25;  // cm
    this._nuStart         = 4000;  // cm^-1
    this._nuEnd           = 400;   // cm^-1

    // Mutable state
    this._currentOpd          = -0.25;
    this._currentNu           = 4000;
    this._stage               = 'INTERFEROGRAM'; // 'INTERFEROGRAM' | 'TRANSFORM' | 'SPECTRUM'
    this._fullInterferogram   = [];
    this._fullSpectrum        = [];
    this._backgroundSpectrum  = []; // Stored single-beam background I_bg(ν̃)
    this._revealedIndex       = 0;
    this._fftProgress         = 0.0;
    this._lifecyclePhase      = 'IDLE';
  }

  getState() {
    return {
      sampleKey:        this._sampleKey,
      samplingMode:     this._samplingMode,
      numberOfScans:    this._numberOfScans,
      resolution:       this._resolution,
      stage:            this._stage,
      currentOpd:       Math.round(this._currentOpd * 1000) / 1000,
      currentNu:        Math.round(this._currentNu),
      lifecyclePhase:   this._lifecyclePhase,
      backgroundDone:   this._backgroundDone,
      fftProgress:      this._fftProgress,
    };
  }

  initialize() {
    this._currentOpd   = this._opdStart;
    this._currentNu    = this._nuStart;
    this._stage        = 'INTERFEROGRAM';
    this._revealedIndex = 0;
    this._fftProgress  = 0.0;
    this._lifecyclePhase = 'READY';
  }

  setReady() {
    this._lifecyclePhase = 'READY';
  }

  reset() {
    this.initialize();
    this._lifecyclePhase = 'IDLE';
  }

  _startScan(phase) {
    this._stage              = 'INTERFEROGRAM';
    this._currentOpd         = this._opdStart;
    this._fullInterferogram  = [];
    this._fullSpectrum       = [];
    this._revealedIndex      = 0;
    this._fftProgress        = 0.0;
    this._lifecyclePhase     = phase;
  }

  startBackgroundScan() {
    this._startScan('BACKGROUND_SCAN');
  }

  startSampleScan() {
    this._startScan('SAMPLE_SCAN');
  }

  run() {
    this.startSampleScan();
  }

  // ── SimulationInstrument Contract ────────────────────────────────────────
  tick(ctx) {
    if (this._fullInterferogram.length === 0) {
      this._precomputeInterferogramAndSpectrum();
    }

    if (this._stage === 'INTERFEROGRAM') {
      this._currentOpd += 0.005 * (ctx?.speedMultiplier || 1);
      if (this._currentOpd >= this._opdEnd) {
        this._currentOpd = this._opdEnd;
        this._stage = 'TRANSFORM'; // Transition to visible FFT stage
      }
      this._revealedIndex = Math.min(
        this._fullInterferogram.length - 1,
        Math.floor(((this._currentOpd - this._opdStart) / (this._opdEnd - this._opdStart)) * this._fullInterferogram.length)
      );

      const latestPt = this._fullInterferogram[Math.max(0, this._revealedIndex)] || { x: 0, y: 50 };
      const isZpd    = Math.abs(latestPt.x) < 0.01;

      if (isZpd) {
        ctx?.eventBus?.emit('ftir:zpd_reached', { opd: latestPt.x, intensity: latestPt.y });
      }

      return {
        telemetry: {
          opdCm:         latestPt.x,
          intensity:     latestPt.y,
          wavenumber:    4000,
          transmittance: 100,
          stage:         'INTERFEROGRAM',
          isZpd,
        },
        graphPoints: this._fullInterferogram.slice(0, this._revealedIndex + 1),
        status: {
          progress:      (this._currentOpd - this._opdStart) / (this._opdEnd - this._opdStart),
          scanComplete:  false,
          currentPhase:  this._lifecyclePhase,
          stage:         'INTERFEROGRAM',
        }
      };
    } else if (this._stage === 'TRANSFORM') {
      this._fftProgress += 0.25 * (ctx?.speedMultiplier || 1);
      if (this._fftProgress >= 1.0) {
        this._fftProgress = 1.0;
        this._stage = 'SPECTRUM'; // Transition to spectrum view
      }

      return {
        telemetry: {
          opdCm:         0.25,
          intensity:     50,
          wavenumber:    4000,
          transmittance: 100,
          stage:         'TRANSFORM',
          isZpd:         false,
        },
        graphPoints: this._fullInterferogram,
        status: {
          progress:      this._fftProgress,
          scanComplete:  false,
          currentPhase:  this._lifecyclePhase,
          stage:         'TRANSFORM',
        }
      };
    } else { // SPECTRUM STAGE
      this._currentNu -= 20 * (ctx?.speedMultiplier || 1);
      const scanComplete = this._currentNu <= this._nuEnd;
      if (scanComplete) {
        this._currentNu = this._nuEnd;
        if (this._lifecyclePhase === 'BACKGROUND_SCAN') this._backgroundDone = true;
        this._lifecyclePhase = 'DONE';
      }

      const spectrumRevealed = Math.min(
        this._fullSpectrum.length - 1,
        Math.floor(((this._nuStart - this._currentNu) / (this._nuStart - this._nuEnd)) * this._fullSpectrum.length)
      );

      const latestPt = this._fullSpectrum[Math.max(0, spectrumRevealed)] || { x: 4000, y: 100 };

      return {
        telemetry: {
          opdCm:         0,
          intensity:     50,
          wavenumber:    latestPt.x,
          transmittance: latestPt.y,
          stage:         'SPECTRUM',
          isZpd:         false,
        },
        graphPoints: this._fullSpectrum.slice(0, spectrumRevealed + 1),
        status: {
          progress:      (this._nuStart - this._currentNu) / (this._nuStart - this._nuEnd),
          scanComplete,
          currentPhase:  this._lifecyclePhase,
          stage:         'SPECTRUM',
        }
      };
    }
  }

  _precomputeInterferogramAndSpectrum() {
    const isBackground = this._lifecyclePhase === 'BACKGROUND_SCAN';

    // Stage 1: Interferogram (-0.25 to +0.25 cm, 501 points)
    const ifgPoints = [];
    for (let opd = this._opdStart; opd <= this._opdEnd; opd += 0.001) {
      // Background: use 'ethanol' (pure solvent) for the single-beam reference
      // Sample: use the selected compound
      const key = isBackground ? 'ethanol' : this._sampleKey;
      const pt = FtirEngine.computeInterferogramAtOpd(key, opd, this._samplingMode);
      ifgPoints.push({ x: Math.round(opd * 1000) / 1000, y: Math.round(pt.intensity * 100) / 100 });
    }

    // Stage 2: Transmittance spectrum (4000 → 400 cm⁻¹, 1801 points)
    const specPoints = [];
    for (let nu = this._nuStart; nu >= this._nuEnd; nu -= 2) {
      let transmittance;
      if (isBackground) {
        // Background scan: record single-beam air/solvent spectrum (near 100 %T)
        const pt = FtirEngine.computeTransmittanceAtWavenumber('ethanol', nu, this._samplingMode);
        transmittance = pt.transmittance;
        // Store background reference for later ratioing
        this._backgroundSpectrum.push({ nu, T: transmittance });
      } else {
        // Sample scan: ratio against stored background  %T = (I_sample / I_background) × 100
        const ptSample = FtirEngine.computeTransmittanceAtWavenumber(this._sampleKey, nu, this._samplingMode);
        const bgEntry = this._backgroundSpectrum.find(b => b.nu === nu);
        if (bgEntry && bgEntry.T > 0) {
          // True ratioed transmittance
          transmittance = Math.max(2.0, Math.min(100.0, (ptSample.transmittance / bgEntry.T) * 100.0));
        } else {
          // No background stored: fall back to single-beam %T (graceful degradation)
          transmittance = ptSample.transmittance;
        }
      }
      specPoints.push({ x: nu, y: Math.round(transmittance * 10) / 10 });
    }

    // Clear background store when recording new background
    if (isBackground) this._backgroundSpectrum = specPoints.map((p, i) => ({
      nu: this._nuStart - i * 2,
      T: FtirEngine.computeTransmittanceAtWavenumber('ethanol', this._nuStart - i * 2, this._samplingMode).transmittance
    }));

    this._fullInterferogram = ifgPoints;
    this._fullSpectrum     = specPoints;
  }

  // Setters
  setSample(key) {
    if (FTIR_COMPOUND_DATABASE[key]) {
      this._sampleKey = key;
      // Clear precomputed data so next tick re-derives from new compound
      this._fullInterferogram = [];
      this._fullSpectrum = [];
    }
  }
  setSamplingMode(mode)   { if (mode === 'atr' || mode === 'kbr') { this._samplingMode = mode; this._fullInterferogram = []; this._fullSpectrum = []; } }
  setNumberOfScans(n)     { this._numberOfScans = Number(n); }
  setResolution(r)        { this._resolution = Number(r); }
  setExpertiseMode(m)     { this._expertiseMode = m; }
}
