# 🔍 Repository-Wide Reuse & Classification Audit (`docs/REUSE_AUDIT.md`)

**Date**: July 27, 2026  
**Audited Subsystems**: Platform Core, Graph Subsystem, HPLC, UV-Vis, FTIR, GC  

---

## 1. Subsystem File Classification

```
                           REPOSITORY FILE CLASSIFICATION MATRIX
┌───────────────────────────────────────────────┬─────────────────┬──────────────────────────────────────────┐
│ File Path                                     │ Classification  │ Destination / Action                     │
├───────────────────────────────────────────────┼─────────────────┼──────────────────────────────────────────┤
│ `core/AnalyticalInstrumentPlugin.js`           │ Platform        │ Level C SDK Core (Frozen)                │
│ `core/PluginRegistry.js`                      │ Platform        │ Level C SDK Core (Frozen)                │
│ `core/ManifestValidator.js`                   │ Platform        │ Level C SDK Core (Frozen)                │
│ `platform/graph/ScientificGraphEngine.js`     │ Graph           │ Level B Graph Infrastructure (Frozen)    │
│ `platform/graph/adapters/ChromatogramAdapter` │ Graph           │ Shared Graph Adapter                     │
│ `platform/graph/adapters/SpectrumAdapter.js`  │ Graph           │ Shared Graph Adapter                     │
│ `instruments/hplc/engine/hplcEngine.js`       │ Physics         │ HPLC Instrument IP (Retained in Plugin)  │
│ `instruments/hplc/ui/EducationalNarrator.js` │ Educational     │ Extract to `platform/education/`        │
│ `instruments/hplc/ui/controls.js`             │ Controller      │ Simplify & consume platform utilities    │
│ `instruments/uvvis/engine/beerLambertEngine` │ Physics         │ UV-Vis Instrument IP                     │
│ `instruments/ftir/engine/ftirEngine.js`       │ Physics         │ FTIR Instrument IP                       │
│ `instruments/gc/engine/gcEngine.js`           │ Physics         │ GC Instrument IP                         │
└───────────────────────────────────────────────┴─────────────────┴──────────────────────────────────────────┘
```

---

## 2. Extraction & Deletion Summary
- **Can Reuse**: `platform/graph/` adapters across all 4 instruments.
- **Should Extract**: Formatters (`formatPressure`, `formatTime`), Noise generators, Educational 4-step Diagnosis engine.
- **Can Delete Later**: Handwritten ad-hoc status string formatters in individual controls scripts.
- **Must Remain Instrument-Specific**: Retention equations (Van Deemter, Kovats, Beer-Lambert).
