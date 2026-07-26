/**
 * constants.js - HPLC Engine Physical Constants, Thresholds & Versioning
 */

export const SIMULATION_VERSION = "1.0.0";
export const MODEL_VERSION = "LSS-V1";

// Column & Hardware Constants (150 x 4.6mm C18 Column, 5µm particle)
export const COLUMN_VOID_VOLUME = 1.5;    // mL (V0)
export const MAX_PRESSURE_BAR = 400;       // Hardware shutdown limit in bar
export const WARNING_PRESSURE_BAR = 320;   // High pressure warning threshold in bar
export const SATURATION_AU = 2.5;          // Detector saturation limit in AU
export const BASE_VISCOSITY = 1.0;         // Water baseline viscosity cP

// Simulation Clock Defaults
export const TICK_MS = 50;                 // Clock tick frequency in milliseconds
export const DEFAULT_SPEED = 10;           // Default 10x simulation speed
export const SUPPORTED_SPEEDS = [1, 5, 10, 30, 60];

// Telemetry & Debug
export const DEBUG = false;
