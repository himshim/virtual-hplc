# SIMULATION_REUSE_AUDIT.md — Phase 4 Reuse & Third-Party Audit

**Subsystem**: `platform/simulation/`  
**Governance**: Approved Phase 4 Plan (Rule of Two & Platform First)

---

## 1. Third-Party Library & Web API Evaluation

| Candidate / API | Category | Purpose | Status | Selection Justification |
| :--- | :--- | :--- | :--- | :--- |
| `performance.now()` | Time Source | Sub-millisecond $\Delta t$ time measurement | ✅ **Adopted** | Standard W3C High Resolution Time API. Extremely lightweight with zero dependencies. |
| `requestAnimationFrame` | Loop Source | 60 FPS browser animation ticker | ✅ **Adopted** | Native browser API synchronized with display refresh rate. Auto-pauses when tab is hidden. |
| `setInterval` / `setTimeout` | Loop Source | Fallback loop for Node CI & background testing | ✅ **Adopted** | Native Node.js/Browser timer fallback when RAF is unavailable. |
| `AbortController` | Control Signal | Instant simulation loop teardown | ✅ **Adopted** | Native DOM standard for aborting async simulation ticks cleanly. |
| `Mulberry32` PRNG | Randomness | Seeded pseudo-random number generator | ✅ **Adopted** | Compact (5 lines), fast, 32-bit deterministic PRNG replacing `Math.random()`. |
| `chartjs-plugin-streaming` | Data Streaming | Live Chart.js data stream rendering | ❌ **Rejected** | Existing `platform/graph/` adapters (`ChromatogramAdapter`, `SpectrumAdapter`) already append points progressively without extra dependencies. |

---

## 2. Repository Code Reuse Audit

| Existing Component | Current Location | Action for Phase 4 | Target Location |
| :--- | :--- | :--- | :--- |
| `EventBus` | `instruments/hplc/utils/EventBus.js` | **Reuse & Generalize** | `platform/simulation/SimulationEvents.js` |
| `gaussian()` / `linearRegression()` | `platform/common/math.js` | **Reuse** | `platform/common/math.js` (No change) |
| `generateGaussianNoise()` | `platform/common/noise.js` | **Integrate with PRNG** | `SimulationRandom.js` |
| `formatTime()`, `formatNumber()` | `platform/common/format.js` | **Reuse** | `platform/common/format.js` (No change) |
| HPLC ticker interval logic | `HplcController.js` | **Shadow Test in 4B** | Replaced by `SimulationRunner.js` post-parity pass |
| UV-Vis array calculation | `beerLambertEngine.js` | **Leave Untouched** | (Phase 5 migration target) |
| FTIR array calculation | `ftirEngine.js` | **Leave Untouched** | (Phase 5 migration target) |
| GC array calculation | `gcEngine.js` | **Leave Untouched** | (Phase 5 migration target) |

---

## 3. Summary of Abstraction Decisions

- `platform/simulation/` contains **6 core modules**: `SimulationContext`, `SimulationClock`, `SimulationRunner`, `SimulationEvents`, `SimulationPlayback`, `SimulationRandom`.
- `platform/services/` contains **2 minimal services**: `SettingsService`, `ExportService`.
- No instrument-specific branches (`if (instrumentId === 'hplc')`) are permitted in `platform/` code.
