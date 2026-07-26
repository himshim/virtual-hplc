# Laboratory Experience & CDS Workstation Guidelines

## Design Strategy
Recreate the authentic operational workflow of commercial chromatography data systems (Waters Empower, Agilent OpenLab, Shimadzu LabSolutions) while maintaining an intuitive, touch-friendly, mobile-first student UX.

---

## Deliverables & Components

### 1. CDS Telemetry Strip
Displays live system telemetry at the top of the acquisition viewport:
- **System State**: `● IDLE` / `● PRIMING` / `● EQUILIBRATING` / `● READY` / `● RUNNING`
- **Pressure**: Live backpressure with $\pm 0.1\text{ bar}$ stroke ripple jitter
- **Flow Rate**: Flow rate with `Flow Stable ✓` badge
- **UV Lamp**: Optical wavelength with `UV Lamp ● ON` badge

### 2. Touch-First Stepper Controls
Large touch-friendly ($\ge 44\text{px}$) step buttons alongside method sliders:
- **Flow Rate**: `[−] 1.0 mL/min [+]` ($0.1\text{ mL/min}$ step)
- **Organic %B**: `[−] 40% [+]` ($5\%$ step)
- **Column Temp**: `[−] 25°C [+]` ($5^\circ\text{C}$ step)
- **Mobile Phase pH**: `[−] pH 7.0 [+]` ($0.5$ step)

### 3. Guided 5-Step Progress Banner
Visual progress bar illuminating active acquisition phases:
$$\text{① Start Pump} \longrightarrow \text{② Wait for Ready} \longrightarrow \text{③ Inject Sample} \longrightarrow \text{④ Watch Separation} \longrightarrow \text{⑤ View Report}$$
