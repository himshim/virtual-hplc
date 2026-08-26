/**
 * GcController.js — Gas Chromatography Real-Time Instrument Controller
 *
 * Implements the SimulationInstrument contract (tick(context)) for SimulationRunner.
 */

import { GcEngine } from '../engine/gcEngine.js';
import { GC_EVENTS } from './GcEvents.js';
import { COMPOUND_DATABASE } from '../../../chemistry/registry/CompoundDatabase.js';

export class GcController {
  constructor() {
    this.id           = 'gc-fid';
    this.capabilities = { playback: true, speedControl: true, step: true };

    this.engine           = new GcEngine();
    this._compounds       = Object.entries(COMPOUND_DATABASE).map(([id, c]) => ({
      id,
      name: c.name,
      kovatsIndex: c.gc?.kovatsIndex || 600,
      boilingPoint: c.gc?.boilingPoint || 100.0,
      formula: c.formula
    })).slice(0, 5);
    this._selectedSample  = 'residual_solvents';
    this._maxRunTime      = 8.0; // minutes
    this._expertiseMode   = 'beginner';

    // Mutable run state
    this._runTime          = 0;
    this._precomputedPeaks = [];
    this._lifecycleStatus  = 'IDLE';

    // Load default dataset asynchronously if in browser
    this.loadSampleDataset(this._selectedSample);
  }

  async loadSampleDataset(sampleKey = 'residual_solvents') {
    try {
      if (typeof fetch === 'function' && typeof window !== 'undefined') {
        const res = await fetch(`./data/${sampleKey}.json`);
        if (res.ok) {
          const data = await res.json();
          // Map compounds, preserving ecn from JSON if present (for accurate FID response)
          this._compounds = (data.compounds || []).map(c => ({
            id: c.id,
            name: c.name,
            formula: c.formula,
            kovatsIndex: c.kovatsIndex || 600,
            boilingPoint: c.boilingPoint || 100.0,
            ...(typeof c.ecn === 'number' ? { ecn: c.ecn } : {})
          }));
          return;
        }
      }
    } catch (err) {
      // Fallback already initialized from COMPOUND_DATABASE
    }
  }

  // ── Encapsulated Controller API Setters ─────────────────────────────────
  setOvenProgram({ initialTemp, holdTime, rampRate, finalTemp } = {}) {
    if (initialTemp !== undefined) this.engine.oven.initialTemp = Number(initialTemp);
    if (holdTime !== undefined)    this.engine.oven.holdTime    = Number(holdTime);
    if (rampRate !== undefined)    this.engine.oven.rampRate    = Number(rampRate);
    if (finalTemp !== undefined)   this.engine.oven.finalTemp   = Number(finalTemp);
  }

  setCarrierGas(gasType) {
    if (['Helium', 'Hydrogen', 'Nitrogen'].includes(gasType)) {
      this.engine.carrierGas.gasType = gasType;
    }
  }

  setInjectionMode({ mode, splitRatio } = {}) {
    if (mode && ['split', 'splitless'].includes(mode)) {
      this.engine.injectionMode = mode;
    }
    if (splitRatio !== undefined) {
      this.engine.splitRatio = Number(splitRatio);
    }
  }

  async setSample(sampleKey) {
    this._selectedSample = sampleKey;
    await this.loadSampleDataset(sampleKey);
  }

  setExpertiseMode(mode) {
    if (['beginner', 'standard', 'advanced'].includes(mode)) {
      this._expertiseMode = mode;
    }
  }

  getState() {
    return {
      carrierGas:     this.engine.carrierGas.gasType,
      injectionMode:  this.engine.injectionMode,
      splitRatio:     this.engine.splitRatio,
      initialTemp:    this.engine.oven.initialTemp,
      holdTime:       this.engine.oven.holdTime,
      rampRate:       this.engine.oven.rampRate,
      finalTemp:      this.engine.oven.finalTemp,
      lifecyclePhase: this._lifecycleStatus,
      expertiseMode:  this._expertiseMode
    };
  }

  // ── Public Accessor for Graph Metadata & Peak Table ─────────────────────
  getGraphMetadata() {
    return {
      peaks: this._precomputedPeaks.map((p, idx) => ({
        peakNum:       idx + 1,
        name:          p.name,
        retentionTime: p.tR,
        height:        p.height,
        area:          p.area,
        width:         p.width,
        sigma:         p.sigma
      })),
      maxTime: this._maxRunTime,
    };
  }

  // ── Lifecycle hooks (called by SimulationRunner) ─────────────────────────
  initialize() {
    this._runTime          = 0;
    this._precomputedPeaks = [];
    this._lifecycleStatus  = 'IDLE';
  }

  async warmup() {
    this._lifecycleStatus = 'WARMING_UP';
    return Promise.resolve();
  }

  setReady() {
    this._precomputedPeaks = this.engine.computePeaks(this._compounds);
    this._runTime          = 0;
    this._lifecycleStatus  = 'READY';
  }

  reset() {
    this._runTime          = 0;
    this._precomputedPeaks = [];
    this._lifecycleStatus  = 'IDLE';
  }

  complete() {
    this._lifecycleStatus = 'COMPLETED';
  }

  // ── SimulationInstrument Contract ────────────────────────────────────────
  tick(ctx) {
    if (this._lifecycleStatus === 'READY') {
      this._lifecycleStatus = 'RUNNING';
    }

    this._advanceTime(ctx);
    this._checkCompletion(ctx);

    const ovenTemp  = this.engine.oven.getTemperatureAtTime(this._runTime);
    const fidSignal = this.engine.getFidSignal(this._runTime, this._precomputedPeaks);

    return {
      telemetry:   this._buildTelemetry(ovenTemp, fidSignal),
      graphPoints: [this._buildGraphPoint(fidSignal)],
      status:      this._buildStatus(),
    };
  }

  // ── Private tick helpers ────────────────────────────────────────────────
  _advanceTime(ctx) {
    const dtMin = ctx ? ctx.deltaTime / 60 : 0.05 / 60;
    this._runTime += dtMin;
  }

  _checkCompletion(ctx) {
    if (this._runTime >= this._maxRunTime) {
      this._lifecycleStatus = 'COMPLETED';
      ctx?.eventBus?.emit(GC_EVENTS.RUN_COMPLETE, { runTime: this._runTime });
    }
  }

  _buildTelemetry(ovenTemp, fidSignal) {
    return {
      carrierGas:     this.engine.carrierGas.gasType,
      linearVelocity: this.engine.carrierGas.getOptimumVelocity(),
      ovenTemp:       Math.round(ovenTemp * 10) / 10,
      splitRatio:     this.engine.splitRatio,
      injectionMode:  this.engine.injectionMode,
      fidCurrent:     Math.round(fidSignal * 1000) / 1000,
      runTime:        Math.round(this._runTime * 1000) / 1000,
    };
  }

  _buildGraphPoint(fidSignal) {
    return {
      x: Math.round(this._runTime * 1000) / 1000,
      y: Math.round(fidSignal * 100) / 100,
    };
  }

  _buildStatus() {
    return {
      progress:         Math.min(1, this._runTime / this._maxRunTime),
      currentPhase:     this._lifecycleStatus,
      remainingTimeSec: Math.max(0, (this._maxRunTime - this._runTime) * 60),
    };
  }
}
