# Virtual Analytical Laboratory — Documentation Index

Welcome to the canonical documentation hierarchy for the **Virtual Analytical Laboratory (HPLC Module v1.x)**.

---

## Documentation Structure

```text
/docs
│
├── README.md                          (Executive Overview & Documentation Index)
│
├── architecture/
│   └── ARCHITECTURE_CONSTITUTION.md   (Platform Constitution, Principles & Data Pipeline)
│
├── validation/
│   └── SCIENTIFIC_VALIDATION.md       (VDS-1.4 Dataset, Error Metrics & 6 Continuous Verification Gates)
│
├── ui/
│   └── LABORATORY_EXPERIENCE.md       (CDS Workstation UX, Telemetry Strip & Touch Steppers)
│
└── roadmap/
    └── ROADMAP.md                     (HPLC v1.0 -> v1.1 -> v1.2 -> Platform Expansion)
```

---

## Executive Overview

```text
Scientific Engine           Stable (v1.x Public API)
Architecture                Stable (Decoupled MVC + UiCoordinator)
Validation                  Validated (VDS-1.4 Dataset)
Laboratory Experience       Active Sprint (HPLC v1.1)
Multi-Instrument Platform   Planned Expansion
```

- **Software Version**: HPLC Module v1.x
- **Validation Dataset**: `VDS-1.4` (Validation Date: `2026-07-26`)
- **Governing Constitution**: `docs/architecture/ARCHITECTURE_CONSTITUTION.md`
- **Continuous Verification Gates**: 6 Automated CI Gates (`node instruments/hplc/validation/ciArchitectureCheck.js`)
