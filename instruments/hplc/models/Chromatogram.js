/**
 * Chromatogram.js - Historical Time-Series Signal Container
 * Manages graph points[], append(), clear(), and export() independently of instant simulation state.
 */
export class Chromatogram {
  constructor() {
    this.points = []; // Array of { t, y }
  }

  append(t, y) {
    this.points.push({ t, y });
  }

  clear() {
    this.points = [];
  }

  getPoints() {
    return this.points;
  }

  export() {
    return {
      pointCount: this.points.length,
      points: [...this.points]
    };
  }
}
