/**
 * noise.js — Shared Baseline Detector Noise Generators
 */

export function generateGaussianNoise(mean = 0, stdDev = 0.001) {
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random() || 1e-10;
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}
