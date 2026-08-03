/**
 * UvVisController.js — UV-Vis Spectrophotometer Real-Time Instrument Controller
 *
 * Implements SimulationInstrument contract (tick(context)) for SimulationRunner.
 *
 * Architecture:
 *  - Spectrum calculation is DECOUPLED from playback speed.
 *  - Full spectrum (200..800 nm, 601 points) is pre-computed at scan start.
 *  - During tick(context), playback speed ONLY controls how fast points from the
 *    pre-computed spectrum array are revealed to the UI/graph engine.
 *  - Guarantee: Plotted spectrum shape, resolution, and peak heights are 100%
 *    IDENTICAL regardless of 1x, 2x, 5x, or 10x playback speed.
 */

import { BeerLambertEngine, CHROMOPHORE_DATABASE } from '../engine/beerLambertEngine.js';
import { OpticalInstrumentModel, STRAY_LIGHT_PRESETS } from '../engine/opticalInstrumentModel.js';
import { LaboratoryPracticeModel, SMUDGE_LEVELS } from '../engine/laboratoryPracticeModel.js';
import { DiagnosticEngine } from '../engine/diagnosticEngine.js';
import { MixtureSpectrumModel } from '../engine/MixtureSpectrumModel.js';
import { SpectralSimilarityEngine } from '../engine/spectralSimilarityEngine.js';
import { UVVIS_EVENTS } from './UvVisEvents.js';

export class UvVisController {
  constructor() {
    this.id           = 'uvvis';
    this.capabilities = { playback: true, speedControl: true, step: true };

    // Run parameters (set by UI before scan)
    this._sampleKey       = 'paracetamol';
    this._concUgMl        = 15.0;
    this._pathCm          = 1.0;
    this._solventKey      = 'water';
    this._noiseMode       = 'none';
    this._cuvetteMaterial = 'quartz'; // 'quartz' (190-800nm) vs 'glass' (UV absorber below 340nm)
    this._expertiseMode   = 'beginner'; // 'beginner' | 'standard' | 'advanced'
    this._pH              = 7.0; // solution pH (default 7.0 neutral)

    // Grouped Mixture Analysis State
    this._mixtureConfig = {
      isMixture: false,
      compA: 'paracetamol',
      concA: 15.0,
      compB: 'caffeine',
      concB: 10.0
    };

    // Grouped Optical Instrument State
    this._optics = {
      slitWidth: 1.0,        // 0.5, 1.0, 2.0, 5.0 nm
      wavelengthOffset: 0.0, // -2.0 to +2.0 nm
      strayLightPreset: 'routine' // 'ideal' (0.01%), 'routine' (0.05%), 'high' (1.20%)
    };

    // Grouped Laboratory Practice State
    this._labPractice = {
      smudgeLevel: 'clean',    // 'clean', 'light', 'moderate', 'heavy'
      turbidityLevel: 0.0,     // 0.0 to 1.0 continuous
      blankSolvent: 'matched', // 'matched' or mismatched solvent key
      cuvetteRotated: false    // false (clear face) vs true (rotated frosted face)
    };

    // Acquisition Method State
    this._method = {
      rangePreset:    'auto',   // 'auto' | 'full' | 'uv' | 'vis' | 'visNarrow' | 'custom'
      startLambda:    800,      // nm
      endLambda:      200,      // nm
      scanStepNm:     1.0,      // 0.1, 0.2, 0.5, 1.0, 2.0 nm
      scanSpeedNmMin: 300,      // 100, 300, 600, 1200 nm/min
    };

    // Visualization Playback State
    this._playbackConfig = {
      direction: 'highToLow',   // 'highToLow' (800->200) | 'lowToHigh' (200->800)
    };

    // Scan bounds derived from method
    this._scanStart  = 200;  // nm
    this._scanEnd    = 800;  // nm

    // Mutable scan state
    this._currentLambda       = 800;
    this._blankMode           = false;
    this._blankDone           = false;
    this._fullSpectrumPoints  = [];
    this._revealedIndex       = 0;
    this._maxAbsorbance       = 0;
    this._lambdaMax           = null;
    this._fullMaxAbsorbance   = 0;
    this._fullLambdaMax       = null;
    this._uv400Emitted        = false;
    this._lifecyclePhase      = 'IDLE';
  }

  // ── Public Accessors ──────────────────────────────────────────────────────
  setMethod(methodConfig = {}) {
    this._method = { ...this._method, ...methodConfig };
  }

  setPlaybackConfig(playbackConfig = {}) {
    this._playbackConfig = { ...this._playbackConfig, ...playbackConfig };
  }

  getState() {
    return {
      sampleKey:         this._sampleKey,
      concentrationUgMl:  this._concUgMl,
      pathLengthCm:      this._pathCm,
      solventKey:        this._solventKey,
      cuvetteMaterial:   this._cuvetteMaterial,
      expertiseMode:     this._expertiseMode,
      pH:                this._pH,
      currentLambda:     Math.round(this._currentLambda),
      lifecyclePhase:    this._lifecyclePhase,
      blankDone:         this._blankDone,
      startLambda:       Math.min(this._method.startLambda, this._method.endLambda),
      endLambda:         Math.max(this._method.startLambda, this._method.endLambda),
      scanStepNm:        this._method.scanStepNm,
      scanSpeedNmMin:    this._method.scanSpeedNmMin,
      direction:         this._playbackConfig.direction,
    };
  }

  getGraphMetadata() {
    return {
      scanStart: Math.min(this._method.startLambda, this._method.endLambda),
      scanEnd:   Math.max(this._method.startLambda, this._method.endLambda),
      lambdaMax: this._lambdaMax || this._fullLambdaMax,
      maxAbsorbance: this._maxAbsorbance || this._fullMaxAbsorbance,
    };
  }

  // ── Lifecycle hooks ──────────────────────────────────────────────────────
  initialize() {
    this._currentLambda      = this._scanStart;
    this._blankMode          = false;
    this._blankDone          = false;
    this._fullSpectrumPoints = [];
    this._revealedIndex      = 0;
    this._maxAbsorbance      = 0;
    this._lambdaMax          = null;
    this._fullMaxAbsorbance  = 0;
    this._fullLambdaMax      = null;
    this._uv400Emitted       = false;
    this._lifecyclePhase     = 'IDLE';
  }

  async warmup() {
    this._lifecyclePhase = 'LAMP_WARMUP';
    return Promise.resolve();
  }

  setReady() {
    this._currentLambda  = this._scanStart;
    this._lifecyclePhase = 'READY';
  }

  reset() {
    this.initialize();
  }

  run() {
    this.startSampleScan();
  }

  setSample(sampleKey) {
    if (typeof this.setSampleKey === 'function') this.setSampleKey(sampleKey);
    else this._sampleKey = sampleKey;
  }

  complete() {
    this._lifecyclePhase = 'DONE';
  }

  // ── Scan mode switches — called by UI buttons ────────────────────────────
  /** Prepare a blank scan run */
  startBlankScan() {
    this._blankMode          = true;
    const minL = Math.min(this._method.startLambda, this._method.endLambda);
    const maxL = Math.max(this._method.startLambda, this._method.endLambda);
    this._scanStart          = minL;
    this._scanEnd            = maxL;
    this._currentLambda      = this._playbackConfig.direction === 'highToLow' ? maxL : minL;
    this._fullSpectrumPoints = [];
    this._revealedIndex      = this._playbackConfig.direction === 'highToLow' ? 0 : 0;
    this._uv400Emitted       = false;
    this._lifecyclePhase     = 'BLANK_SCAN';
  }

  /** Prepare a sample scan run */
  startSampleScan() {
    this._blankMode          = false;
    const minL = Math.min(this._method.startLambda, this._method.endLambda);
    const maxL = Math.max(this._method.startLambda, this._method.endLambda);
    this._scanStart          = minL;
    this._scanEnd            = maxL;
    this._currentLambda      = this._playbackConfig.direction === 'highToLow' ? maxL : minL;
    this._fullSpectrumPoints = [];
    this._revealedIndex      = 0;
    this._maxAbsorbance      = 0;
    this._lambdaMax          = null;
    this._fullMaxAbsorbance  = 0;
    this._fullLambdaMax      = null;
    this._uv400Emitted       = false;
    this._lifecyclePhase     = 'SAMPLE_SCAN';
  }

  // ── SimulationInstrument Contract ────────────────────────────────────────
  tick(ctx) {
    if (this._fullSpectrumPoints.length === 0) {
      this._precomputeFullSpectrum(ctx?.random);
      this._revealedIndex = this._playbackConfig.direction === 'highToLow' ? this._fullSpectrumPoints.length - 1 : 0;
    }

    this._advanceLambda(ctx);
    this._checkRegionBoundary(ctx);

    const newPoints = this._revealPoints(ctx?.eventBus);
    const minL = Math.min(this._method.startLambda, this._method.endLambda);
    const maxL = Math.max(this._method.startLambda, this._method.endLambda);
    
    const scanComplete = this._playbackConfig.direction === 'highToLow'
      ? this._currentLambda <= minL
      : this._currentLambda >= maxL;

    if (scanComplete) this._onScanComplete(ctx);

    const latestPoint = newPoints.length > 0
      ? newPoints[newPoints.length - 1]
      : { x: this._currentLambda, y: 0 };

    return {
      telemetry:   this._buildTelemetry(latestPoint.x, latestPoint.y),
      graphPoints: newPoints,
      status:      this._buildStatus(scanComplete),
    };
  }

  // ── Private Spectrum Pre-Computation (Direction-Independent) ─────────────
  _precomputeFullSpectrum(rng) {
    let rawPoints = [];
    const minL = Math.min(this._method.startLambda, this._method.endLambda);
    const maxL = Math.max(this._method.startLambda, this._method.endLambda);
    const step = this._method.scanStepNm || 1.0;

    if (this._blankMode) {
      for (let lambda = minL; lambda <= maxL; lambda += step) {
        const abs = BeerLambertEngine.computeBlankAbsorbance(this._solventKey, lambda);
        rawPoints.push({ x: Math.round(lambda * 10) / 10, y: Math.round(abs * 10000) / 10000 });
      }
    } else if (this._mixtureConfig && this._mixtureConfig.isMixture) {
      rawPoints = MixtureSpectrumModel.computeMixtureSpectrum({
        ...this._mixtureConfig,
        scanStart:       minL,
        scanEnd:         maxL,
        pathCm:           this._pathCm,
        solventKey:       this._solventKey,
        cuvetteMaterial:  this._cuvetteMaterial,
        pH:              this._pH
      });
    } else {
      for (let lambda = minL; lambda <= maxL; lambda += step) {
        const pt = BeerLambertEngine.computeAbsorbanceAtLambda(
          this._sampleKey, lambda, this._concUgMl, this._pathCm,
          0.001, rng, this._noiseMode, this._solventKey, this._cuvetteMaterial, this._pH
        );
        rawPoints.push({ x: Math.round(lambda * 10) / 10, y: pt.absorbance });
      }
    }

    const opticalPoints = this._blankMode
      ? rawPoints
      : OpticalInstrumentModel.processSpectrum(rawPoints, this._optics);

    const finalPoints = this._blankMode
      ? opticalPoints
      : LaboratoryPracticeModel.processSpectrum(opticalPoints, {
          ...this._labPractice,
          sampleSolvent: this._solventKey
        });

    let maxAbs = 0, peakLambda = null;
    finalPoints.forEach(pt => {
      if (pt.y > maxAbs) {
        maxAbs = pt.y;
        peakLambda = pt.x;
      }
    });

    this._fullSpectrumPoints = finalPoints;
    this._fullMaxAbsorbance  = maxAbs;
    this._fullLambdaMax      = peakLambda;
  }

  // ── Private Tick Helpers ─────────────────────────────────────────────────
  _advanceLambda(ctx) {
    const dtMin   = ctx ? ctx.deltaTime / 60 : 0.05 / 60;
    const speed   = this._method.scanSpeedNmMin || 300;
    const stepNm  = speed * dtMin;

    if (this._playbackConfig.direction === 'highToLow') {
      this._currentLambda -= stepNm;
    } else {
      this._currentLambda += stepNm;
    }
  }

  _checkRegionBoundary(ctx) {
    // optional region change event
  }

  _revealPoints(eventBus) {
    const revealed = [];
    if (this._playbackConfig.direction === 'highToLow') {
      while (
        this._revealedIndex >= 0 &&
        this._fullSpectrumPoints[this._revealedIndex] &&
        this._fullSpectrumPoints[this._revealedIndex].x >= this._currentLambda
      ) {
        const pt = this._fullSpectrumPoints[this._revealedIndex];
        revealed.push(pt);
        this._revealedIndex--;

        if (!this._blankMode && pt.x === this._fullLambdaMax && eventBus) {
          eventBus.emit(UVVIS_EVENTS.PEAK_DETECTED, {
            lambdaMax:     pt.x,
            maxAbsorbance: pt.y,
            sampleKey:     this._sampleKey,
          });
        }
      }
    } else {
      while (
        this._revealedIndex < this._fullSpectrumPoints.length &&
        this._fullSpectrumPoints[this._revealedIndex] &&
        this._fullSpectrumPoints[this._revealedIndex].x <= this._currentLambda
      ) {
        const pt = this._fullSpectrumPoints[this._revealedIndex];
        revealed.push(pt);
        this._revealedIndex++;

        if (!this._blankMode && pt.x === this._fullLambdaMax && eventBus) {
          eventBus.emit(UVVIS_EVENTS.PEAK_DETECTED, {
            lambdaMax:     pt.x,
            maxAbsorbance: pt.y,
            sampleKey:     this._sampleKey,
          });
        }
      }
    }
    return revealed;
  }

  _onScanComplete(ctx) {
    if (this._blankMode) {
      this._blankDone = true;
      if (ctx?.eventBus) {
        ctx.eventBus.emit(UVVIS_EVENTS.BLANK_COMPLETE, { solventKey: this._solventKey });
      }
    } else {
      if (ctx?.eventBus) {
        ctx.eventBus.emit(UVVIS_EVENTS.SCAN_COMPLETE, {
          lambdaMax:     this._lambdaMax || this._fullLambdaMax,
          maxAbsorbance: this._maxAbsorbance || this._fullMaxAbsorbance,
          sampleKey:     this._sampleKey,
        });
      }
    }
  }

  _buildTelemetry(lambda, absorbance) {
    return {
      wavelengthNm:   Math.round(lambda),
      absorbance:     Math.round(absorbance * 1000) / 1000,
      transmittance:  Math.round(Math.pow(10, -absorbance) * 1000) / 10,
      sampleKey:      this._sampleKey,
      concUgMl:       this._concUgMl,
      pathCm:         this._pathCm,
      lifecyclePhase: this._lifecyclePhase,
    };
  }

  _buildStatus(scanComplete) {
    const totalRange = this._scanEnd - this._scanStart;
    const progress   = (this._currentLambda - this._scanStart) / totalRange;
    return {
      progress:      Math.min(1, progress),
      scanComplete,
      currentPhase:  this._lifecyclePhase,
      currentLambda: Math.min(this._scanEnd, Math.round(this._currentLambda)),
    };
  }

  // ── Diagnostic & Spectral Similarity Analysis APIs ────────────────────────
  getDiagnostics() {
    return DiagnosticEngine.analyzeSpectrum(this._fullSpectrumPoints, {
      ...this._labPractice,
      sampleSolvent: this._solventKey
    });
  }

  compareWithReference(refKey = 'paracetamol') {
    return SpectralSimilarityEngine.compareSpectra(this._fullSpectrumPoints, refKey);
  }

  // ── Param setters ────────────────────────────────────────────────────────
  setSample(key)          { if (CHROMOPHORE_DATABASE[key]) this._sampleKey = key; }
  setConcentration(c)     { this._concUgMl  = Math.max(0.1, Math.min(100, c)); }
  setPathLength(l)        { this._pathCm    = Math.max(0.1, Math.min(5.0, l)); }
  setSolvent(key)         { this._solventKey = key; }
  setNoiseMode(mode)      { this._noiseMode  = mode; }
  setCuvetteMaterial(mat) { if (mat === 'quartz' || mat === 'glass') this._cuvetteMaterial = mat; }
  setExpertiseMode(mode)  { if (['beginner', 'standard', 'advanced'].includes(mode)) this._expertiseMode = mode; }
  setpH(val)              { this._pH = Math.max(1.0, Math.min(14.0, Number(val))); }
  setSlitWidth(sbw)       { this._optics.slitWidth = [0.5, 1.0, 2.0, 5.0].includes(Number(sbw)) ? Number(sbw) : 1.0; }
  setWavelengthOffset(d)  { this._optics.wavelengthOffset = Math.max(-2.0, Math.min(2.0, Number(d))); }
  setStrayLightPreset(p)  { if (STRAY_LIGHT_PRESETS[p]) this._optics.strayLightPreset = p; }
  setSmudgeLevel(level)   { if (SMUDGE_LEVELS[level] !== undefined) this._labPractice.smudgeLevel = level; }
  setTurbidityLevel(val)  { this._labPractice.turbidityLevel = Math.max(0.0, Math.min(1.0, Number(val))); }
  setBlankSolvent(key)    { this._labPractice.blankSolvent = key; }
  setCuvetteRotated(rot)  { this._labPractice.cuvetteRotated = Boolean(rot); }

  setMixtureMode(enabled = false, compA = 'paracetamol', concA = 15.0, compB = 'caffeine', concB = 10.0) {
    this._mixtureConfig = {
      isMixture: Boolean(enabled),
      compA: compA || 'paracetamol',
      concA: Math.max(0.0, Number(concA)),
      compB: compB || 'caffeine',
      concB: Math.max(0.0, Number(concB))
    };
  }
}
