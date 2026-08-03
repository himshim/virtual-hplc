# First-Year B.Pharm Student UX Review — HPLC Simulator

**Persona**: First-year Bachelor of Pharmacy (B.Pharm) student, zero prior hands-on HPLC experience.  
**Evaluation Goal**: Assess usability, cognitive load, learning clarity, hesitation points, and UI simplification opportunities.  
**Methodology**: Simulated full first-time student lab workflow using Playwright visual recordings and design principles from `taste-design` & `DESIGN.md`.

---

## 🎓 Executive Summary: The Student Journey

> *"I've read about HPLC in pharmaceutical analysis textbooks (mobile phase, stationary phase, retention time), but this is my first time touching a simulator. I want to know what happens to my drug peaks when I change flow rate or mobile phase ratio."*

### Overall Experience
The learning loop (**Predict $\rightarrow$ Run $\rightarrow$ Observe $\rightarrow$ Compare $\rightarrow$ Understand Why $\rightarrow$ Try Again**) works cleanly. Having the chromatogram graph locked as the hero view at the top of the screen prevents losing context.

---

## 🔍 First-Time Student Hesitation & Confusion Points

### 1. 🛑 What Confused Me?
- **Column Prime vs. Injection Dual Steps**: On my first try, I clicked **▶ Pump START**, saw `PRIMING` change to `READY`, and thought the run had started! I waited 10 seconds wondering why no graph lines were moving before realizing I had to click a *second* button (**💉 Inject Sample**).
- **Mobile Phase B Ratio Label**: In my textbook, we talk about "Methanol %" or "Acetonitrile %". Seeing `Mobile Phase %B` on the control stepper wasn't immediately intuitive until I read the small subtitle.

### 2. ❓ What Wasn't Obvious?
- **Initial Baseline Equilibration Delay**: The 2-second pump equilibration phase before injection enablement is realistic, but as a beginner, I wasn't sure if the simulator was frozen or loading.
- **Pre-Run Prediction Card Trigger**: The hypothesis card appears smoothly, but it isn't obvious whether making a prediction is required or optional before clicking Inject.

### 3. 🙈 Which Controls Were Ignored / Underutilized?
- **Speed Multiplier Stepper ($1\times, 5\times, 10\times$)**: As a beginner, I just clicked Inject and let the run complete. I rarely touched the speed multiplier unless a run took too long.
- **Detector Wavelength ($254\text{ nm}$)**: I kept it at default $254\text{ nm}$ because I didn't know which wavelength my sample absorbed best without checking a reference sheet.

### 4. ⏱ Which Explanations Appeared Too Late?
- **Overpressure Warning**: If I increased Flow Rate to $3.5\text{ mL/min}$, the instrument shut down immediately with `OVERPRESSURE ERROR`. The explanation of *why* pressure increases with flow rate only appeared after the shutdown rather than giving a subtle visual warning near $350\text{ bar}$.

---

## 📊 Evaluation of Core Educational Features

### A. Hero Graph Focus
- **Rating**: ⭐⭐⭐⭐⭐ (5/5)
- **Verdict**: Excellent. The graph stays fixed as the main visual element. In compact/scroll mode, the 3-state morphing PiP preserves live trace visibility cleanly.

### B. Compare Runs Overlay
- **Rating**: ⭐⭐⭐⭐⭐ (5/5)
- **Verdict**: Highly effective. Seeing the Cyan `$Previous$` trace under the Orange `$Current$` trace immediately shows: *"Peak 1 moved left from 3.8 min to 2.4 min when I increased flow rate."*

### C. Contextual "Why?" Micro-Chips
- **Rating**: ⭐⭐⭐⭐☆ (4.5/5)
- **Verdict**: The 2.0s debounced chips (`❓ Why did retention decrease?`) beside modified steppers are much cleaner than cluttering the UI with permanent text blocks.

### D. Post-Run Inline Observation Prompt
- **Rating**: ⭐⭐⭐⭐☆ (4.5/5)
- **Verdict**: Small, non-intrusive box right under the chromatogram. Encourages active reflection (*"What changed?"*) without interrupting the flow.

---

## 🛠 Ranked Recommendations for UI Simplification

### 🚨 Category 1: Critical (Must Fix for Release)
1. **Combine "Pump Start" & "Inject" in Beginner Mode**:
   - *Current*: Click Pump Start $\rightarrow$ Wait for Equilibration $\rightarrow$ Click Inject.
   - *Recommendation*: In Beginner/Standard Mode, clicking a single prominent **▶ Run Experiment** button automatically primes, equilibrates, and injects, removing the dual-click confusion.

### ⚠️ Category 2: Important (Improves Learning Efficiency)
2. **Pressure Gauge Safety Color Band**:
   - Add a subtle Green/Yellow/Red visual accent on the pressure pill (`🟢 < 250 bar`, `🟡 250–350 bar`, `🔴 > 350 bar`) so students visually anticipate overpressure before tripping the shutdown.
3. **Clarify %B Subtitle**:
   - Add explicit component names to the %B label (e.g. `Mobile Phase %B (Methanol)`).

### 💡 Category 3: Nice to Have (Cosmetic Polish)
4. **Pre-Run Prediction Card Auto-Collapse**:
   - Once an injection starts, auto-collapse the pre-run hypothesis card so the chromatogram graph expands to maximum vertical height during live acquisition.
5. **Default Wavelength Auto-Hint**:
   - Add a subtle chip near Wavelength when a sample is selected (e.g., `💡 Recommended: 254 nm for Analgesics`).

---

## 🎯 Final Verdict

The HPLC simulator is **feature complete and educationally sound for v1 release**. Removing friction around the dual-step injection process will make it completely seamless for first-year pharmacy students.
