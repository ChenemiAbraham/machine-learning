import { chiSquareTest, calculateSampleSizeChiSquare } from './statistics/chi-square';
import { calculateConfidenceInterval } from './statistics/confidence-interval';
import { sequentialTest, calculateInformationFraction } from './statistics/sequential-testing';

import {
  ExperimentVariant,
  ExperimentResult,
  StatisticalTestResult,
  SampleSizeCalculation,
} from './types';

export * from './types';
export * from './statistics/chi-square';
export * from './statistics/confidence-interval';
export * from './statistics/sequential-testing';

/**
 * Analyze experiment results
 *
 * Performs comprehensive statistical analysis including:
 * - Chi-square test for significance
 * - Confidence intervals
 * - Uplift calculations
 * - Recommendation
 */
export function analyzeExperiment(
  controlUsers: number,
  controlConversions: number,
  treatmentUsers: number,
  treatmentConversions: number,
  minimumSampleSize: number,
  confidenceLevel: number = 0.95
): ExperimentResult {
  const controlRate = controlConversions / controlUsers;
  const treatmentRate = treatmentConversions / treatmentUsers;

  const chiSquare = chiSquareTest(
    controlConversions,
    controlUsers,
    treatmentConversions,
    treatmentUsers,
    confidenceLevel
  );

  const ci = calculateConfidenceInterval(
    controlConversions,
    controlUsers,
    treatmentConversions,
    treatmentUsers,
    confidenceLevel
  );

  const absoluteUplift = treatmentRate - controlRate;
  const relativeUplift = controlRate > 0 ? absoluteUplift / controlRate : 0;

  const sampleSizeReached = controlUsers >= minimumSampleSize && treatmentUsers >= minimumSampleSize;

  const statistical: StatisticalTestResult = {
    pValue: chiSquare.pValue,
    isSignificant: chiSquare.isSignificant,
    confidenceLevel,
    relativeUplift,
    absoluteUplift,
    confidenceInterval: {
      lower: ci.relativeLower,
      upper: ci.relativeUpper,
    },
    sampleSizeReached,
    minimumSampleSize,
  };

  let recommendation: 'continue' | 'ship_treatment' | 'ship_control' | 'inconclusive';
  let summary: string;

  if (!sampleSizeReached) {
    recommendation = 'continue';
    summary = `Experiment has not reached minimum sample size (${minimumSampleSize} per variant). Continue collecting data.`;
  } else if (chiSquare.isSignificant && relativeUplift > 0) {
    recommendation = 'ship_treatment';
    summary = `Treatment variant is winning with ${(relativeUplift * 100).toFixed(2)}% uplift (p=${chiSquare.pValue.toFixed(4)}). Recommend shipping treatment.`;
  } else if (chiSquare.isSignificant && relativeUplift < 0) {
    recommendation = 'ship_control';
    summary = `Control variant is performing better. Treatment shows ${(relativeUplift * 100).toFixed(2)}% decrease (p=${chiSquare.pValue.toFixed(4)}). Keep control.`;
  } else {
    recommendation = 'inconclusive';
    summary = `No statistically significant difference detected (p=${chiSquare.pValue.toFixed(4)}). Difference: ${(relativeUplift * 100).toFixed(2)}%. Consider longer test duration or accept no change.`;
  }

  const control: ExperimentVariant = {
    name: 'control',
    users: controlUsers,
    conversions: controlConversions,
    conversionRate: controlRate,
  };

  const treatment: ExperimentVariant = {
    name: 'treatment',
    users: treatmentUsers,
    conversions: treatmentConversions,
    conversionRate: treatmentRate,
  };

  return {
    experimentName: '',
    control,
    treatment,
    statistical,
    recommendation,
    summary,
  };
}

/**
 * Calculate required sample size for experiment
 */
export function calculateSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number,
  power: number = 0.8,
  alpha: number = 0.05,
  estimatedDailyTraffic?: number
): SampleSizeCalculation {
  const sampleSizePerVariant = calculateSampleSizeChiSquare(
    baselineConversionRate,
    minimumDetectableEffect,
    power,
    alpha
  );

  const totalSampleSize = sampleSizePerVariant * 2;

  const estimatedDays = estimatedDailyTraffic
    ? Math.ceil(totalSampleSize / estimatedDailyTraffic)
    : 0;

  return {
    requiredSampleSizePerVariant: sampleSizePerVariant,
    totalSampleSize,
    estimatedDays,
    power,
    alpha,
    minimumDetectableEffect,
    baselineConversionRate,
  };
}

/**
 * Check if experiment should stop early
 *
 * Uses sequential testing to determine early stopping
 */
export function checkEarlyStopping(
  controlUsers: number,
  controlConversions: number,
  treatmentUsers: number,
  treatmentConversions: number,
  plannedSampleSize: number,
  alpha: number = 0.05
): {
  shouldStop: boolean;
  reason: string;
  currentSampleSize: number;
  informationFraction: number;
} {
  const currentSampleSize = Math.min(controlUsers, treatmentUsers);
  const informationFraction = calculateInformationFraction(currentSampleSize, plannedSampleSize);

  const chiSquare = chiSquareTest(
    controlConversions,
    controlUsers,
    treatmentConversions,
    treatmentUsers
  );

  const sequential = sequentialTest(chiSquare.pValue, informationFraction, alpha);

  let reason = '';
  if (sequential.shouldStop) {
    if (sequential.reason === 'significance_reached') {
      reason = `Statistical significance reached early at ${(informationFraction * 100).toFixed(0)}% of planned sample size`;
    } else if (sequential.reason === 'futility_reached') {
      reason = `Experiment unlikely to reach significance. Consider stopping to save resources.`;
    }
  } else {
    reason = `Continue collecting data. Currently at ${(informationFraction * 100).toFixed(0)}% of planned sample size.`;
  }

  return {
    shouldStop: sequential.shouldStop,
    reason,
    currentSampleSize,
    informationFraction,
  };
}

/**
 * Format experiment result for display
 */
export function formatExperimentSummary(result: ExperimentResult): string {
  const { control, treatment, statistical } = result;

  const lines = [
    `Experiment: ${result.experimentName || 'Unnamed'}`,
    ``,
    `Control:`,
    `  Users: ${control.users.toLocaleString()}`,
    `  Conversions: ${control.conversions.toLocaleString()}`,
    `  Conversion Rate: ${(control.conversionRate * 100).toFixed(2)}%`,
    ``,
    `Treatment:`,
    `  Users: ${treatment.users.toLocaleString()}`,
    `  Conversions: ${treatment.conversions.toLocaleString()}`,
    `  Conversion Rate: ${(treatment.conversionRate * 100).toFixed(2)}%`,
    ``,
    `Statistical Analysis:`,
    `  Relative Uplift: ${(statistical.relativeUplift * 100).toFixed(2)}%`,
    `  Absolute Uplift: ${(statistical.absoluteUplift * 100).toFixed(2)}pp`,
    `  P-Value: ${statistical.pValue.toFixed(4)}`,
    `  Significant: ${statistical.isSignificant ? 'Yes' : 'No'} (${statistical.confidenceLevel * 100}% confidence)`,
    `  Confidence Interval: ${(statistical.confidenceInterval.lower * 100).toFixed(2)}% to ${(statistical.confidenceInterval.upper * 100).toFixed(2)}%`,
    `  Sample Size Reached: ${statistical.sampleSizeReached ? 'Yes' : 'No'}`,
    ``,
    `Recommendation: ${result.recommendation.toUpperCase()}`,
    `Summary: ${result.summary}`,
  ];

  return lines.join('\n');
}

/**
 * Validate experiment setup
 *
 * Checks for common issues in experiment configuration
 */
export function validateExperiment(config: {
  baselineConversionRate: number;
  minimumDetectableEffect: number;
  estimatedDailyTraffic: number;
  maxDuration: number;
}): { valid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (config.baselineConversionRate <= 0 || config.baselineConversionRate >= 1) {
    errors.push('Baseline conversion rate must be between 0 and 1');
  }

  if (config.minimumDetectableEffect <= 0) {
    errors.push('Minimum detectable effect must be positive');
  }

  if (config.minimumDetectableEffect < 0.05) {
    warnings.push('MDE below 5% requires large sample sizes. Consider increasing MDE.');
  }

  const sampleCalc = calculateSampleSize(
    config.baselineConversionRate,
    config.minimumDetectableEffect
  );

  if (config.estimatedDailyTraffic > 0) {
    const requiredDays = sampleCalc.totalSampleSize / config.estimatedDailyTraffic;

    if (requiredDays > config.maxDuration) {
      errors.push(
        `Experiment will take ${Math.ceil(requiredDays)} days but max duration is ${config.maxDuration} days. Increase MDE or traffic.`
      );
    }

    if (requiredDays > 90) {
      warnings.push('Experiment will take more than 90 days. Consider higher MDE or more traffic.');
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
