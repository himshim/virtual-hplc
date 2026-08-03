# 📖 Graph Engine Migration Guide (`docs/GRAPH_MIGRATION_GUIDE.md`)

Instructions for instrument authors to migrate legacy canvas initializers to `platform/graph/`.

---

## Migration Steps for New Instruments

1. **Import `ScientificGraphEngine` & Appropriate Adapter**:
   ```javascript
   import { ScientificGraphEngine } from '../../platform/graph/ScientificGraphEngine.js';
   import { ChromatogramAdapter } from '../../platform/graph/adapters/ChromatogramAdapter.js';
   ```

2. **Wrap Instrument Data in Adapter**:
   ```javascript
   const adapter = new ChromatogramAdapter(chromatogramData, { unit: 'pA', instrument: 'GC-FID' });
   ```

3. **Instantiate Orchestrator**:
   ```javascript
   const canvas = document.getElementById('myCanvas');
   const engine = new ScientificGraphEngine(canvas, adapter);
   ```

4. **Update Viewport / Pan / Zoom**:
   ```javascript
   engine.resetViewport();
   engine.saveViewport();
   ```
