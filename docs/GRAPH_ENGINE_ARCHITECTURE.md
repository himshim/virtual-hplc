# 🏛️ Platform Graph Engine Architecture (`docs/GRAPH_ENGINE_ARCHITECTURE.md`)

**Subsystem Level**: Level B Infrastructure  
**Core Orchestrator**: `platform/graph/ScientificGraphEngine.js`  
**Contract Specification**: `platform/graph/GRAPH_API.md`  
**Schema**: `platform/graph/graph.schema.json`  

---

## 1. Architectural Layers

```
platform/graph/
├── ScientificGraphEngine.js  <-- Facade & Lifecycle Manager
├── GraphRenderer.js          <-- HTML5 Canvas Renderer
├── InteractionController.js  <-- Pan, Zoom, saveViewport(), restoreViewport()
├── AnnotationLayer.js        <-- Peak tags & λmax markers
├── AccessibilityLayer.js    <-- ARIA summaries & WCAG 2.2 AA focus
├── ExportLayer.js           <-- PNG export with metadata
├── ThemeAdapter.js           <-- Dark #0b0f19, Projection, High-Contrast
└── adapters/
    ├── GraphAdapter.js          <-- Base Class Contract
    ├── ChromatogramAdapter.js   <-- HPLC & GC (mAU, pA)
    ├── SpectrumAdapter.js       <-- UV-Vis & FTIR (AU, %T)
    ├── CalibrationAdapter.js    <-- Beer-Lambert linear regression
    └── InterferogramAdapter.js  <-- Raw FTIR interferogram
```

---

## 2. Platform Governance Rules
- **Level C (SDK Core)**: `core/` (Frozen)
- **Level B (Graph Subsystem)**: `platform/graph/` (Frozen upon cross-instrument validation)
- **Level A (Instruments)**: `instruments/` (HPLC, UV-Vis, FTIR, GC)
