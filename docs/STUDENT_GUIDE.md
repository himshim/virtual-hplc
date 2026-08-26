# 🎓 Student Practical & Laboratory Manual

A complete step-by-step practical manual for mastering pharmaceutical and chemical instrumental analysis on **Virtual Analytical Lab**.

---

## 1. 🔬 Standard Laboratory Operating Procedure (SOP)

Follow this 5-step workflow for all instrument simulations:

1. **Select Workstation & Analyte**:
   - Choose your target instrument (**HPLC**, **UV-Vis**, **FTIR**, or **GC-FID**) from the navigation bar.
   - Select a sample compound from the pharmacopoeial dropdown (e.g. Paracetamol, Caffeine, Aspirin, Ibuprofen, Quinine).

2. **Formulate a Hypothesis**:
   - Before moving any slider, predict what will happen.
   - *Example (HPLC)*: "Increasing % Acetonitrile from 40% to 60% will decrease retention time because polarity of the mobile phase drops, reducing analyte partitioning into the non-polar C18 phase."

3. **Execute Acquisition**:
   - **UV-Vis**: Place reference cuvette, click **Record Blank**, then click **Run Wavelength Sweep**.
   - **FTIR**: Collect atmospheric **Background Scan** ($I_0$), place sample on ATR crystal, and click **Acquire %Transmittance**.
   - **HPLC**: Click **Prime Pump**, set flow & mobile phase, click **Inject Sample & Start Run**.
   - **GC-FID**: Set oven temperature profile & carrier gas, click **Inject Sample & Start GC Run**.

4. **Interpret Spectral / Chromatographic Features**:
   - Verify peak symmetry ($T \approx 1.0$), baseline resolution ($R_s \ge 1.5$), theoretical plate count ($N$), or functional group absorption bands.
   - Switch to **Tab 3: Learn Hub** in any instrument to use live Van Deemter / Golay calculators or ATR penetration depth tools.

5. **Log Data in Electronic Notebook**:
   - Use the built-in **Notebook** panel to record observed retention times ($t_R$), absorbance peaks ($\lambda_{\max}$), and calculated concentrations.
   - Export high-resolution PNG graphs or CSV data tables for your lab report.

---

## 2. 📐 Essential Equations & Compendial Formulas

### A. UV-Vis Spectroscopy
- **Beer-Lambert Law**: $A = \varepsilon \cdot c \cdot l = -\log_{10}(I / I_0)$
- **Henderson-Hasselbalch (pH shift)**: $\text{pH} = \text{p}K_a + \log \left(\frac{[A^-]}{[HA]}\right)$
- **Stray Light Distortion**: $A_{\text{apparent}} = -\log_{10}\left(10^{-A_{\text{true}}} + s\right)$

### B. High-Performance Liquid Chromatography (HPLC)
- **Retention Factor**: $k' = \frac{t_R - t_0}{t_0}$
- **USP Peak Resolution**: $R_s = \frac{2(t_{R2} - t_{R1})}{W_1 + W_2} = \frac{\sqrt{N}}{4} \left(\frac{\alpha - 1}{\alpha}\right) \left(\frac{k'_2}{1 + k'_2}\right)$
- **USP Tailing Factor**: $T = \frac{W_{0.05}}{2f} \quad (0.95 \le T \le 1.20 \text{ acceptable})$
- **Van Deemter Efficiency**: $H = A + \frac{B}{u} + C \cdot u, \quad N = \frac{L}{H}$

### C. Fourier-Transform Infrared (FTIR)
- **Transmittance & Absorbance**: $\%T = \left(\frac{I_{\text{sample}}}{I_{\text{background}}}\right) \times 100, \quad A = -\log_{10}\left(\frac{\%T}{100}\right)$
- **ATR Evanescent Wave Penetration**: $d_p(\tilde{\nu}) = \frac{1}{2\pi \tilde{\nu} n_1 \sqrt{\sin^2\theta - (n_2/n_1)^2}}$

### D. Gas Chromatography (GC-FID)
- **Golay Open-Tubular Equation**: $H = \frac{B}{u} + (C_s + C_m) u$
- **Kovats Retention Index**: $I = 100 \left[ z + \frac{\log t'_R(x) - \log t'_R(z)}{\log t'_R(z+1) - \log t'_R(z)} \right]$
- **FID Sternberg Effective Carbon Number**: $\text{ECN} = \sum \text{Carbons} - \sum \text{Heteroatom Penalties}$

---

## 3. 🚨 Common Artifacts & Troubleshooting Guide

| Symptom | Probable Cause | Corrective Action |
|---|---|---|
| **HPLC Peak Tailing ($T > 1.5$)** | Basic drug interacting with unreacted silanols on C18 | Add triethylamine (TEA) modifier or drop mobile phase buffer pH to 2.5 |
| **HPLC Peak Fronting ($T < 0.9$)** | Column mass overload or sample dissolved in pure organic | Dilute sample concentration 10x or dissolve sample directly in mobile phase |
| **UV-Vis Curve Flattening ($A > 2.0$)** | Monochromator stray light ($s > 0.1\%$) or PMT saturation | Dilute sample solution to bring absorbance into linear $0.2 - 1.5\text{ AU}$ range |
| **FTIR Derivative Spike ($2349\text{ cm}^{-1}$)** | Atmospheric $\text{CO}_2$ concentration changed between scans | Re-run fresh background scan and purge optical compartment |
| **GC Broad / Flat Late Peaks** | Isothermal run temperature too low for high-boiling volatiles | Switch from Isothermal mode to Linear Oven Thermal Program ($10 - 20^\circ\text{C/min}$) |

