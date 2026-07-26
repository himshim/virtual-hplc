/**
 * Peak.js - Solute Peak Data Model (Pure Data Container Only)
 */
export class Peak {
  /**
   * @param {Object} config
   * @param {string} config.compound - Solute name
   * @param {number} config.tR - Theoretical retention time (min)
   * @param {number} config.sigma - Standard deviation (min)
   * @param {number} config.height - Peak height intensity (AU)
   * @param {number} [config.area] - Calculated peak area
   * @param {number} [config.widthBase] - Peak width at base (4 * sigma)
   * @param {number} [config.widthHalf] - Peak width at half height (2.355 * sigma)
   * @param {number} [config.widthFivePercent] - Peak width at 5% height (4.30 * sigma)
   * @param {number} [config.kPrime] - Capacity factor k'
   * @param {number} [config.plates] - Theoretical plate count N
   * @param {number} [config.resolution] - Chromatographic resolution Rs vs preceding peak
   * @param {number} [config.selectivity] - Selectivity factor alpha vs preceding peak
   * @param {number} [config.tailingFactor] - Peak tailing factor Tf
   */
  constructor({
    compound,
    tR,
    sigma,
    height,
    area = 0,
    widthBase = 0,
    widthHalf = 0,
    widthFivePercent = 0,
    kPrime = 0,
    plates = 0,
    resolution = null,
    selectivity = null,
    tailingFactor = 1.0
  }) {
    this.compound = compound;
    this.tR = tR;
    this.sigma = sigma;
    this.height = height;
    this.area = area || (height * sigma * Math.sqrt(2 * Math.PI));
    
    // Explicit Peak Widths
    this.widthBase = widthBase || (4 * sigma);
    this.widthHalf = widthHalf || (2.3548 * sigma);
    this.widthFivePercent = widthFivePercent || (4.30 * sigma);

    // Pharmacopeial Suitability Metrics
    this.kPrime = kPrime;
    this.plates = plates;
    this.resolution = resolution;
    this.selectivity = selectivity;
    this.tailingFactor = tailingFactor;
  }
}
