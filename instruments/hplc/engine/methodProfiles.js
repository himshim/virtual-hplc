import { MethodProfile } from '../models/MethodProfile.js';

export const METHOD_EXERCISES = {
  QC_ASSAY: new MethodProfile({
    id: "QC_ASSAY",
    name: "QC Assay Exercise (General Separation)",
    description: "Develop a robust Quality Control method for the 4-component mixture. Achieve baseline resolution (Rs >= 1.5), N >= 3500, P <= 350 bar, and run time <= 8.0 min.",
    targetResolution: 1.5,
    targetPlates: 3500,
    targetCapacityMin: 1.0,
    targetCapacityMax: 10.0,
    maxPressureBar: 350,
    maxRunTimeMinutes: 8.0
  }),
  FAST_SCREENING: new MethodProfile({
    id: "FAST_SCREENING",
    name: "High Throughput Screening Exercise",
    description: "Optimize parameters for rapid screening. Priority on fast run time (<= 4.0 min) with acceptable separation (Rs >= 1.2) and pressure <= 380 bar.",
    targetResolution: 1.2,
    targetPlates: 2000,
    targetCapacityMin: 0.5,
    targetCapacityMax: 6.0,
    maxPressureBar: 380,
    maxRunTimeMinutes: 4.0
  }),
  HIGH_RESOLUTION: new MethodProfile({
    id: "HIGH_RESOLUTION",
    name: "High Resolution Separation Exercise",
    description: "Develop a high-resolution separation for complex samples. Target Rs >= 2.0, high column plates N >= 5000, and conservative pressure <= 320 bar.",
    targetResolution: 2.0,
    targetPlates: 5000,
    targetCapacityMin: 1.5,
    targetCapacityMax: 12.0,
    maxPressureBar: 320,
    maxRunTimeMinutes: 12.0
  })
};

export function getMethodExercise(profileId = "QC_ASSAY") {
  return METHOD_EXERCISES[profileId] || METHOD_EXERCISES.QC_ASSAY;
}
