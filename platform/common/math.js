/**
 * math.js — Shared Scientific Mathematical & Regression Utilities
 */

export function gaussian(x, mean, amplitude, sigma) {
  if (sigma === 0) return 0;
  return amplitude * Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(sigma, 2)));
}

export function linearRegression(points = []) {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  // Correlation Coefficient R^2
  const num = (n * sumXY - sumX * sumY);
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)) || 1;
  const r2 = Math.pow(num / den, 2);

  return { slope, intercept, r2: Math.min(1.0, r2) };
}
