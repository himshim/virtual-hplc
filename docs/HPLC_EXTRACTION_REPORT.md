# 🔬 HPLC Simplification & Extraction Audit (`docs/HPLC_EXTRACTION_REPORT.md`)

**Date**: July 27, 2026  
**Target**: `instruments/hplc/`  

---

## 1. HPLC Function Classification Audit

```
                          HPLC FUNCTION CLASSIFICATION
┌───────────────────────────────┬───────────────────────────────┬───────────────────────────────────────────┐
│ Function / Module             │ Classification                │ Action Taken                              │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────────────────────┤
│ `hplcEngine.js`               │ HPLC Physics Engine           │ Retained in `instruments/hplc/engine/`    │
│ Pressure Formatting (`toFixed`)│ Shared Utility                │ Extracted to `platform/common/format.js`  │
│ Time Formatting (`toFixed`)   │ Shared Utility                │ Extracted to `platform/common/format.js`  │
│ Baseline Noise Generator      │ Shared Simulation             │ Extracted to `platform/common/noise.js`   │
│ 4-Step Educational Diagnosis  │ Educational Framework         │ Extracted to `platform/education/`        │
│ Monte Carlo Stress Logic      │ Simulation Tool               │ Extracted to `platform/simulation/`       │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────────────────┘
```

---

## 2. Codebase Simplification Impact
- **Original Duplicated Utilities**: Ad-hoc `toFixed` and `Math.random` noise logic duplicated in 3 places.
- **Post-Consolidation Result**: HPLC script size reduced; consumes `platform/common/` and `platform/education/`.
