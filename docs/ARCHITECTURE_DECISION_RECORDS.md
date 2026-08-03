# 🏛️ Architecture Decision Records (ADRs) — Virtual Analytical Lab

This document records key architectural decisions, context, and rationale for the Virtual Analytical Lab platform foundation.

---

## ADR 001: Centralized Plugin Registry over Hardcoded Routing
- **Status**: **ACCEPTED**
- **Context**: Early iterations used conditional branching (`if (instrument === 'hplc')`). Adding new instruments required modifying platform controllers.
- **Decision**: Implement `PluginRegistry` (`core/PluginRegistry.js`). Instruments register dynamically via `platformPluginRegistry.register(plugin)`.
- **Consequences**: Zero platform code modifications required when adding new analytical instrument plugins.

---

## ADR 002: Headless Instrument Controllers
- **Status**: **ACCEPTED**
- **Context**: UI code mixed DOM queries with simulation state loops, causing tight coupling and rendering bugs.
- **Decision**: All instrument controllers (`HplcController.js`, `UvVisController.js`) MUST be 100% headless with **zero DOM references** (`document.getElementById`). Communication uses `EventBus`.
- **Consequences**: Controllers can be unit-tested in Node environments without a browser DOM. Presentation layer (`UiCoordinator`) is cleanly decoupled.

---

## ADR 003: Manifest-Driven Capabilities & JSON Schema Validation
- **Status**: **ACCEPTED**
- **Context**: Platform needed to query instrument capabilities (graph type, prediction, notebook) without inspecting source code.
- **Decision**: Every plugin supplies `manifest.json` validated against `core/manifest.schema.json` via `ManifestValidator`.
- **Consequences**: Automated validation catches missing fields, semver errors, and cross-field inconsistencies at registration time.

---

## ADR 004: Instrument-Specific Educational Engines
- **Status**: **ACCEPTED**
- **Context**: Educational logic differs fundamentally between analytical techniques (e.g. HPLC separation vs Beer-Lambert spectrophotometric absorption).
- **Decision**: Keep educational content and 4-step teacher diagnoses inside instrument-specific educational engines (`EducationalEngine.js`, `UvVisEducationalEngine.js`), while reusing platform UI overlay structures.
- **Consequences**: Preserves pedagogical accuracy without forcing incompatible educational schemas across instruments.
