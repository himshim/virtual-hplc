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
import { MAX_PRESSURE_BAR, TICK_MS, DEFAULT_SPEED, DEBUG } from '../engine/constants.js';

const HPLC_TRANSITION_RULES = {
  BOOTING: ['IDLE'],
  IDLE: ['READY', 'OVERPRESSURE'],
  READY: ['RUNNING', 'IDLE', 'STOPPED', 'OVERPRESSURE'],
  RUNNING: ['COMPLETED', 'STOPPED', 'OVERPRESSURE', 'DETECTOR_SATURATION'],
  COMPLETED: ['READY', 'IDLE'],
  STOPPED: ['READY', 'IDLE'],
  OVERPRESSURE: ['IDLE'],
  DETECTOR_SATURATION: ['READY', 'IDLE', 'STOPPED']
};

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
    this.simState.temperature = 25;
    this.simState.wavelengthNm = 254;
    this.simState.pH = 7.0; // Default neutral pH
    this.simState.bufferKey = "phosphate_buffer";

    this.chromatogram = new Chromatogram();
    this.methodHistory = new MethodHistory();
    this.criteriaProfile = "USP";
    this.exerciseProfileId = "QC_ASSAY";
    this.maxRunTimeMinutes = 5.0;

    this.updatePressure();
  }

  initialize() {
    this.stateMachine.transitionTo('IDLE');
    this.eventBus.emit('instrumentInitialized', { instrumentId: 'HPLC' });
  }

  configure(configParams = {}) {
    if (configParams.flowRate) this.setFlowRate(configParams.flowRate);
    if (configParams.organicPercent) this.setOrganicPercent(configParams.organicPercent);
    if (configParams.temperature) this.setTemperature(configParams.temperature);
    if (configParams.wavelengthNm) this.setWavelength(configParams.wavelengthNm);
    if (configParams.pH) this.setPh(configParams.pH);
    if (configParams.bufferKey) this.setBufferKey(configParams.bufferKey);
    if (configParams.sampleKey) this.setSampleKey(configParams.sampleKey);
  }

  run() { return this.injectSample(); }
  stop() { return this.stopPump(); }
  evaluate(runResult) { return scoreMethodExercise(runResult, getMethodExercise(this.exerciseProfileId)); }
  report(runResult) { return runResult; }

  setFlowRate(flowRate) { this.simState.flowRate = Number(flowRate); this.updatePressure(); }
  setOrganicPercent(organicPercent) { this.simState.organicPercent = Number(organicPercent); this.updatePressure(); }
  setTemperature(tempCelsius) { this.simState.temperature = Number(tempCelsius); this.updatePressure(); }
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

  setSensitivity(sensitivity) { this.simState.sensitivity = Number(sensitivity); }
  setSampleKey(sampleKey) { this.simState.sampleKey = sampleKey; }
  setCriteriaProfile(profileKey) {
    this.criteriaProfile = profileKey;
    this.eventBus.emit('criteriaChanged', { criteriaProfile: profileKey });
  }
  setExerciseProfile(exerciseId) {
    this.exerciseProfileId = exerciseId;
    this.eventBus.emit('exerciseChanged', { exerciseProfileId: exerciseId });
  }

  getSampleEntity() {
    const mix = globalEntityRegistry.getMixture(this.simState.sampleKey);
    if (mix) {
      const resolvedComp = mix.components.map(c => ({
        compound: globalEntityRegistry.getCompound(c.compoundId),
        concentration: c.concentration,
        role: c.role
      })).filter(c => c.compound !== null);
      return { ...mix, components: resolvedComp };
    }
    const singleComp = globalEntityRegistry.getCompound(this.simState.sampleKey);
    return singleComp ? { name: singleComp.name, components: [{ compound: singleComp, concentration: 1.0 }] } : null;
  }

  getBufferEntity() {
    return globalEntityRegistry.get(this.simState.bufferKey);
  }

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

  startPump() {
    const p = this.updatePressure();
    if (p > MAX_PRESSURE_BAR) return false;
    if (this.stateMachine.transitionTo('READY')) {
      this.clock.start();
      return true;
    }
    return false;
  }

  stopPump() {
    this.clock.stop();
    this.stateMachine.transitionTo('STOPPED');
  }

  injectSample() {
    if (this.getState() !== 'READY') return false;

    this.simState.resetTime();
    this.simState.clearWarnings();
    this.chromatogram.clear();

    const sampleEntity = this.getSampleEntity();
    const bufferEntity = this.getBufferEntity();
    const t0 = getDeadTime(this.simState.flowRate);
    let maxTR = t0;

    if (sampleEntity && sampleEntity.components) {
      for (const compDef of sampleEntity.components) {
        const compound = compDef.compound;
        if (!compound || !compound.chromatography) continue;
        const k = getObservedRetentionFactor(compound, this.simState.organicPercent, this.simState.temperature, this.simState.pH, bufferEntity);
        const tR = getRetentionTime(t0, k);
        if (tR > maxTR) maxTR = tR;
      }
    }
    this.maxRunTimeMinutes = Math.max(2.5, maxTR + 1.2);

    if (this.stateMachine.transitionTo('RUNNING')) {
      this.eventBus.emit('runStarted', {
        sampleName: sampleEntity ? sampleEntity.name : this.simState.sampleKey,
        estimatedMaxTime: this.maxRunTimeMinutes
      });
      return true;
    }
    return false;
  }

  onTick(deltaSimMin, totalSimMin) {
    this.updatePressure();
    if (this.simState.pressure > MAX_PRESSURE_BAR) return;

    const state = this.getState();

    if (state === 'RUNNING') {
      this.simState.time += deltaSimMin;
      const sampleEntity = this.getSampleEntity();
      const bufferEntity = this.getBufferEntity();

      const synth = synthesizeInstantSignal(this.simState.time, sampleEntity, {
        flowRate: this.simState.flowRate,
        organicPercent: this.simState.organicPercent,
        sensitivity: this.simState.sensitivity,
        temperature: this.simState.temperature,
        wavelengthNm: this.simState.wavelengthNm,
        pH: this.simState.pH,
        bufferEntity
      });

      this.simState.detectorSignal = synth.signal;
      this.chromatogram.append(this.simState.time, synth.signal);

      if (isDetectorSaturated(synth.signal)) {
        this.simState.addWarning('⚠️ DETECTOR SATURATED');
        this.eventBus.emit('warningRaised', { warnings: this.simState.warnings });
      }

      this.eventBus.emit('tick', {
        time: this.simState.time,
        signal: synth.signal,
        pressure: this.simState.pressure
      });

      if (this.simState.time >= this.maxRunTimeMinutes) {
        this.completeRun(sampleEntity, bufferEntity);
      }
    } else {
      this.eventBus.emit('tick', { time: this.simState.time, signal: 0, pressure: this.simState.pressure });
    }
  }

  completeRun(sampleEntity, bufferEntity) {
    const t0 = getDeadTime(this.simState.flowRate);
    let peaks = [];
    const educationalExplanations = [];

    // 1. Digital ADC Signal Sampling
    const rawSamples = this.chromatogram.getPoints().map(p => ({ time: p.x, intensity: p.y }));

    // 2. Pure Detector-Agnostic CDS Peak Detection Engine
    const detectedPeaks = PeakDetectionEngine.detectPeaks(rawSamples);

    // 3. Downstream Peak Identification & Solution Chemistry Evaluation
    const expectedAnalytes = [];
    if (sampleEntity && sampleEntity.components) {
      sampleEntity.components.forEach(compDef => {
        const compound = compDef.compound;
        const k = getObservedRetentionFactor(compound, this.simState.organicPercent, this.simState.temperature, this.simState.pH, bufferEntity);
        const tR = getRetentionTime(t0, k);
        const sigma = getPeakSigma(tR, this.simState.flowRate, this.simState.temperature);
        expectedAnalytes.push({ compound, expectedTR: tR, sigma });

        const solEval = SolutionChemistryEngine.evaluateSolution(compound, k, this.simState.pH, bufferEntity, this.simState.wavelengthNm);
        if (solEval.explanation) educationalExplanations.push(solEval.explanation);
        if (solEval.warnings) solEval.warnings.forEach(w => this.simState.addWarning(w));
      });
    }

    // Match detected digital peaks against expected analyte retention windows
    peaks = detectedPeaks.map(dp => {
      const match = expectedAnalytes.find(a => Math.abs(a.expectedTR - dp.tR) <= Math.max(0.15, 2.5 * a.sigma));
      const compoundName = match ? match.compound.name : dp.compound;
      return new Peak({
        ...dp,
        compound: compoundName
      });
    });

    peaks.sort((a, b) => a.tR - b.tR);

    const systemSuitability = evaluateSystemSuitability(peaks, this.simState.flowRate, this.criteriaProfile);
    const exerciseProfile = getMethodExercise(this.exerciseProfileId);
    const exerciseScore = scoreMethodExercise({ maxPressure: this.simState.pressure, elapsedTime: this.simState.time, peaks }, exerciseProfile);
    const bottleneckAnalysis = analyzeMethodBottlenecks({ maxPressure: this.simState.pressure, elapsedTime: this.simState.time, methodParams: { flowRate: this.simState.flowRate, organicPercent: this.simState.organicPercent, temperature: this.simState.temperature, wavelengthNm: this.simState.wavelengthNm, pH: this.simState.pH }, peaks }, exerciseProfile);

    const runResult = new RunResult({
      sampleName: sampleEntity ? sampleEntity.name : this.simState.sampleKey,
      methodParams: {
        flowRate: this.simState.flowRate,
        organicPercent: this.simState.organicPercent,
        temperature: this.simState.temperature,
        wavelengthNm: this.simState.wavelengthNm,
        pH: this.simState.pH,
        bufferKey: this.simState.bufferKey,
        sensitivity: this.simState.sensitivity,
        speedMultiplier: this.clock.speedMultiplier,
        criteriaProfile: this.criteriaProfile,
        exerciseProfileId: this.exerciseProfileId
      },
      peaks,
      elapsedTime: this.simState.time,
      maxPressure: this.simState.pressure,
      warnings: this.simState.warnings,
      educationalExplanations: [...new Set(educationalExplanations)],
      systemSuitability,
      exerciseScore,
      bottleneckAnalysis
    });

    const prevRun = this.methodHistory.getLastRun();
    this.methodHistory.addRun(runResult);
    const methodComparison = prevRun ? new MethodComparison(prevRun, runResult) : null;

    this.stateMachine.transitionTo('COMPLETED');
    this.eventBus.emit('runCompleted', {
      runResult,
      exerciseProfile,
      methodComparison,
      methodHistory: this.methodHistory.getRuns()
    });
  }
}
