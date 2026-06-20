export interface ExperimentVariant {
  name: string;
  users: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  revenuePerUser?: number;
}

export interface ExperimentResult {
  experimentName: string;
  control: ExperimentVariant;
  treatment: ExperimentVariant;
  statistical: StatisticalTestResult;
  recommendation: 'continue' | 'ship_treatment' | 'ship_control' | 'inconclusive';
  summary: string;
}

export interface StatisticalTestResult {
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;
  relativeUplift: number;
  absoluteUplift: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  sampleSizeReached: boolean;
  minimumSampleSize: number;
}

export interface ChiSquareResult {
  chiSquare: number;
  pValue: number;
  degreesOfFreedom: number;
  isSignificant: boolean;
  confidenceLevel: number;
}

export interface TTestResult {
  tStatistic: number;
  pValue: number;
  degreesOfFreedom: number;
  isSignificant: boolean;
  confidenceLevel: number;
  meanDifference: number;
  standardError: number;
}

export interface SequentialTestResult {
  shouldStop: boolean;
  reason: 'significance_reached' | 'futility_reached' | 'continue';
  spendingFunction: number;
  pValue: number;
  threshold: number;
}

export interface SampleSizeCalculation {
  requiredSampleSizePerVariant: number;
  totalSampleSize: number;
  estimatedDays: number;
  power: number;
  alpha: number;
  minimumDetectableEffect: number;
  baselineConversionRate: number;
}
