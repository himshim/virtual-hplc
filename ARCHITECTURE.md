# Platform Architecture & Instrument Plugin Specification

This document details the core architectural principles, module boundaries, and plugin contracts for the Virtual Analytical Laboratory platform.

---

## 1. Core Architectural Principles

1. **Strict UI / Engine Decoupling**:
   - **UI Layer** (`/instruments/<name>/ui/`): Zero imports from physics simulation equations. Subscribes exclusively to `EventBus` signals.
   - **Physics Engine Layer** (`/instruments/<name>/engine/`): Pure scientific calculations. Zero DOM references or UI state dependencies.
2. **Centralized Event Registry (`HPLC_EVENTS`)**:
   - All state transitions, parameter changes, warnings, and tick updates communicate via immutable event payloads across `EventBus`.
3. **Single-Instance GPU Canvas**:
   - Graph viewports use a single Chart.js / HTML5 2D canvas context. No duplicate canvas elements or desynchronized sparkline copies.
4. **Instrument Plugin Contract**:
   - Every instrument module implements 3 standard lifecycle endpoints:
     - `initialize()`: Registers entities, state machines, and event subscribers.
     - `reset()`: Returns instrument to initial baseline parameters.
     - `getReportData()`: Exports standardized run data for validation and notebook storage.

---

## 2. Directory Hierarchy

```text
virtual-analytical-lab/
├── index.html                    # Platform Instrument Catalog / Landing Page
├── DESIGN.md                     # Semantic Design System & UI Specs
├── ARCHITECTURE.md               # Core Engineering & Plugin Architecture
├── README.md                     # Project Setup & Execution Guide
├── css/
│   └── global.css                # Platform-wide CSS variables & layout design tokens
├── instruments/
│   └── hplc/                     # High-Performance Liquid Chromatography Plugin
│       ├── index.html            # HPLC Instrument Workspace
│       ├── controller/           # State Coordinator & Event Orchestrator
│       ├── engine/               # Retention, Pressure, Peak & Gradient Calculations
│       ├── ui/                   # Graph, Telemetry, Steppers, & Notebook Components
│       └── validation/           # Scientific Benchmarks & Playwright Test Suites
└── docs/
    └── validation/               # Supporting Validation Reports & Visual Screenshots
```

---

## 3. Extending the Platform: Instrument Plugin Contract

To introduce a new instrument (such as a **UV-Vis Spectrophotometer** or **Gas Chromatograph**):

1. **Create Directory**: `instruments/<instrument_id>/`
2. **Implement Engine**: Create pure physics simulation modules in `engine/`.
3. **Implement Controller**: Create `Controller` extending core state machine and event bus.
4. **Implement UI**: Use semantic design tokens from `DESIGN.md` for graph viewport, steppers, and telemetry.
5. **Add Validation Gate**: Create `ciArchitectureCheck.js` enforcing UI/Engine boundaries and scientific accuracy benchmarks.
