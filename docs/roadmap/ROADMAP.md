# Project Roadmap & Release Milestones

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

## Outcome-Oriented User Capability Roadmap

| Release | User Capability Goal |
| :--- | :--- |
| **HPLC v1.1.1** | Operate the simulator like a real HPLC instrument from startup to acquisition. |
| **HPLC v1.1.2** | Watch compounds elute live with physically independent peaks. |
| **HPLC v1.1.3** | Analyze and interact with chromatograms as they would in a commercial CDS. |
| **HPLC v1.1.4** | Learn why chromatographic changes occur through guided explanations. |
| **HPLC v1.1.5** | Use the simulator comfortably on desktop and mobile with an authentic workstation feel. |

---

## Terminology Disambiguation

- **Implemented**: Feature exists and is functional in codebase (e.g. LSS gradient engine, PDA spectral engine).
- **Validated**: Compared and verified against experimental literature data within a documented benchmark scope (`VDS-1.4`).

---

## Educational Fidelity Tracking Metrics

| Area | Initial Status | Target Status |
| :--- | :--- | :---: |
| **Scientific Fidelity** | High (Validated `VDS-1.4`) | Maintain ✅ |
| **Workflow Fidelity** | Medium | High ✅ |
| **Instrument Fidelity** | Medium | High ✅ |
| **CDS Workstation Fidelity** | Medium | High ✅ |
| **Mobile Usability** | High | High ✅ |
| **Accessibility** | High | High ✅ |
| **Educational Guidance** | Medium | High ✅ |
| **Troubleshooting Realism** | Medium | High ✅ |
