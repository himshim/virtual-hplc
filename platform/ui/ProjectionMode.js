/**
 * ProjectionMode.js — Classroom High-Contrast Projection Mode
 *
 * Optimizes font sizes, graph stroke widths, and contrast ratios for 20-foot classroom projectors.
 */

export class ProjectionMode {
  constructor() {
    this.active = false;
  }

  toggle() {
    this.active = !this.active;
    if (this.active) {
      document.body.classList.add('projection-mode');
    } else {
      document.body.classList.remove('projection-mode');
    }
    return this.active;
  }
}

export const projectionModeInstance = new ProjectionMode();
