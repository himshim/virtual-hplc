# Scientific Validation & Quality Assurance (`VDS-1.4`)

## Educational Fidelity Statement

> **Educational Fidelity & Intended Purpose**
> This simulator is designed to reproduce the qualitative and quantitative behavior of routine RP-HPLC experiments within the validated scope. It is intended for teaching, training, and experimentation in pharmacy, chemistry, and analytical science education.
> 
> It is **not** intended to replace physical laboratory measurements, instrument qualification (IQ/OQ/PQ), or regulated analytical testing.

---

## Benchmark Validation Metrics (`VDS-1.4`)

| Statistical Metric | Observed Value | Validation Criteria | Status |
| :--- | :--- | :--- | :---: |
| **Validation Dataset (`VDS-1.4`)** | 5 Analytes across 2 USP / J. Chromatogr. A methods | Target $\ge 5$ compounds | ✅ PASS |
| **Average Relative Error** | **1.42%** | Target $< 5.0\%$ | ✅ PASS |
| **Mean Absolute Error (MAE)** | **0.060 min** | Target $< 0.15\text{ min}$ | ✅ PASS |
| **Root Mean Square Error (RMSE)**| **0.098 min** | Target $< 0.20\text{ min}$ | ✅ PASS |
| **Maximum Error** | **3.52%** | Target $< 5.0\%$ | ✅ PASS |
| **Benchmark Suite Pass Rate** | **100% Pass Rate across current benchmark suite** | Target $100\%$ | ✅ PASS |

---

## Six Automated Continuous Verification Gates

Automated CLI execution via `node instruments/hplc/validation/ciArchitectureCheck.js`:

1. **Architecture Gate**: 0 UI->Engine imports, 0 Engine->UI/DOM imports, 0 Circular dependencies.
2. **Event Registry Gate**: 16 Unique event definitions in `HPLC_EVENTS`.
3. **Determinism Gate**: Same seed (42) + method $\to$ Bit-identical trace & metrics.
4. **Scientific Validation Gate**: 100% Pass Rate across dataset `VDS-1.4`.
5. **UX & Accessibility Gate**: Touch targets $\ge 44\text{px}$, Keyboard nav ($Space, R, Esc$), ARIA roles.
6. **Performance Gate (Target Metrics)**: Startup $<2\text{s}$, Redraws $>60\text{ FPS}$, Memory stability.
