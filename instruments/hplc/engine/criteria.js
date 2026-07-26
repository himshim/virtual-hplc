/**
 * criteria.js - Pharmacopeial & Educational System Suitability Criteria Registry
 */

export const CRITERIA_REGISTRY = {
  USP: {
    id: "USP",
    name: "United States Pharmacopeia (USP)",
    resolutionMin: 1.5,
    platesMin: 2000,
    capacityMin: 1.0,
    capacityMax: 10.0,
    tailingMin: 0.8,
    tailingMax: 1.5
  },
  EP: {
    id: "EP",
    name: "European Pharmacopoeia (EP)",
    resolutionMin: 1.5,
    platesMin: 2000,
    capacityMin: 1.0,
    capacityMax: 10.0,
    tailingMin: 0.8,
    tailingMax: 1.5
  },
  IP: {
    id: "IP",
    name: "Indian Pharmacopoeia (IP)",
    resolutionMin: 1.5,
    platesMin: 2000,
    capacityMin: 1.0,
    capacityMax: 10.0,
    tailingMin: 0.8,
    tailingMax: 1.5
  },
  TEACHING: {
    id: "TEACHING",
    name: "Teaching Mode (Permissive)",
    resolutionMin: 1.2,
    platesMin: 1000,
    capacityMin: 0.5,
    capacityMax: 15.0,
    tailingMin: 0.5,
    tailingMax: 2.0
  },
  RESEARCH: {
    id: "RESEARCH",
    name: "Research / High Precision Mode",
    resolutionMin: 2.0,
    platesMin: 5000,
    capacityMin: 2.0,
    capacityMax: 8.0,
    tailingMin: 0.9,
    tailingMax: 1.2
  }
};

export function getCriteria(profileKey = "USP") {
  return CRITERIA_REGISTRY[profileKey] || CRITERIA_REGISTRY.USP;
}
