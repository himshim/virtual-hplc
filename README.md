# Virtual Analytical Laboratory — HPLC Simulator v1.1.3

A modern, web-based, scientifically grounded analytical instrument simulator designed specifically for pharmacy and analytical chemistry students. Built with Vanilla JS, Chart.js, HTML5 canvas, and Playwright automated visual quality gates.

---

## 🎯 Key Educational Features

1. **Pedagogical Learning Loop**:
   $$\text{Predict} \longrightarrow \text{Run} \longrightarrow \text{Observe} \longrightarrow \text{Compare} \longrightarrow \text{Understand Why} \longrightarrow \text{Try Again}$$
2. **Hero Chromatogram Viewport**: Real-time signal acquisition ($52\text{vh}$ desktop hero canvas) with single-canvas GPU rendering.
3. **Pre-Run Prediction Mode**: 1-click hypothesis selection before injection to test physical intuition.
4. **Tiny Inline Observation Prompt**: Non-intrusive post-run observations directly beneath the chromatogram without modal popups.
5. **Compare Runs Overlay & 4-Step Teacher Summary**: Dual-trace comparison (`Current` in Orange `#f97316`, `Previous` in Cyan `#38bdf8`) with an automated 4-step diagnostic breakdown (*Changed*, *Observed*, *Reason*, *Suggested Next*).
6. **Contextual "Why?" Micro-Chips**: Debounced 2.0s inline chips attached to stepper controls for micro-explanations.
7. **3-State Fluid Morphing PiP**: `IntersectionObserver` ratio-driven transitions (`>80%` Full Hero $\to$ `20%–80%` Compact Hero $\to$ `<20%` Floating PiP).
8. **Mobile-First Touch Target Architecture**: Adheres to $\ge 44\text{px}$ touch targets and zero pointer collisions on mobile devices ($390 \times 844$).

---

## 🚀 Quick Start & Running Locally

### Prerequisites
- Node.js (v18+) or Python 3

### Step 1: Start Server
```bash
# Using Node http-server
npx http-server ./ -p 8000

# OR using Python
python -m http.server 8000
```

### Step 2: Open in Browser
Navigate to `http://localhost:8000/instruments/hplc/index.html`

---

## 🧪 Running Automated Tests & Validation

```bash
# Run 11-Gate Automated CI Architectural & Scientific Check
node instruments/hplc/validation/ciArchitectureCheck.js

# Run Educational Outcome Playwright Suite
node scratch/verify_educational_outcomes.js

# Run Morphing PiP Visual Suite
node scratch/verify_pip_visual_suite.js
```

---

## 📁 Repository Documentation Structure

- **[README.md](file:///C:/Users/hs941/.gemini/antigravity/scratch/virtual-analytical-lab/README.md)**: Project overview, setup, and test runner instructions.
- **[DESIGN.md](file:///C:/Users/hs941/.gemini/antigravity/scratch/virtual-analytical-lab/DESIGN.md)**: Semantic design system, typography, color tokens, and anti-patterns.
- **[ARCHITECTURE.md](file:///C:/Users/hs941/.gemini/antigravity/scratch/virtual-analytical-lab/ARCHITECTURE.md)**: Instrument plugin architecture and engine/UI boundaries.
- **[docs/validation/](file:///C:/Users/hs941/.gemini/antigravity/scratch/virtual-analytical-lab/docs/validation/)**: Supporting Playwright screenshots, regression reports, and scientific validation benchmarks.