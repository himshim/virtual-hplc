/**
 * GraphAdapter.js — Base class enforcing the Platform Graph Contract (GRAPH_API.md)
 */

export class GraphAdapter {
  constructor(options = {}) {
    this.options = options;
  }

  getAxes() {
    return {
      xAxis: { label: 'X Axis', unit: 'units' },
      yAxis: { label: 'Y Axis', unit: 'units' }
    };
  }

  getDatasets() {
    return [];
  }

  getAnnotations() {
    return [];
  }

  getAccessibilitySummary() {
    return 'Graph data active.';
  }

  getToolbarActions() {
    return [];
  }
}
