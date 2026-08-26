# 👨‍🏫 Instructor & Faculty Guide

Comprehensive pedagogical guidance for teaching undergraduate (B.Pharm, B.Sc Chemistry) and postgraduate (M.Pharm, M.Sc Analytical Chemistry) laboratory courses using **Virtual Analytical Lab**.

---

## 1. 🎯 Educational Objectives & Curriculum Mapping

Virtual Analytical Lab is designed to bridge the gap between abstract textbook equations and hands-on physical wet lab intuition. It covers core syllabus requirements across PCI (Pharmacy Council of India), ACS (American Chemical Society), and ABET-accredited chemistry curricula:

| Instrument | Core Theoretical Principles | Compendial Assays & Standards |
|---|---|---|
| **HPLC Chromatograph** | C18 reversed-phase partitioning, Van Deemter kinetics ($H = A + B/u + Cu$), Linear Solvent Strength (LSS), gradient vs isocratic elution | USP &lt;621&gt; System Suitability ($N \ge 2000, R_s \ge 1.5, 0.95 \le T \le 1.20$) |
| **UV-Vis Spectrophotometer** | Beer-Lambert law ($A = \varepsilon c l$), Henderson-Hasselbalch chromophore shifts, optical dispersion, derivative spectroscopy ($dA/d\lambda, d^2A/d\lambda^2$) | USP &lt;857&gt; Photometric Linearity ($R^2 \ge 0.999$), stray light tolerance |
| **FTIR Spectrometer** | Vibrational dipole moments, Michelson interferometry & centerburst, Cooley-Tukey FFT, ATR evanescent wave penetration depth ($d_p$) | ASTM E1421 / ISO 10553 certified polystyrene film qualification ($\pm 1.0\text{ cm}^{-1}$) |
| **Gas Chromatograph (GC-FID)** | Golay open tubular kinetics, carrier gas optimization ($N_2, He, H_2$), oven temperature programming, FID Effective Carbon Number (ECN) | USP &lt;467&gt; Residual Solvents Class 1/2/3, EPA 8260B volatile aromatics |

---

## 2. 💡 Recommended Classroom Workflows

### A. The "Predict-Observe-Explain" (POE) Method
1. **Predict**: Before adjusting a slider (e.g. increasing HPLC % Organic Modifier from 30% to 70%), ask students to hypothesize the direction of retention time shift ($\Delta t_R$) and peak width ($\Delta w$).
2. **Observe**: Run the live simulation and record the experimental result on the real-time Canvas.
3. **Explain**: Students reference the built-in Learn Hub models (e.g. LSS equation $\log k' = \log k_w - S\phi$) to explain the physical mechanism.

### B. Blind Unknown Identification Practical
1. Assign students an unknown compound code from the database.
2. Students determine identity using multi-instrument cross-verification:
   - **UV-Vis**: Measure $\lambda_{\max}$ and calculate molar absorptivity $\varepsilon$.
   - **FTIR**: Identify diagnostic functional group zones (e.g. Carbonyl Ladder $1700 - 1750\text{ cm}^{-1}$).
   - **HPLC / GC**: Confirm retention factor $k'$ or Kovats retention index $I$.

---

## 3. 🖥️ Classroom Features & Teaching Tools

- **20-Foot Projection Mode**: Toggle Projection Mode in `<lab-header>` for high-contrast, enlarged typography and thick graph lines readable from the back of lecture halls.
- **Interactive Learn Hubs (Tab 3 in all instruments)**: Live Van Deemter / Golay calculators, Purnell resolution sandboxes, and ATR penetration depth visualizers designed for live classroom demonstrations.
- **Electronic Lab Notebook**: Built-in observation logging with one-click CSV data export for lab report grading.

---

## 4. 📝 5 Ready-to-Use Student Practical Assignments

1. **UV-Vis Assay & pH Shift**: Quantitate Paracetamol tablet assay ($R^2 \ge 0.999$) and observe Phenol Red bathochromic shift ($430\text{ nm} \to 560\text{ nm}$) across $\text{pH } 2 \to 12$.
2. **HPLC Separation Optimization**: Achieve baseline separation ($R_s \ge 1.5$) of a Paracetamol + Caffeine mixture by tuning flow rate ($F$) and % Acetonitrile.
3. **FTIR Functional Group Mapping**: Differentiate Esters, Ketones, and Amides using the Carbonyl Ladder ($1650 - 1750\text{ cm}^{-1}$) and demonstrate ATR $d_p$ wavelength dependence.
4. **GC Carrier Gas Comparison**: Compare $N_2$ vs $He$ vs $H_2$ on DB-5 capillary column to prove why Hydrogen enables $2\times$ faster analysis at $45\text{ cm/s}$.
5. **Kovats Retention Index Calculation**: Calculate Kovats Index ($I$) for Limonene and Toluene using homologous $n$-alkane calibration anchors.
