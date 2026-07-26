import { SimulationController } from '../../../core/SimulationController.js';
import { globalEntityRegistry } from '../../../chemistry/registry/EntityRegistry.js';
import { bootstrapChemistryRegistry } from '../../../chemistry/registry/bootstrapRegistry.js';
import { SolutionChemistryEngine } from '../../../chemistry/engine/solutionChemistryEngine.js';
import { UV_DETECTOR_PLUGIN } from '../../../chemistry/detectors/uvDetector.js';
import { SimulationState } from '../models/SimulationState.js';
import { Chromatogram } from '../models/Chromatogram.js';
import { RunResult } from '../models/RunResult.js';
import { Peak } from '../models/Peak.js';
import { MethodHistory } from '../models/MethodHistory.js';
import { MethodComparison } from '../models/MethodComparison.js';
import { getSystemPressure } from '../engine/pressure.js';
import { getDeadTime, getRetentionTime, getObservedRetentionFactor } from '../engine/retention.js';
import { getPeakSigma } from '../engine/peak.js';
import { isDetectorSaturated } from '../engine/detector.js';
import { synthesizeInstantSignal } from '../engine/chromatogramEngine.js';
import { evaluateSystemSuitability, calculatePeakWidths } from '../engine/suitability.js';
import { getMethodExercise } from '../engine/methodProfiles.js';
import { analyzeMethodBottlenecks } from '../engine/optimizationEngine.js';
import { scoreMethodExercise } from '../engine/scoringEngine.js';
import { PeakDetectionEngine } from '../engine/peakDetectionEngine.js';
import { NoiseADCEngine } from '../engine/noiseADCEngine.js';
import { MAX_PRESSURE_BAR, TICK_MS, DEFAULT_SPEED, DEBUG } from '../engine/constants.js';

/**
 * CDS Acquisition Lifecycle State Machine
 *
 * Real HPLC CDS workflow:
 *   IDLE → PRIMING → EQUILIBRATING → READY → RUNNING → COMPLETED
 *
 * PRIMING      : Pressure ramp, live baseline noise rendered, ~0.4 sim-min
 * EQUILIBRATING: Baseline stabilising, convergence check, ~1.0 sim-min
 * READY        : Inject Sample button enabled, baseline locked
 * RUNNING      : Full chromatogram acquisition from t = 0.00
 * COMPLETED    : Results reported, replay available
 */
const HPLC_TRANSITION_RULES = {
  BOOTING:         ['IDLE'],
  IDLE:            ['PRIMING', 'OVERPRESSURE'],
  PRIMING:         ['EQUILIBRATING', 'IDLE', 'STOPPED', 'OVERPRESSURE'],
  EQUILIBRATING:   ['READY', 'IDLE', 'STOPPED', 'OVERPRESSURE'],
  READY:           ['RUNNING', 'IDLE', 'STOPPED', 'OVERPRESSURE'],
  RUNNING:         ['COMPLETED', 'STOPPED', 'OVERPRESSURE', 'DETECTOR_SATURATION'],
  COMPLETED:       ['PRIMING', 'IDLE'],
  STOPPED:         ['PRIMING', 'IDLE'],
  OVERPRESSURE:    ['IDLE'],
  DETECTOR_SATURATION: ['READY', 'IDLE', 'STOPPED']
};

// Simulated time (minutes) to spend in each pre-acquisition phase
const PRIMING_DURATION_MIN      = 0.40;
const EQUILIBRATING_DURATION_MIN= 1.10;

// Baseline noise during equilibration (AU RMS) — realistic detector baseline drift
const BASELINE_NOISE_AMPLITUDE  = 0.0005;
const BASELINE_DRIFT_PERIOD_MIN = 8.0;   // slow sinusoidal drift period

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

    // Phase timing accumulators (simulated minutes)
    this._primingTime      = 0;
    this._equilibratingTime= 0;

    // Seeded RNG state for deterministic baseline noise
    this._noiseSeed = 12345;

    this.updatePressure();
  }

  initialize() {
    this.stateMachine.transitionTo('IDLE');
    this.eventBus.emit('instrumentInitialized', { instrumentId: 'HPLC' });
  }

  configure(configParams = {}) {
    if (configParams.flowRate)     this.setFlowRate(configParams.flowRate);
    if (configParams.organicPercent) this.setOrganicPercent(configParams.organicPercent);
    if (configParams.temperature)  this.setTemperature(configParams.temperature);
    if (configParams.wavelengthNm) this.setWavelength(configParams.wavelengthNm);
    if (configParams.pH)           this.setPh(configParams.pH);
    if (configParams.bufferKey)    this.setBufferKey(configParams.bufferKey);
    if (configParams.sampleKey)    this.setSampleKey(configParams.sampleKey);
  }

  run()    { return this.injectSample(); }
  stop()   { return this.stopPump(); }
  evaluate(runResult) { return scoreMethodExercise(runResult, getMethodExercise(this.exerciseProfileId)); }
  report(runResult)   { return runResult; }

  /* ── Setters ────────────────────────────────────────────────────────────── */

  setFlowRate(flowRate)             { this.simState.flowRate       = Number(flowRate);      this.updatePressure(); }
  setOrganicPercent(organicPercent) { this.simState.organicPercent = Number(organicPercent); this.updatePressure(); }
  setTemperature(tempCelsius)       { this.simState.temperature    = Number(tempCelsius);   this.updatePressure(); }
  setSensitivity(sensitivity)       { this.simState.sensitivity    = Number(sensitivity); }
  setSampleKey(sampleKey)           { this.simState.sampleKey      = sampleKey; }

  setWavelength(wavelengthNm) {
    this.simState.wavelengthNm = Number(wavelengthNm);
    this.eventBus.emit('wavelengthChanged', { wavelengthNm: this.simState.wavelengthNm });
  }

  setPh(pH) {
    this.simState.pH = Number(pH);
    this.eventBus.emit('phChanged', { pH: this.simState.pH });
  }

  setBufferKey(bufferKey) {
    this.simState.bufferKey = bufferKey;
    this.eventBus.emit('bufferChanged', { bufferKey });
  }

  setCriteriaProfile(profileKey) {
    this.criteriaProfile = profileKey;
    this.eventBus.emit('criteriaChanged', { criteriaProfile: profileKey });
  }

  setExerciseProfile(exerciseId) {
    this.exerciseProfileId = exerciseId;
    this.eventBus.emit('exerciseChanged', { exerciseProfileId: exerciseId });
  }

  /* ── Entity Lookups ─────────────────────────────────────────────────────── */

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

  /* ── Pressure ───────────────────────────────────────────────────────────── */

  updatePressure() {
    const p = getSystemPressure(this.simState.flowRate, this.simState.organicPercent, this.simState.temperature);
    this.simState.pressure = p;
    this.eventBus.emit('pressureChanged', { pressure: p });

    if (p > MAX_PRESSURE_BAR && this.getState() !== 'OVERPRESSURE') {
      this.simState.addWarning('🚨 OVERPRESSURE SHUTDOWN (> 400 bar)');
      this.clock.stop();
      this.stateMachine.transitionTo('OVERPRESSURE');
      this.eventBus.emit('warningRaised', { warnings: this.simState.warnings });
    }
    return p;
  }

  /* ── Pump Control ───────────────────────────────────────────────────────── */

  /**
   * Start the pump. Transitions IDLE → PRIMING.
   * Baseline will be rendered immediately in onTick.
   */
  startPump() {
    const p = this.updatePressure();
    if (p > MAX_PRESSURE_BAR) return false;

    const currentState = this.getState();
    // Allow restart from COMPLETED or STOPPED
    if (currentState === 'COMPLETED' || currentState === 'STOPPED') {
      this.stateMachine.transitionTo('IDLE');
    }

    if (this.stateMachine.transitionTo('PRIMING')) {
      this._primingTime       = 0;
      this._equilibratingTime = 0;
      this.simState.time      = 0;   // baseline clock from 0
      this.clock.start();
      this.eventBus.emit('pumpStarted', {
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
    this.eventBus.emit('statusChanged', { status: 'STOPPED' });
  }

  /* ── Sample Injection ───────────────────────────────────────────────────── */

  /**
   * Inject sample. READY → RUNNING.
   * Clears acquisition and resets time to 0.00 (CDS standard behaviour).
   */
  injectSample() {
    if (this.getState() !== 'READY') return false;

    this.simState.resetTime();
    this.simState.clearWarnings();
    this.chromatogram.clear();

    const sampleEntity = this.getSampleEntity();
    const bufferEntity = this.getBufferEntity();
    const t0           = getDeadTime(this.simState.flowRate);
    let maxTR          = t0;

    if (sampleEntity && sampleEntity.components) {
      for (const compDef of sampleEntity.components) {
        const compound = compDef.compound;
        if (!compound || !compound.chromatography) continue;
        const k  = getObservedRetentionFactor(compound, this.simState.organicPercent, this.simState.temperature, this.simState.pH, bufferEntity);
        const tR = getRetentionTime(t0, k);
        if (tR > maxTR) maxTR = tR;
      }
    }
    this.maxRunTimeMinutes = Math.max(2.5, maxTR + 1.2);

    if (this.stateMachine.transitionTo('RUNNING')) {
      this.eventBus.emit('runStarted', {
        sampleName:       sampleEntity ? sampleEntity.name : this.simState.sampleKey,
        estimatedMaxTime: this.maxRunTimeMinutes
      });
      return true;
    }
    return false;
  }

  /**
   * Run Blank injection — no sample, shows only baseline + noise.
   * Completes after maxRunTimeMinutes.
   */
  injectBlank() {
    if (this.getState() !== 'READY') return false;

    this.simState.resetTime();
    this.simState.clearWarnings();
    this.chromatogram.clear();
    this.maxRunTimeMinutes = 2.5;

    if (this.stateMachine.transitionTo('RUNNING')) {
      this.eventBus.emit('runStarted', {
        sampleName:       'Blank',
        estimatedMaxTime: this.maxRunTimeMinutes,
        isBlank: true
      });
      return true;
    }
    return false;
  }

  /* ── Tick Handler ───────────────────────────────────────────────────────── */

  onTick(deltaSimMin, totalSimMin) {
    this.updatePressure();
    if (this.simState.pressure > MAX_PRESSURE_BAR) return;

    const state = this.getState();

    /* ── PRIMING phase: rising pressure, live baseline ────────────────────── */
    if (state === 'PRIMING') {
      this._primingTime += deltaSimMin;
      this.simState.time += deltaSimMin;

      const pressureRampFraction = Math.min(1, this._primingTime / PRIMING_DURATION_MIN);
      const rampedPressure = this.simState.pressure * pressureRampFraction;

      const baselineSignal = this._generateBaselineNoise(this.simState.time);

      this.eventBus.emit('tick', {
        time:     this.simState.time,
        signal:   baselineSignal,
        pressure: rampedPressure,
        phase:    'PRIMING'
      });

      if (this._primingTime >= PRIMING_DURATION_MIN) {
        this.stateMachine.transitionTo('EQUILIBRATING');
        this._equilibratingTime = 0;
        this.eventBus.emit('statusChanged', { status: 'EQUILIBRATING' });
      }
      return;
    }

    /* ── EQUILIBRATING phase: baseline stabilizing ────────────────────────── */
    if (state === 'EQUILIBRATING') {
      this._equilibratingTime += deltaSimMin;
      this.simState.time      += deltaSimMin;

      // Baseline amplitude decays toward stable flat line
      const stabilityFraction = this._equilibratingTime / EQUILIBRATING_DURATION_MIN;
      const driftAmplitude    = BASELINE_NOISE_AMPLITUDE * (1.0 - stabilityFraction * 0.6);
      const baselineSignal    = this._generateBaselineNoise(this.simState.time, driftAmplitude);

      this.eventBus.emit('tick', {
        time:      this.simState.time,
        signal:    baselineSignal,
        pressure:  this.simState.pressure,
        phase:     'EQUILIBRATING',
        stability: stabilityFraction
      });

      if (this._equilibratingTime >= EQUILIBRATING_DURATION_MIN) {
        this.stateMachine.transitionTo('READY');
        this.eventBus.emit('statusChanged', { status: 'READY' });
        this.eventBus.emit('baselineStabilized', {
          baselineRMS: driftAmplitude,
          readyForInjection: true
        });
      }
      return;
    }

    /* ── READY phase: baseline holding, waiting for injection ─────────────── */
    if (state === 'READY') {
      this.simState.time += deltaSimMin;
      const baselineSignal = this._generateBaselineNoise(this.simState.time, BASELINE_NOISE_AMPLITUDE * 0.3);

      this.eventBus.emit('tick', {
        time:     this.simState.time,
        signal:   baselineSignal,
        pressure: this.simState.pressure,
        phase:    'READY'
      });
      return;
    }

    /* ── RUNNING phase: full acquisition ──────────────────────────────────── */
    if (state === 'RUNNING') {
      this.simState.time += deltaSimMin;

      const sampleEntity = this.getSampleEntity();
      const bufferEntity = this.getBufferEntity();

      const synth = synthesizeInstantSignal(this.simState.time, sampleEntity, {
        flowRate:       this.simState.flowRate,
        organicPercent: this.simState.organicPercent,
        sensitivity:    this.simState.sensitivity,
        temperature:    this.simState.temperature,
        wavelengthNm:   this.simState.wavelengthNm,
        pH:             this.simState.pH,
        bufferEntity
      });

      this.simState.detectorSignal = synth.signal;
      this.chromatogram.append(this.simState.time, synth.signal);

      if (isDetectorSaturated(synth.signal)) {
        this.simState.addWarning('⚠️ DETECTOR SATURATED');
        this.eventBus.emit('warningRaised', { warnings: this.simState.warnings });
      }

      this.eventBus.emit('tick', {
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

    // All other states: emit keepalive tick
    this.eventBus.emit('tick', {
      time:     this.simState.time,
      signal:   0,
      pressure: this.simState.pressure,
      phase:    state
    });
  }

  /* ── Baseline Noise Generator ───────────────────────────────────────────── */

  /**
   * Deterministic pseudo-random baseline noise + slow sinusoidal drift.
   * Deterministic so replays are reproducible.
   */
  _generateBaselineNoise(t, amplitude = BASELINE_NOISE_AMPLITUDE) {
    // Park-Miller LCG for deterministic noise
    this._noiseSeed = (this._noiseSeed * 16807) % 2147483647;
    const rand = (this._noiseSeed / 2147483647) - 0.5; // [-0.5, 0.5]

    // Slow sinusoidal baseline drift (mimics thermal drift)
    const drift = amplitude * 0.4 * Math.sin((2 * Math.PI * t) / BASELINE_DRIFT_PERIOD_MIN);

    return amplitude * rand + drift;
  }

  /* ── Run Completion ─────────────────────────────────────────────────────── */

  completeRun(sampleEntity, bufferEntity) {
    const t0   = getDeadTime(this.simState.flowRate);
    let peaks  = [];
    const educationalExplanations = [];

    // 1. Raw Detector Signal Points
    const rawSamples = this.chromatogram.getPoints().map(p => ({ time: p.t, intensity: p.y }));

    // 2. Physical Baseline Noise & ADC Quantization Engine
    const noiseEngine = new NoiseADCEngine();
    const noisePatch  = noiseEngine.process({
      signalPoints: rawSamples,
      noiseLevel:   0.0002,
      adcBitDepth:  16,
      fullScaleAU:  2.5,
      seed:         42
    });
    const digitizedSamples = noisePatch.digitizedPoints;

    // 3. CDS Peak Detection Engine (v1.1 — inter-apex minimum search)
    const detectedPeaks = PeakDetectionEngine.detectPeaks(digitizedSamples);

    // 4. Peak Identification — match detected digital peaks to expected analytes
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

    // Match detected peaks to expected analytes within ±(15% tR or 2.5σ) window
    peaks = detectedPeaks.map(dp => {
      const match = expectedAnalytes.find(a =>
        Math.abs(a.expectedTR - dp.tR) <= Math.max(0.15, 2.5 * a.sigma)
      );
      return new Peak({ ...dp, compound: match ? match.compound.name : dp.compound });
    });

    peaks.sort((a, b) => a.tR - b.tR);

    // 5. System Suitability & Scoring
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
    this.eventBus.emit('runCompleted', {
      runResult,
      exerciseProfile,
      methodComparison,
      methodHistory: this.methodHistory.getRuns()
    });
  }
}
