# Platform Architecture Constitution (v3.0)

## Governing Principles

1. **Physics before graphics**: Simulation models originate from first-principles chromatography equations.
2. **Engines never depend on UI**: Zero UI imports, DOM queries, or visual rendering logic inside physics and chemistry engines.
3. **UI never recalculates scientific quantities**: Scientific values ($t_R, N, R_s, W_b, P, T_f$) flow strictly down the single source of truth pipeline:
   $$\text{Engine} \longrightarrow \text{ResultModel} \longrightarrow \text{UiCoordinator} \longrightarrow \text{View}$$
4. **Determinism under fixed seeds**: Every stochastic process is 100% reproducible under a fixed PRNG seed.
5. **Documented scientific assumptions**: Physical approximations are explicitly cataloged.
6. **Versioned validation datasets**: Benchmark dataset versions (`VDS-1.4`) are independent of software releases.
7. **Semantic API stability**: Public engine APIs (`v1.x`) remain backward compatible; breaking changes require `v2.0`.
8. **Educational realism over visual fluff**: Workstation fidelity and pedagogical clarity take priority over decorative effects.
9. **Workflow before widgets**: If a feature makes the simulated laboratory workflow more authentic, it has higher priority than adding new interface controls or visual effects.
10. **One scientific fact, one owner**: Every scientific quantity (retention time, pressure, absorbance, plate count, resolution, peak area, etc.) has exactly one authoritative source in the codebase. UI components display or format it, but never recompute it.

---

## Data Pipeline Architecture

```text
 ┌─────────────────────────────────────────────────────────┐
 │                   PHYSICS & CHEMISTRY ENGINES            │
 │ (bandProfile, coElution, transport, gradient, detector)  │
 └────────────────────────────┬────────────────────────────┘
                              │ Immutable Patch Data
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │                   HPLC CONTROLLER STATE MACHINE         │
 │ (BOOTING → IDLE → PRIMING → EQUILIBRATING → READY...)   │
 └────────────────────────────┬────────────────────────────┘
                              │ HPLC_EVENTS Dispatch
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │                   UI PRESENTATION COORDINATOR           │
 │                     (UiCoordinator.js)                  │
 └─────────────┬──────────────┬──────────────┬─────────────┘
               │              │              │
               ▼              ▼              ▼
         [GraphView]    [StatusBar]    [Narrator] ...
```
