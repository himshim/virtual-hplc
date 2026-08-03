# Design System: Virtual Analytical Laboratory — HPLC Simulator
**Target Viewports:** Desktop (1920×1080) & Mobile (390×844)  
**Aesthetic Philosophy:** Art Gallery Airy meets Analytical Precision (Density: 5, Variance: 4, Motion: 6)

---

## 1. Core Design Principles

1. **The Chromatogram is the Hero**: The analytical signal graph remains the uncompromised center of gravity.
2. **Progressive Disclosure**: Reveal telemetry and controls only when relevant to the student's active acquisition step.
3. **Direct Cause & Effect**: Connect parameter changes directly to visual peak shifts and quantitative feedback.
4. **Uninterrupted Workflow**: Eliminate intrusive modal popups during active runs; use tiny inline cards instead.
5. **Mobile-First Touch Architecture**: Ensure $\ge 44\text{px}$ touch targets and zero pointer collision on mobile screens.
6. **One Primary Focus** ⭐: Every screen should have one obvious primary task. All secondary tools remain contextual or hidden until explicitly needed.

---

## 2. Semantic Color Tokens

| Token | Semantic Role | Default Mapping |
| :--- | :--- | :--- |
| `--surface-canvas` | Deep primary background | Slate-950 (`#020617`) |
| `--surface-card` | Container fill for steppers & accordions | Slate-900 (`#0f172a`) |
| `--surface-elevated` | Glassmorphic floating bars & docks | `rgba(15, 23, 42, 0.85)` + blur |
| `--border-subtle` | Structural dividers & card outlines | `rgba(255, 255, 255, 0.1)` |
| `--accent-primary` | Active chromatogram trace & Run CTA | Vibrant Orange (`#f97316`) |
| `--accent-comparison` | Overlaid previous chromatogram trace | Muted Cyan (`#38bdf8`) |
| `--status-success` | System ready & correct prediction | Emerald-500 (`#22c55e`) |
| `--status-warning` | High pressure & equilibration alert | Amber-500 (`#eab308`) |
| `--status-danger` | Over-pressure cutoff error | Red-500 (`#ef4444`) |
| `--text-primary` | Primary high-contrast labels | Slate-50 (`#f8fafc`) |
| `--text-secondary` | Secondary units & descriptions | Slate-400 (`#94a3b8`) |

---

## 3. Typographic Architecture

- **Primary Display Stack**: `Satoshi`, `Cabinet Grotesk` (Track-tight, weight-driven hierarchy).
- **Body Stack**: `Geist`, `Satoshi`, System UI sans-serif (Relaxed leading, 65ch max line length).
- **Monospace Stack**: `JetBrains Mono`, `Geist Mono` (Used for retention times $t_R$, pressures $P$, resolution $R_s$, and numerical inputs).

---

## 4. Component Specifications & Component Behaviors

### A. Hero Chromatogram Graph
- Occupies primary hero viewport ($52\text{vh}$ on desktop).
- Single GPU-accelerated canvas instance handling both active trace (`--accent-primary`) and previous trace (`--accent-comparison`).

### B. 3-State Responsive Morphing PiP
- **$> 80\%$ visible**: Full Hero Graph.
- **$20\% – 80\%$ visible**: Compact Hero Graph (shrinks gracefully in place).
- **$< 20\%$ visible / Switched Tab**: Floating PiP (occupies ~20–25% viewport width on desktop, scaling proportionally on mobile; positioned to preserve visibility without covering primary controls).

### C. 2-State Telemetry Pill
- **State 1 (Top)**: Full Telemetry Header.
- **State 2 (Scrolled)**: Compact Glassmorphic Pill (`🟢 RUNNING • ⏱ 2.34 min • 🔵 186.2 bar`).

### D. 4-Step Structured Teacher Summary (Compare Runs)
When comparing current vs. previous run, display a 4-step structured explanation:
1. **Parameter Changed**: *Flow rate increased from 1.0 to 1.5 mL/min.*
2. **Observed Effect**: *Retention time decreased by 18%.*
3. **Scientific Explanation**: *Higher mobile phase velocity reduced solute residence time in column.*
4. **Suggested Next Experiment**: *Try 1.2 mL/min to balance analysis speed and peak separation.*

### E. Pre-Run Prediction Mode
Before initiating an injection, prompt the student with an optional 1-click hypothesis:
> **What do you think will happen?**  
> `[ ] Peaks move earlier` | `[ ] Peaks move later` | `[ ] Pressure increases` | `[ ] Resolution increases`

After completion, provide instant feedback:
> *"✓ You predicted correctly! Retention time decreased as flow rate increased."*

### F. Contextual "Why?" Micro-Chips
- Fades in beside modified stepper inputs after a 2.0s pause (`❓ Why did retention time decrease?`).
- Tapping opens a 2-sentence micro-explanation directly attached to the parameter field.

### G. Tiny Post-Run Inline Observation Prompt
- Rendered inline directly beneath the graph upon run completion:
  `"What changed? [_____________________] [Save]"` (zero popup modals).

---

## 5. Responsive Mobile Strategy (< 640px)

- **Touch Targets**: All stepper buttons, CTAs, and tab items $\ge 44\text{px}$.
- **Floating Quick Dock**: Positioned cleanly above bottom tab bar (`z-index: 980; bottom: 76px`).
- **Single Column Stack**: Clean vertical stacking preserving focus on the hero graph.
