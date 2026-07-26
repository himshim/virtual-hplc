# Virtual Analytical Lab — Architecture Constitution 📜

This document defines the strict architectural rules, boundaries, and design principles that all instrument simulations within **Virtual Analytical Lab** must follow.

---

## 🏛️ Core Principles

### 1. Pure Scientific Engine Layer (`engine/`)
- Scientific calculation modules must be **pure functions**.
- Scientific engine files must have **ZERO dependencies** on the DOM (`document`, `window`, HTML elements), UI libraries (Chart.js, D3), or UI controllers.
- Given identical inputs, engine functions must return identical, deterministic outputs.

### 2. Pure Domain Models (`models/`)
- Domain model classes (e.g., `SimulationState`, `Chromatogram`, `RunResult`, `Peak`) contain **data structure definitions, getters, and setters only**.
- Domain models do NOT contain scientific calculations or UI rendering logic.
- Historical graph/time-series data (`Chromatogram`) is owned separately from instant real-time state (`SimulationState`).

### 3. Decoupled Event-Driven UI (`ui/`)
- UI components (`graph.js`, `controls.js`, `display.js`) interact with the simulation **exclusively through event listeners** (`EventBus`).
- The UI never performs scientific calculations or directly updates mathematical models.
- The UI renders view updates reactively upon receiving events from the controller.

### 4. Controller Ownership (`controller/` & `core/`)
- The `SimulationController` is the **sole orchestrator** of instrument state transitions and clock ticks.
- State mutation is strictly restricted to controller action handlers.
- Instruments extend or compose the shared generic `core/` framework (`SimulationClock`, `StateMachine`, `EventBus`, `SimulationController`).

### 5. Multi-Instrument Isolation
- Each instrument simulator (e.g., `instruments/hplc/`, `instruments/uv/`, `instruments/gc/`) operates in its own isolated directory structure while sharing generic `core/` utilities.
- Instruments must not mutate or depend on private internal states of other instruments.

### 6. Legacy Code Migration Policy
- Legacy monolithic code may be preserved during active refactoring for verification.
- Once modular implementations pass all functional, scientific, and regression verification tiers, legacy files must be completely removed.

---

## 🏷️ Versioning & Telemetry
- Every instrument must declare `SIMULATION_VERSION` and `MODEL_VERSION` constants.
- Generated experiment reports (`RunResult`) must include complete metadata (timestamps, parameters, software version) for reproducibility.
