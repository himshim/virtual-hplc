# Project Roadmap & Release Milestones

## Independent Versioning System

- **Physics Engine**: `v1.0` (Public API Frozen)
- **Validation Dataset**: `VDS-1.4` (5 Analytes, 2 Literature Methods)
- **UI Experience**: `v1.1.1` (Active Milestone)
- **Architecture Constitution**: `v3.0` (`docs/architecture/ARCHITECTURE_CONSTITUTION.md`)

---

## Release Pipeline Overview

```text
PHASE 1: SCIENTIFIC ENGINE (FROZEN v1.x API)
  └─ Complete (Dataset VDS-1.4, 6 Continuous Verification Gates)

PHASE 2: LABORATORY EXPERIENCE (CURRENT ACTIVE FOCUS — HPLC v1.1)
  ├─ HPLC v1.1.1: Authentic Acquisition Workflow (Pump START -> Baseline -> Inject -> t=0 Reset -> Run)
  ├─ HPLC v1.1.2: Live Acquisition & Multi-Analyte Elution (Independent Concentration Profiles)
  ├─ HPLC v1.1.3: Interactive Chromatogram & CDS Controls (Fit Peaks, Fit All, Reset View)
  ├─ HPLC v1.1.4: Guided Pedagogical Explanations & Parameter Impact Narration
  └─ HPLC v1.1.5: CDS Workstation Polish & Mobile Workstation Usability

PHASE 3: EDUCATIONAL CONTENT (HPLC v1.2)
  ├─ Instructor Mode & Custom Problem Generation
  ├─ Student Interactive Exercises & Automated Grading
  ├─ Troubleshooting Labs & SST Failure Modes
  └─ Formal PDF Method Evaluation Report Export

PHASE 4: PLATFORM EXPANSION (PLATFORM v2.0)
  ├─ GC Module (Gas Chromatography)
  ├─ UV–Vis Module (Spectrophotometry)
  ├─ FTIR Module (Fourier-Transform Infrared)
  └─ LC–MS Module (Liquid Chromatography–Mass Spectrometry)
```

---

## Outcome-Oriented User Capability Roadmap & Exit Criteria

| Release | User Capability Goal | Definition of Done (Exit Criteria) |
| :--- | :--- | :--- |
| **HPLC v1.1.1** | Operate the simulator like a real HPLC instrument from startup to acquisition. | • Pump START immediately produces live baseline.<br>• Baseline stabilizes during equilibration.<br>• Injection resets acquisition time to $t=0.00\text{ min}$.<br>• Status strip matches actual instrument state.<br>• Passes 6 CI Quality Gates & zero console errors. |
| **HPLC v1.1.2** | Watch compounds elute live with physically independent peaks. | • Analytes produce independent concentration profiles $c_i(t)$.<br>• Beer-Lambert superposition renders distinct peaks.<br>• Target markers illuminate on live elution apex. |
| **HPLC v1.1.3** | Analyze and interact with chromatograms as they would in a commercial CDS. | • Fit Peaks, Fit All, & Reset View graph controls functional.<br>• Reduced zoom sensitivity & touch gestures.<br>• Peak inspector overlay smooth. |
| **HPLC v1.1.4** | Learn why chromatographic changes occur through guided explanations. | • Debounced combined-effect narration.<br>• Live parameter impact preview.<br>• Educational tooltips active. |
| **HPLC v1.1.5** | Use the simulator comfortably on desktop and mobile with an authentic workstation feel. | • Touch steppers ($\ge 44\text{px}$) active.<br>• Hero graph ($52\text{vh}$) primary focus.<br>• Telemetry strip with pressure digit jitter. |

---

## Validation Confidence Scale

- **Implemented**: Model logic exists in code (All 24 Engines).
- **Smoke Tested**: Automated unit tests verify output integrity.
- **Calibrated**: Parameters tuned using literature constants (Isocratic & LSS).
- **Validated**: Compared against literature within benchmark dataset (`VDS-1.4`).
- **Cross-Validated**: Verified against multiple independent publications (`VDS-2.0`).
