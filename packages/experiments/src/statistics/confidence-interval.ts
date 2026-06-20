/**
 * Calculate confidence interval for conversion rate difference
 *
 * Uses Wilson score interval for proportions
 */
export function calculateConfidenceInterval(
  controlConverted: number,
  controlTotal: number,
  treatmentConverted: number,
  treatmentTotal: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number; relativeLower: number; relativeUpper: number } {
  const controlRate = controlConverted / controlTotal;
  const treatmentRate = treatmentConverted / treatmentTotal;

  const zScore = getZScore(confidenceLevel);

  const seControl = Math.sqrt((controlRate * (1 - controlRate)) / controlTotal);
  const seTreatment = Math.sqrt((treatmentRate * (1 - treatmentRate)) / treatmentTotal);

  const seDifference = Math.sqrt(seControl ** 2 + seTreatment ** 2);

  const difference = treatmentRate - controlRate;

  const marginOfError = zScore * seDifference;

  const lower = difference - marginOfError;
  const upper = difference + marginOfError;

  const relativeLower = controlRate > 0 ? lower / controlRate : 0;
  const relativeUpper = controlRate > 0 ? upper / controlRate : 0;

  return {
    lower,
    upper,
    relativeLower,
    relativeUpper,
  };
}

/**
 * Get Z-score for confidence level
 */
function getZScore(confidenceLevel: number): number {
  const zScores: { [key: number]: number } = {
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
    0.999: 3.291,
  };

  return zScores[confidenceLevel] || 1.96;
}

/**
 * Calculate confidence interval for revenue/continuous metrics
 */
export function calculateContinuousConfidenceInterval(
  controlMean: number,
  controlStdDev: number,
  controlN: number,
  treatmentMean: number,
  treatmentStdDev: number,
  treatmentN: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  const zScore = getZScore(confidenceLevel);

  const seControl = controlStdDev / Math.sqrt(controlN);
  const seTreatment = treatmentStdDev / Math.sqrt(treatmentN);

  const seDifference = Math.sqrt(seControl ** 2 + seTreatment ** 2);

  const difference = treatmentMean - controlMean;

  const marginOfError = zScore * seDifference;

  return {
    lower: difference - marginOfError,
    upper: difference + marginOfError,
  };
}
