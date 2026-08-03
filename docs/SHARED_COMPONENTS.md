# 🧩 Platform Shared Components Catalog (`docs/SHARED_COMPONENTS.md`)

Catalog of Level B infrastructure modules reusable across all analytical instrument plugins.

---

## 1. Subsystems Catalog

| Subsystem | Module | Description |
| :--- | :--- | :--- |
| **`platform/graph/`** | `ScientificGraphEngine.js` | Layered graph facade (`saveViewport`, `restoreViewport`) |
| **`platform/graph/`** | `ChromatogramAdapter.js` | HPLC & GC chromatograms ($mAU$, $pA$) |
| **`platform/graph/`** | `SpectrumAdapter.js` | UV-Vis & FTIR spectra ($AU$, $\%T$) |
| **`platform/graph/`** | `CalibrationAdapter.js` | Beer-Lambert calibration curves |
| **`platform/common/`**| `format.js` | `formatPressure`, `formatTime`, `formatAbsorbance`, `formatSignal` |
| **`platform/common/`**| `math.js` | `gaussian`, `linearRegression` |
| **`platform/common/`**| `noise.js` | `generateGaussianNoise` |
| **`platform/education/`**| `EducationalFramework.js` | 4-step structured diagnosis generator |
| **`platform/simulation/`**| `MonteCarloRunner.js` | Automated 1,000-run Monte Carlo stress sampling engine |
