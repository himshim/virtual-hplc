# Virtual Analytical Lab — Chemistry Model Specification 🧪

This document defines the scientific assumptions, entity contracts, registry rules, and extension guidelines for the **Analytical Chemistry Platform** (`chemistry/`).

---

## 🏛️ Core Principles

### 1. Instrument-Independent Chemistry
- Chemical entities (compounds, mixtures, reactions) exist independently of physical instruments.
- An instrument (e.g. HPLC, UV-Vis, FTIR, GC, LC-MS) queries chemical entities via abstract interfaces without embedding chemical formulas into instrument code.

### 2. Entity Contract & Versioning
- All chemical entities inherit from `Entity.js`.
- Every entity must declare `schemaVersion = 1` and `entityVersion = "1.0.0"`.
- Every entity must implement a `validate()` method. Entities failing validation are rejected by the registry.

### 3. Solute UV Spectrum Model
- Solute absorption $\epsilon(\lambda)$ is modeled as a superposition of Gaussian absorption bands across $\lambda \in [200\text{ nm}, 400\text{ nm}]$:
  $$\epsilon(\lambda) = \sum_{i} h_i \cdot \exp\left( -\frac{(\lambda - \lambda_{\max, i})^2}{2 \sigma_{\lambda, i}^2} \right)$$
- UV detectors calculate Beer-Lambert absorbance:
  $$A(\lambda) = \epsilon(\lambda) \cdot c \cdot \text{sensitivity}$$

### 4. Chromatographic Thermodynamics & Hydrodynamics
- **Retention Factor ($k$)**: Linear Solvent Strength (LSS) model $\log_{10} k = \log_{10} k_w - S \phi$.
- **Column Hydrodynamics**: Non-linear binary solvent viscosity $\eta(\phi, T)$ determines backpressure $P = F \cdot \eta \cdot K_{col}$.
- **Van Deemter Efficiency ($N$)**: Physical HETP model $H = A + B/u + Cu \implies N = L / H$.

---

## 🔌 Extension Rules for Contributors

1. **Adding a New Compound**:
   - Create a file in `chemistry/compounds/<compoundId>.js` exporting a `Compound` entity instance.
   - Register the compound in `chemistry/registry/EntityRegistry.js`.
   - Zero engine modifications required.

2. **Adding a New Detector**:
   - Create a plugin class implementing `DetectorEntity` interface with `detect(sample, method, wavelength)`.
