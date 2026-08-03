# 📐 Platform Graph Subsystem API Contract (`GRAPH_API.md`)

**Subsystem Version**: `v1.0.0` (Level B Infrastructure)  
**Governance Policy**: Frozen API contract. Breaking changes require cross-instrument regression review.  

---

## 1. GraphAdapter Contract Specification

Every instrument graph type must extend `GraphAdapter` and implement 5 core methods:

```javascript
/**
 * Abstract Base Class for Platform Graph Adapters
 */
export class GraphAdapter {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Return Axis Definitions
   * @returns {{ xAxis: { label: string, unit: string, min?: number, max?: number, inverted?: boolean }, yAxis: { label: string, unit: string, min?: number, max?: number } }}
   */
  getAxes() {
    throw new Error('GraphAdapter.getAxes() must be implemented by subclass');
  }

  /**
   * Return Current Data Series
   * @returns {Array<{ id: string, label: string, color: string, data: Array<{x: number, y: number}> }>}
   */
  getDatasets() {
    throw new Error('GraphAdapter.getDatasets() must be implemented by subclass');
  }

  /**
   * Return Graph Annotations (Peaks, λmax markers, functional groups)
   * @returns {Array<{ x: number, y: number, label: string, type: 'peak'|'marker'|'band', color?: string }>}
   */
  getAnnotations() {
    return [];
  }

  /**
   * Return Screen Reader Accessibility Summary
   * @returns {string} Human-readable summary of current plot data & key features
   */
  getAccessibilitySummary() {
    return 'Graph rendering active.';
  }

  /**
   * Return Custom Toolbar Action Buttons
   * @returns {Array<{ id: string, label: string, icon: string, onClick: Function }>}
   */
  getToolbarActions() {
    return [];
  }
}
