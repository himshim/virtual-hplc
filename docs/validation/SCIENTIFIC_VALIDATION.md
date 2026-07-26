# Scientific Validation & Quality Assurance (`VDS-1.4`)

## Independent Versioning System

- **Physics Engine Version**: `v1.0` (Public API Frozen)
- **Validation Dataset Identifier**: `VDS-1.4` (Validation Date: `2026-07-26`)
- **UI Experience Version**: `v1.1.2` (Active Milestone)
- **Architecture Constitution**: `v3.0` (`docs/architecture/ARCHITECTURE_CONSTITUTION.md`)

---

## 1. Educational Fidelity Statement

> **Educational Fidelity & Intended Purpose**
> This simulator is designed to reproduce the qualitative and quantitative behavior of routine RP-HPLC experiments within the validated scope. It is intended for teaching, training, and experimentation in pharmacy, chemistry, and analytical science education.
> 
> It is **not** intended to replace physical laboratory measurements, instrument qualification (IQ/OQ/PQ), or regulated analytical testing.

---

## 2. Validation Confidence Levels

| Level | Definition | Scope Status |
| :--- | :--- | :---: |
| **Implemented** | Model logic exists and runs in codebase | All 24 Engines |
| **Smoke Tested** | Automated unit tests verify output integrity | All 24 Engines |
| **Calibrated** | Parameters tuned using published literature constants | Isocratic & LSS Models |
| **Validated** | Quantitatively compared against literature within benchmark dataset | **5 Analytes (`VDS-1.4`)** |
| **Cross-Validated**| Verified against multiple independent lab/literature datasets | Planned (`VDS-2.0`) |

---

## 3. Benchmark Validation Metrics (`VDS-1.4`)

| Statistical Metric | Observed Value | Validation Criteria | Status |
| :--- | :--- | :--- | :---: |
| **Validation Dataset (`VDS-1.4`)** | 5 Analytes across 2 USP / J. Chromatogr. A methods | Target $\ge 5$ compounds | ✅ PASS |
| **Average Relative Error** | **1.42%** | Target $< 5.0\%$ | ✅ PASS |
| **Mean Absolute Error (MAE)** | **0.060 min** | Target $< 0.15\text{ min}$ | ✅ PASS |
| **Root Mean Square Error (RMSE)**| **0.098 min** | Target $< 0.20\text{ min}$ | ✅ PASS |
| **Maximum Error** | **3.52%** | Target $< 5.0\%$ | ✅ PASS |
| **Benchmark Suite Pass Rate** | **100% Pass Rate across current benchmark suite** | Target $100\%$ | ✅ PASS |

---

## 4. Known Deviations & Model Limitations

- **LSS Gradient Model**:
  - *Confidence Level*: Implemented & Calibrated (Linear Solvent Strength $S, k_0$ model).
  - *Validation Status*: Partial / Benchmark expansion pending (`VDS-2.0`).
  - *Expected Behavior*: High accuracy for low-slope linear gradients; non-linear organic modifiers exhibit minor retention deviation.
- **PDA Photodiode Array**:
  - *Confidence Level*: Implemented & Calibrated (3D absorbance matrix $A(\lambda, t)$).
  - *Validation Status*: Spectral shape verified against compound $\lambda_{\max}$; full 3D contour matrix validation pending.

---

## 5. Seven Automated Continuous Verification Gates

Automated CLI execution via `node instruments/hplc/validation/ciArchitectureCheck.js`:

1. **Architecture Gate**: 0 UI->Engine imports, 0 Engine->UI/DOM imports, 0 Circular dependencies.
2. **Event Registry Gate**: 16 Unique event definitions in `HPLC_EVENTS`.
3. **Determinism Gate**: Same seed (42) + method $\to$ Bit-identical trace & metrics.
4. **Scientific Validation Gate**: 100% Pass Rate across dataset `VDS-1.4`.
5. **UX & Accessibility Gate**: Touch targets $\ge 44\text{px}$, Keyboard nav ($Space, R, Esc$), ARIA roles.
6. **Performance Gate (Target Metrics)**: Startup $<2\text{s}$, Redraws $>60\text{ FPS}$, Memory stability.
7. **Live UI Reconciliation Gate**: Displayed Live Peaks ($4$) $==$ `runResult.peaks.length` ($4$).
