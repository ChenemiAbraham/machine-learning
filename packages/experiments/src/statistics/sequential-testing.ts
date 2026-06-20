import { SequentialTestResult } from '../types';

/**
 * Sequential Testing (Group Sequential Design)
 *
 * Allows early stopping of experiments when significance is reached
 * Uses O'Brien-Fleming spending function to control Type I error
 *
 * Benefits:
 * - Stop early if treatment is clearly winning (save time)
 * - Stop early if treatment is clearly losing (save resources)
 * - Maintains statistical validity
 */
export function sequentialTest(
  pValue: number,
  informationFraction: number,
  alpha: number = 0.05,
  maxInterimAnalyses: number = 5
): SequentialTestResult {
  const spendingThreshold = obrienFlemingSpending(informationFraction, alpha);

  if (pValue < spendingThreshold) {
    return {
      shouldStop: true,
      reason: 'significance_reached',
      spendingFunction: spendingThreshold,
      pValue,
      threshold: spendingThreshold,
    };
  }

  const futilityThreshold = futilityBoundary(informationFraction, alpha);

  if (pValue > futilityThreshold) {
    return {
      shouldStop: true,
      reason: 'futility_reached',
      spendingFunction: spendingThreshold,
      pValue,
      threshold: futilityThreshold,
    };
  }

  return {
    shouldStop: false,
    reason: 'continue',
    spendingFunction: spendingThreshold,
    pValue,
    threshold: spendingThreshold,
  };
}

/**
 * O'Brien-Fleming Spending Function
 *
 * Conservative early, more liberal later
 * Formula: 2 * [1 - Φ(z_α/2 / √t)]
 * where t is information fraction (0 to 1)
 */
function obrienFlemingSpending(informationFraction: number, alpha: number): number {
  if (informationFraction === 0) return 0;
  if (informationFraction >= 1) return alpha;

  const zAlpha = 1.96;

  const adjustedZ = zAlpha / Math.sqrt(informationFraction);

  return 2 * (1 - standardNormalCDF(adjustedZ));
}

/**
 * Futility Boundary (Conditional Power)
 *
 * Stop experiment early if unlikely to reach significance
 * even with full planned sample size
 */
function futilityBoundary(informationFraction: number, alpha: number): number {
  if (informationFraction < 0.5) {
    return 1.0;
  }

  return 0.9;
}

/**
 * Standard Normal Cumulative Distribution Function
 */
function standardNormalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - prob : prob;
}

/**
 * Calculate information fraction
 *
 * Information fraction = current sample size / planned sample size
 */
export function calculateInformationFraction(
  currentSampleSize: number,
  plannedSampleSize: number
): number {
  return Math.min(currentSampleSize / plannedSampleSize, 1);
}

/**
 * Recommend interim analysis schedule
 *
 * Suggests when to check experiment results
 */
export function getInterimAnalysisSchedule(
  plannedSampleSize: number,
  numberOfAnalyses: number = 5
): number[] {
  const schedule: number[] = [];

  for (let i = 1; i <= numberOfAnalyses; i++) {
    const fraction = i / numberOfAnalyses;
    schedule.push(Math.ceil(plannedSampleSize * fraction));
  }

  return schedule;
}
