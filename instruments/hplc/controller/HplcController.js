import { SimulationController } from '../../../core/SimulationController.js';
import { globalEntityRegistry } from '../../../chemistry/registry/EntityRegistry.js';
import { bootstrapChemistryRegistry } from '../../../chemistry/registry/bootstrapRegistry.js';
import { SolutionChemistryEngine } from '../../../chemistry/engine/solutionChemistryEngine.js';
import { SimulationState } from '../models/SimulationState.js';
import { Chromatogram } from '../models/Chromatogram.js';
import { RunResult } from '../models/RunResult.js';
import { Peak } from '../models/Peak.js';
import { MethodHistory } from '../models/MethodHistory.js';
import { MethodComparison } from '../models/MethodComparison.js';
import { getSystemPressure } from '../engine/pressure.js';
import { getDeadTime, getRetentionTime, getObservedRetentionFactor } from '../engine/retention.js';
import { getPeakSigma } from '../engine/peak.js';
import { isDetectorSaturated, getBaselineNoise } from '../engine/detector.js';
import { synthesizeInstantSignal } from '../engine/chromatogramEngine.js';
import { evaluateSystemSuitability } from '../engine/suitability.js';
import { getMethodExercise } from '../engine/methodProfiles.js';
import { analyzeMethodBottlenecks } from '../engine/optimizationEngine.js';
import { scoreMethodExercise } from '../engine/scoringEngine.js';
import { PeakDetectionEngine } from '../engine/peakDetectionEngine.js';
import { NoiseADCEngine } from '../engine/noiseADCEngine.js';
import { MAX_PRESSURE_BAR, TICK_MS, DEFAULT_SPEED } from '../engine/constants.js';
import { HPLC_EVENTS } from './HplcEvents.js';

/**
 * CDS Acquisition Lifecycle State Machine
 * Real HPLC CDS workflow: IDLE → PRIMING → EQUILIBRATING → READY → INJECTING → RUNNING → COMPLETED
 */
const HPLC_TRANSITION_RULES = {
  BOOTING:         ['IDLE'],
  IDLE:            ['PRIMING', 'OVERPRESSURE'],
  PRIMING:         ['EQUILIBRATING', 'IDLE', 'STOPPED', 'OVERPRESSURE'],
  EQUILIBRATING:   ['READY', 'IDLE', 'STOPPED', 'OVERPRESSURE'],
  READY:           ['INJECTING', 'IDLE', 'STOPPED', 'OVERPRESSURE'],
  INJECTING:       ['RUNNING', 'IDLE', 'STOPPED'],
  RUNNING:         ['COMPLETED', 'STOPPED', 'OVERPRESSURE', 'DETECTOR_SATURATION'],
  COMPLETED:       ['PRIMING', 'IDLE'],
  STOPPED:         ['PRIMING', 'IDLE'],
  OVERPRESSURE:    ['IDLE'],
  DETECTOR_SATURATION: ['READY', 'IDLE', 'STOPPED']
};

const PRIMING_DURATION_MIN       = 0.40;
const EQUILIBRATING_DURATION_MIN = 1.10;
const INJECTION_VALVE_DELAY_MS   = 400;

export class HplcController extends SimulationController {
  constructor() {
    super({
      initialState: 'BOOTING',
      transitionRules: HPLC_TRANSITION_RULES,
      tickMs: TICK_MS,
      speedMultiplier: DEFAULT_SPEED
    });

    bootstrapChemistryRegistry();

    this.simState = new SimulationState();
    this.simState.temperature  = 25;
    this.simState.wavelengthNm = 254;
    this.simState.pH           = 7.0;
    this.simState.bufferKey    = 'phosphate_buffer';

    this.chromatogram     = new Chromatogram();
    this.methodHistory    = new MethodHistory();
    this.criteriaProfile  = 'USP';
    this.exerciseProfileId= 'QC_ASSAY';
    this.maxRunTimeMinutes= 5.0;

    this._primingTime      = 0;
    this._equilibratingTime= 0;
    this._noiseSeed        = 42;

    this._expectedAnalytes = [];
    this._detectedLiveSet  = new Set();
    this._lastRunWasBlank  = false;
    this._lastNonBlankPeaks= [];

    this.updatePressure();
  }

  initialize() {
    this.stateMachine.transitionTo('IDLE');
    this.eventBus.emit(HPLC_EVENTS.INSTRUMENT_INITIALIZED, { instrumentId: 'HPLC' });
  }

  /**
   * Universal SimulationInstrument Contract (Phase 4 Runtime Interface)
   * @param {SimulationContext} ctx - Immutable simulation context
   * @returns {Object} TickResult containing telemetry, graph points, events
   */
  tick(ctx) {
    const dt = ctx ? ctx.deltaTime : (this.clock ? this.clock.intervalMs / 1000 : 0.05);
    const tickResult = this.onTick(dt);
    return {
      telemetry: {
        pressure: this.simState.pressure,
        flowRate: this.simState.flowRate,
        organicPercent: this.simState.organicPercent,
        uvAbsorbance: this.simState.detectorSignal,
        runTime: this.simState.time
      },
      graphPoints: tickResult?.point ? [tickResult.point] : []
    };
  }

  configure(configParams = {}) {
    if (configParams.flowRate)       this.setFlowRate(configParams.flowRate);
    if (configParams.organicPercent)  this.setOrganicPercent(configParams.organicPercent);
    if (configParams.temperature)    this.setTemperature(configParams.temperature);
    if (configParams.wavelengthNm)   this.setWavelength(configParams.wavelengthNm);
    if (configParams.pH)             this.setPh(configParams.pH);
    if (configParams.bufferKey)      this.setBufferKey(configParams.bufferKey);
    if (configParams.sampleKey)      this.setSampleKey(configParams.sampleKey);
  }

  run() {
    const mode = this.simState?.expertiseMode || 'beginner';

    // Advanced mode: Require strict manual operator workflow
    if (mode === 'advanced') {
      if (this.stateMachine.state !== 'READY') {
        this.eventBus.emit(HPLC_EVENTS.WARNING_EMITTED, {
          type: 'MANUAL_WORKFLOW_REQUIRED',
          message: 'Advanced Mode: Manual workflow required. Please start pump, equilibrate column, and switch injection valve manually.'
        });
        return false;
      }
      return this.injectSample();
    }

    // Standard mode: Emit warning notice before auto-equilibrating
    if (mode === 'standard' && (this.stateMachine.state === 'IDLE' || this.stateMachine.state === 'BOOTING')) {
      this.eventBus.emit(HPLC_EVENTS.WARNING_EMITTED, {
        type: 'PUMP_NOT_EQUILIBRATED',
        message: 'Standard Mode: Column not equilibrated. Initiating automatic pump equilibration sequence...'
      });
    }

    // Beginner & Standard auto-sequence
    if (this.stateMachine.state === 'IDLE' || this.stateMachine.state === 'BOOTING') {
      this.startPump();
      this.eventBus.once(HPLC_EVENTS.BASELINE_STABILIZED, () => {
        this.injectSample();
      });
      return true;
    }
    return this.injectSample();
  }
  stop()   { return this.stopPump(); }
  evaluate(runResult) { return scoreMethodExercise(runResult, getMethodExercise(this.exerciseProfileId)); }
  report(runResult)   { return runResult; }

  setFlowRate(flowRate)             { this.simState.flowRate       = Number(flowRate);      this.updatePressure(); }
  setOrganicPercent(organicPercent) { this.simState.organicPercent = Number(organicPercent); this.updatePressure(); }
  setTemperature(tempCelsius)       { this.simState.temperature    = Number(tempCelsius);   this.updatePressure(); }
  setSensitivity(sensitivity)       { this.simState.sensitivity    = Number(sensitivity); }
  setSampleKey(sampleKey)           { this.simState.sampleKey      = sampleKey; }
  setSample(sampleKey)              { return this.setSampleKey(sampleKey); }

  setWavelength(wavelengthNm) {
    this.simState.wavelengthNm = Number(wavelengthNm);
    this.eventBus.emit(HPLC_EVENTS.WAVELENGTH_CHANGED, { wavelengthNm: this.simState.wavelengthNm });
  }

  setPh(pH) {
    this.simState.pH = Number(pH);
    this.eventBus.emit(HPLC_EVENTS.PH_CHANGED, { pH: this.simState.pH });
  }

  setBufferKey(bufferKey) {
    this.simState.bufferKey = bufferKey;
    this.eventBus.emit(HPLC_EVENTS.BUFFER_CHANGED, { bufferKey });
  }

  setCriteriaProfile(profileKey) {
    this.criteriaProfile = profileKey;
    this.eventBus.emit(HPLC_EVENTS.CRITERIA_CHANGED, { criteriaProfile: profileKey });
  }

  setExerciseProfile(exerciseId) {
    this.exerciseProfileId = exerciseId;
    this.eventBus.emit(HPLC_EVENTS.EXERCISE_CHANGED, { exerciseProfileId: exerciseId });
  }

  getSampleEntity() {
    const mix = globalEntityRegistry.getMixture(this.simState.sampleKey);
    if (mix) {
      const resolvedComp = mix.components.map(c => ({
        compound:      globalEntityRegistry.getCompound(c.compoundId),
        concentration: c.concentration,
        role:          c.role
      })).filter(c => c.compound !== null);
      return { ...mix, components: resolvedComp };
    }
    const singleComp = globalEntityRegistry.getCompound(this.simState.sampleKey);
    return singleComp
      ? { name: singleComp.name, components: [{ compound: singleComp, concentration: 1.0 }] }
      : null;
  }

  getBufferEntity() {
    return globalEntityRegistry.get(this.simState.bufferKey);
  }

  updatePressure() {
    const baseP = getSystemPressure(this.simState.flowRate, this.simState.organicPercent, this.simState.temperature);
    const state = this.getState();

    let p = baseP;
    if (state === 'PRIMING') {
      const progress = Math.min(1.0, (this._primingTime || 0) / PRIMING_DURATION_MIN);
      p = baseP * (0.3 + 0.65 * progress) + (Math.sin(Date.now() / 100) * 4);
    } else if (state === 'EQUILIBRATING') {
      const progress = Math.min(1.0, (this._equilibratingTime || 0) / EQUILIBRATING_DURATION_MIN);
      const damp = (1.0 - progress);
      p = baseP + (Math.sin(Date.now() / 150) * 6 * damp);
    }

    p = Math.round(p);
    this.simState.pressure = p;
    this.eventBus.emit(HPLC_EVENTS.PRESSURE_CHANGED, { pressure: p });

    if (p > MAX_PRESSURE_BAR && this.getState() !== 'OVERPRESSURE') {
      this.simState.addWarning('🚨 OVERPRESSURE SHUTDOWN (> 400 bar)');
      this.clock.stop();
      this.stateMachine.transitionTo('OVERPRESSURE');
      this.eventBus.emit(HPLC_EVENTS.WARNING_RAISED, { warnings: this.simState.warnings });
    }
    return p;
  }

  startPump() {
    const p = this.updatePressure();
    if (p > MAX_PRESSURE_BAR) return false;

    const currentState = this.getState();
    if (currentState === 'COMPLETED' || currentState === 'STOPPED') {
      this.stateMachine.transitionTo('IDLE');
    }

    if (this.stateMachine.transitionTo('PRIMING')) {
      this._primingTime       = 0;
      this._equilibratingTime = 0;
      this.simState.time      = 0;
      this.clock.start();
      this.eventBus.emit(HPLC_EVENTS.PUMP_STARTED, {
        pressure: this.simState.pressure,
        status: 'PRIMING'
      });
      return true;
    }
    return false;
  }

  stopPump() {
    this.clock.stop();
    this.stateMachine.transitionTo('STOPPED');
    this.eventBus.emit(HPLC_EVENTS.STATUS_CHANGED, { newState: 'STOPPED' });
  }

  injectSample() {
    if (this.getState() !== 'READY') return false;

    this._lastRunWasBlank = false;
    this._detectedLiveSet.clear();

    if (!this.stateMachine.transitionTo('INJECTING')) return false;

    this.eventBus.emit(HPLC_EVENTS.INJECTING_STARTED, { delayMs: INJECTION_VALVE_DELAY_MS });

    const sampleEntity = this.getSampleEntity();
    const bufferEntity = this.getBufferEntity();
    const t0           = getDeadTime(this.simState.flowRate);
    let maxTR          = t0;

    this._expectedAnalytes = [];
    if (sampleEntity && sampleEntity.components) {
      for (const compDef of sampleEntity.components) {
        const compound = compDef.compound;
        if (!compound || !compound.chromatography) continue;
        const k  = getObservedRetentionFactor(compound, this.simState.organicPercent, this.simState.temperature, this.simState.pH, bufferEntity);
        const tR = getRetentionTime(t0, k);
        if (tR > maxTR) maxTR = tR;
        this._expectedAnalytes.push({ compound: compound.name, tR });
      }
    }
    this._expectedAnalytes.sort((a, b) => a.tR - b.tR);
    this.maxRunTimeMinutes = Math.max(2.5, maxTR + 1.2);

    setTimeout(() => {
      if (this.getState() !== 'INJECTING') return;

      this.simState.resetTime();
      this.simState.clearWarnings();
      this.chromatogram.clear();

      if (this.stateMachine.transitionTo('RUNNING')) {
        this.eventBus.emit(HPLC_EVENTS.RUN_STARTED, {
          sampleName:       sampleEntity ? sampleEntity.name : this.simState.sampleKey,
          estimatedMaxTime: this.maxRunTimeMinutes,
          expectedAnalytes: this._expectedAnalytes
        });
      }
    }, INJECTION_VALVE_DELAY_MS);

    return true;
  }

  injectBlank() {
    if (this.getState() !== 'READY') return false;

    this._lastRunWasBlank  = true;
    this._expectedAnalytes = [];
    this._detectedLiveSet.clear();

    if (!this.stateMachine.transitionTo('INJECTING')) return false;

    this.eventBus.emit(HPLC_EVENTS.INJECTING_STARTED, { delayMs: INJECTION_VALVE_DELAY_MS, isBlank: true });

    setTimeout(() => {
      if (this.getState() !== 'INJECTING') return;

      this.simState.resetTime();
      this.simState.clearWarnings();
      this.chromatogram.clear();
      this.maxRunTimeMinutes = 2.5;

      if (this.stateMachine.transitionTo('RUNNING')) {
        this.eventBus.emit(HPLC_EVENTS.RUN_STARTED, {
          sampleName:       'Blank (Solvent)',
          estimatedMaxTime: this.maxRunTimeMinutes,
          isBlank: true,
          expectedAnalytes: []
        });
      }
    }, INJECTION_VALVE_DELAY_MS);

    return true;
  }

  onTick(deltaSimMin, totalSimMin) {
    this.updatePressure();
    if (this.simState.pressure > MAX_PRESSURE_BAR) return;

    const state = this.getState();

    if (state === 'PRIMING') {
      this._primingTime += deltaSimMin;
      this.simState.time += deltaSimMin;

      const progress     = Math.min(1, this._primingTime / PRIMING_DURATION_MIN);
      const smoothFactor = 1 / (1 + Math.exp(-6 * (progress - 0.5)));
      const strokeRipple = 0.3 * Math.sin(this.simState.time * 200);
      const rampedPressure = Math.max(0, this.simState.pressure * smoothFactor + strokeRipple);

      const baselineSignal = getBaselineNoise(this.simState.time, this.simState.sensitivity, this.simState.wavelengthNm, this._noiseSeed);

      this.eventBus.emit(HPLC_EVENTS.TICK, {
        time:     this.simState.time,
        signal:   baselineSignal,
        pressure: rampedPressure,
        phase:    'PRIMING'
      });

      if (this._primingTime >= PRIMING_DURATION_MIN) {
        this.stateMachine.transitionTo('EQUILIBRATING');
        this._equilibratingTime = 0;
        this.eventBus.emit(HPLC_EVENTS.STATUS_CHANGED, { newState: 'EQUILIBRATING' });
      }
      return;
    }

    if (state === 'EQUILIBRATING') {
      this._equilibratingTime += deltaSimMin;
      this.simState.time      += deltaSimMin;

      const stabilityFraction = this._equilibratingTime / EQUILIBRATING_DURATION_MIN;
      const baselineSignal    = getBaselineNoise(this.simState.time, this.simState.sensitivity, this.simState.wavelengthNm, this._noiseSeed);

      this.eventBus.emit(HPLC_EVENTS.TICK, {
        time:      this.simState.time,
        signal:    baselineSignal,
        pressure:  this.simState.pressure,
        phase:     'EQUILIBRATING',
        stability: stabilityFraction
      });

      if (this._equilibratingTime >= EQUILIBRATING_DURATION_MIN) {
        this.stateMachine.transitionTo('READY');
        this.eventBus.emit(HPLC_EVENTS.STATUS_CHANGED, { newState: 'READY' });
        this.eventBus.emit(HPLC_EVENTS.BASELINE_STABILIZED, {
          baselineRMS: 0.0003,
          readyForInjection: true
        });
      }
      return;
    }

    if (state === 'READY') {
      this.simState.time += deltaSimMin;
      const baselineSignal = getBaselineNoise(this.simState.time, this.simState.sensitivity, this.simState.wavelengthNm, this._noiseSeed);

      this.eventBus.emit(HPLC_EVENTS.TICK, {
        time:     this.simState.time,
        signal:   baselineSignal,
        pressure: this.simState.pressure,
        phase:    'READY'
      });
      return;
    }

    if (state === 'INJECTING') {
      const baselineSignal = getBaselineNoise(this.simState.time, this.simState.sensitivity, this.simState.wavelengthNm, this._noiseSeed);
      this.eventBus.emit(HPLC_EVENTS.TICK, {
        time:     this.simState.time,
        signal:   baselineSignal,
        pressure: this.simState.pressure,
        phase:    'INJECTING'
      });
      return;
    }

    if (state === 'RUNNING') {
      this.simState.time += deltaSimMin;

      const sampleEntity = this.getSampleEntity();
      const bufferEntity = this.getBufferEntity();

      let synth = { signal: 0 };

      if (this._lastRunWasBlank) {
        synth.signal = getBaselineNoise(this.simState.time, this.simState.sensitivity, this.simState.wavelengthNm, this._noiseSeed);
      } else {
        synth = synthesizeInstantSignal(this.simState.time, sampleEntity, {
          flowRate:       this.simState.flowRate,
          organicPercent: this.simState.organicPercent,
          sensitivity:    this.simState.sensitivity,
          temperature:    this.simState.temperature,
          wavelengthNm:   this.simState.wavelengthNm,
          pH:             this.simState.pH,
          bufferEntity
        });
      }

      this.simState.detectorSignal = synth.signal;
      this.chromatogram.append(this.simState.time, synth.signal);

      if (this._expectedAnalytes.length > 0) {
        for (const item of this._expectedAnalytes) {
          if (!this._detectedLiveSet.has(item.compound) && Math.abs(this.simState.time - item.tR) < 0.08) {
            this._detectedLiveSet.add(item.compound);
            this.eventBus.emit(HPLC_EVENTS.PEAK_DETECTED_LIVE, {
              compound: item.compound,
              tR:       item.tR,
              time:     this.simState.time
            });
          }
        }
      }

      if (isDetectorSaturated(synth.signal)) {
        this.simState.addWarning('⚠️ DETECTOR SATURATED');
        this.eventBus.emit(HPLC_EVENTS.WARNING_RAISED, { warnings: this.simState.warnings });
      }

      this.eventBus.emit(HPLC_EVENTS.TICK, {
        time:     this.simState.time,
        signal:   synth.signal,
        pressure: this.simState.pressure,
        phase:    'RUNNING'
      });

      if (this.simState.time >= this.maxRunTimeMinutes) {
        this.completeRun(sampleEntity, bufferEntity);
      }
      return;
    }

    this.eventBus.emit(HPLC_EVENTS.TICK, {
      time:     this.simState.time,
      signal:   0,
      pressure: this.simState.pressure,
      phase:    state
    });
  }

  completeRun(sampleEntity, bufferEntity) {
    const t0   = getDeadTime(this.simState.flowRate);
    let peaks  = [];
    const educationalExplanations = [];

    const rawSamples = this.chromatogram.getPoints().map(p => ({ time: p.t, intensity: p.y }));

    const noiseEngine = new NoiseADCEngine();
    const noisePatch  = noiseEngine.process({
      signalPoints: rawSamples,
      noiseLevel:   0.0002,
      adcBitDepth:  16,
      fullScaleAU:  2.5,
      seed:         42
    });
    const digitizedSamples = noisePatch.digitizedPoints;

    const detectedPeaks = PeakDetectionEngine.detectPeaks(digitizedSamples);

    if (this._lastRunWasBlank) {
      const carryover = (this._lastNonBlankPeaks.length > 0 && detectedPeaks.length > 0);
      peaks = detectedPeaks.map(dp => new Peak({ ...dp, compound: 'System Blank / Ghost' }));

      const runResult = new RunResult({
        sampleName:  'Blank (Solvent)',
        isBlank:     true,
        carryoverDetected: carryover,
        methodParams: {
          flowRate:        this.simState.flowRate,
          organicPercent:  this.simState.organicPercent,
          temperature:     this.simState.temperature,
          wavelengthNm:    this.simState.wavelengthNm,
          pH:              this.simState.pH,
          bufferKey:       this.simState.bufferKey,
          sensitivity:     this.simState.sensitivity,
          criteriaProfile: this.criteriaProfile,
          exerciseProfileId: this.exerciseProfileId
        },
        peaks,
        elapsedTime: this.simState.time,
        maxPressure: this.simState.pressure,
        warnings:    this.simState.warnings,
        educationalExplanations: [
          carryover
            ? '⚠ Carryover Suspected: ghost peaks detected in solvent blank injection. Flush column or needle wash.'
            : '✅ Blank Run Valid: baseline stable, no sample carryover detected.'
        ],
        systemSuitability: { status: 'PASSED' },
        exerciseScore:     { totalScore: 100 }
      });

      this.stateMachine.transitionTo('COMPLETED');
      this.eventBus.emit(HPLC_EVENTS.RUN_COMPLETED, {
        runResult,
        exerciseProfile: getMethodExercise(this.exerciseProfileId),
        methodComparison: null,
        methodHistory: this.methodHistory.getRuns()
      });
      return;
    }

    const expectedAnalytes = [];
    if (sampleEntity && sampleEntity.components) {
      sampleEntity.components.forEach(compDef => {
        const compound = compDef.compound;
        if (!compound) return;
        const k      = getObservedRetentionFactor(compound, this.simState.organicPercent, this.simState.temperature, this.simState.pH, bufferEntity);
        const tR     = getRetentionTime(t0, k);
        const sigma  = getPeakSigma(tR, this.simState.flowRate, this.simState.temperature);
        expectedAnalytes.push({ compound, expectedTR: tR, sigma });

        const solEval = SolutionChemistryEngine.evaluateSolution(compound, k, this.simState.pH, bufferEntity, this.simState.wavelengthNm);
        if (solEval.explanation) educationalExplanations.push(solEval.explanation);
        if (solEval.warnings)    solEval.warnings.forEach(w => this.simState.addWarning(w));
      });
    }

    peaks = detectedPeaks.map(dp => {
      const match = expectedAnalytes.find(a =>
        Math.abs(a.expectedTR - dp.tR) <= Math.max(0.15, 2.5 * a.sigma)
      );
      return new Peak({ ...dp, compound: match ? match.compound.name : dp.compound });
    });

    peaks.sort((a, b) => a.tR - b.tR);
    this._lastNonBlankPeaks = peaks;

    const systemSuitability  = evaluateSystemSuitability(peaks, this.simState.flowRate, this.criteriaProfile);
    const exerciseProfile    = getMethodExercise(this.exerciseProfileId);
    const exerciseScore      = scoreMethodExercise({
      maxPressure: this.simState.pressure,
      elapsedTime: this.simState.time,
      peaks
    }, exerciseProfile);
    const bottleneckAnalysis = analyzeMethodBottlenecks({
      maxPressure:  this.simState.pressure,
      elapsedTime:  this.simState.time,
      methodParams: {
        flowRate:       this.simState.flowRate,
        organicPercent: this.simState.organicPercent,
        temperature:    this.simState.temperature,
        wavelengthNm:   this.simState.wavelengthNm,
        pH:             this.simState.pH
      },
      peaks
    }, exerciseProfile);

    const runResult = new RunResult({
      sampleName:  sampleEntity ? sampleEntity.name : this.simState.sampleKey,
      methodParams: {
        flowRate:        this.simState.flowRate,
        organicPercent:  this.simState.organicPercent,
        temperature:     this.simState.temperature,
        wavelengthNm:    this.simState.wavelengthNm,
        pH:              this.simState.pH,
        bufferKey:       this.simState.bufferKey,
        sensitivity:     this.simState.sensitivity,
        speedMultiplier: this.clock.speedMultiplier,
        criteriaProfile: this.criteriaProfile,
        exerciseProfileId: this.exerciseProfileId
      },
      peaks,
      elapsedTime:             this.simState.time,
      maxPressure:             this.simState.pressure,
      warnings:                this.simState.warnings,
      educationalExplanations: [...new Set(educationalExplanations)],
      systemSuitability,
      exerciseScore,
      bottleneckAnalysis
    });

    const prevRun         = this.methodHistory.getLastRun();
    this.methodHistory.addRun(runResult);
    const methodComparison= prevRun ? new MethodComparison(prevRun, runResult) : null;

    this.stateMachine.transitionTo('COMPLETED');
    this.eventBus.emit(HPLC_EVENTS.RUN_COMPLETED, {
      runResult,
      exerciseProfile,
      methodComparison,
      methodHistory: this.methodHistory.getRuns()
    });
  }
}
