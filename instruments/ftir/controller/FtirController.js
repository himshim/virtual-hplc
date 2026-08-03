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

import { EventBus } from '../../../core/EventBus.js';
import { FtirEngine, FTIR_COMPOUND_DATABASE } from '../engine/ftirEngine.js';

export class FtirController extends EventBus {
  constructor() {
    super();
    this.id           = 'ftir';
    this.capabilities = { playback: true, speedControl: true, step: true };

    // Run Parameters
    this._sampleKey       = 'ethanol';
    this._samplingMode    = 'atr'; // 'atr' (Diamond) vs 'kbr' (Pellet)
    this._numberOfScans   = 16;
    this._resolution      = 4; // cm^-1
    this._backgroundDone  = false;
    this._cuvetteMaterial = 'quartz';
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

  startBackgroundScan() {
    this._stage              = 'INTERFEROGRAM';
    this._currentOpd         = this._opdStart;
    this._fullInterferogram  = [];
    this._fullSpectrum       = [];
    this._revealedIndex      = 0;
    this._fftProgress        = 0.0;
    this._lifecyclePhase     = 'BACKGROUND_SCAN';
  }

  startSampleScan() {
    this._stage              = 'INTERFEROGRAM';
    this._currentOpd         = this._opdStart;
    this._fullInterferogram  = [];
    this._fullSpectrum       = [];
    this._revealedIndex      = 0;
    this._fftProgress        = 0.0;
    this._lifecyclePhase     = 'SAMPLE_SCAN';
  }

  run() {
    this.startSampleScan();
  }

  setSample(sampleKey) {
    if (typeof this.setSampleKey === 'function') this.setSampleKey(sampleKey);
    else this._sampleKey = sampleKey;
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
    // 1. Interferogram points (-0.25 to +0.25 cm, 501 points)
    const ifgPoints = [];
    for (let opd = this._opdStart; opd <= this._opdEnd; opd += 0.001) {
      const pt = FtirEngine.computeInterferogramAtOpd(this._sampleKey, opd, this._samplingMode);
      ifgPoints.push({ x: Math.round(opd * 1000) / 1000, y: Math.round(pt.intensity * 100) / 100 });
    }

    // 2. Transmittance spectrum points (4000 down to 400 cm^-1, 1801 points)
    const specPoints = [];
    for (let nu = this._nuStart; nu >= this._nuEnd; nu -= 2) {
      const pt = FtirEngine.computeTransmittanceAtWavenumber(this._sampleKey, nu, this._samplingMode);
      specPoints.push({ x: nu, y: Math.round(pt.transmittance * 10) / 10 });
    }

    this._fullInterferogram = ifgPoints;
    this._fullSpectrum     = specPoints;
  }

  // Setters
  setSample(key)          { if (FTIR_COMPOUND_DATABASE[key]) this._sampleKey = key; }
  setSamplingMode(mode)   { if (mode === 'atr' || mode === 'kbr') this._samplingMode = mode; }
  setNumberOfScans(n)     { this._numberOfScans = Number(n); }
  setResolution(r)        { this._resolution = Number(r); }
  setCuvetteMaterial(m)   { this._cuvetteMaterial = m; }
  setExpertiseMode(m)     { this._expertiseMode = m; }
}
