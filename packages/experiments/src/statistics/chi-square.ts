import { ChiSquareResult } from '../types';

/**
 * Chi-Square Test for Independence
 *
 * Used for categorical outcomes (e.g., converted vs not converted)
 * Tests if conversion rate difference is statistically significant
 *
 * H0: Conversion rates are equal
 * H1: Conversion rates are different
 */
export function chiSquareTest(
  controlConverted: number,
  controlTotal: number,
  treatmentConverted: number,
  treatmentTotal: number,
  confidenceLevel: number = 0.95
): ChiSquareResult {
  const controlNotConverted = controlTotal - controlConverted;
  const treatmentNotConverted = treatmentTotal - treatmentConverted;

  const totalConverted = controlConverted + treatmentConverted;
  const totalNotConverted = controlNotConverted + treatmentNotConverted;
  const totalControl = controlTotal;
  const totalTreatment = treatmentTotal;
  const grandTotal = controlTotal + treatmentTotal;

  const expectedControlConverted = (totalControl * totalConverted) / grandTotal;
  const expectedControlNotConverted = (totalControl * totalNotConverted) / grandTotal;
  const expectedTreatmentConverted = (totalTreatment * totalConverted) / grandTotal;
  const expectedTreatmentNotConverted = (totalTreatment * totalNotConverted) / grandTotal;

  const chiSquare =
    Math.pow(controlConverted - expectedControlConverted, 2) / expectedControlConverted +
    Math.pow(controlNotConverted - expectedControlNotConverted, 2) / expectedControlNotConverted +
    Math.pow(treatmentConverted - expectedTreatmentConverted, 2) / expectedTreatmentConverted +
    Math.pow(treatmentNotConverted - expectedTreatmentNotConverted, 2) / expectedTreatmentNotConverted;

  const degreesOfFreedom = 1;

  const pValue = 1 - chiSquareCDF(chiSquare, degreesOfFreedom);

  const alpha = 1 - confidenceLevel;
  const isSignificant = pValue < alpha;

  return {
    chiSquare,
    pValue,
    degreesOfFreedom,
    isSignificant,
    confidenceLevel,
  };
}

/**
 * Chi-Square Cumulative Distribution Function
 *
 * Approximation using Gamma function
 */
function chiSquareCDF(x: number, k: number): number {
  if (x <= 0) return 0;
  if (x >= 1000) return 1;

  return incompleteGamma(k / 2, x / 2) / gamma(k / 2);
}

/**
 * Gamma Function
 *
 * Using Stirling's approximation for large values
 */
function gamma(n: number): number {
  if (n === 1 || n === 2) return 1;
  if (n > 1 && n < 2) return Math.sqrt(Math.PI);

  const g = 7;
  const C = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  let z = n;
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }

  z -= 1;
  let x = C[0];
  for (let i = 1; i < g + 2; i++) {
    x += C[i] / (z + i);
  }

  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Incomplete Gamma Function
 *
 * Using series expansion
 */
function incompleteGamma(s: number, x: number): number {
  if (x === 0) return 0;
  if (x < 0 || s <= 0) return NaN;

  if (x < s + 1) {
    let sum = 1 / s;
    let term = 1 / s;
    for (let n = 1; n <= 100; n++) {
      term *= x / (s + n);
      sum += term;
      if (Math.abs(term) < 1e-10) break;
    }
    return sum * Math.exp(-x + s * Math.log(x));
  } else {
    let a = 1 - s;
    let b = a + x + 1;
    let term = 0;
    let pn = [1, x, x + 1, x * (x + 1)];

    let result = pn[2] / pn[3];
    for (let n = 1; n <= 100; n++) {
      a++;
      b += 2;
      term++;
      const an = a * term;
      pn = [pn[1], pn[2], b * pn[3] - an * pn[1], b * pn[2] - an * pn[0]];
      if (pn[3] !== 0) {
        const rk = pn[2] / pn[3];
        if (Math.abs(result - rk) < 1e-10) break;
        result = rk;
      }
    }
    return gamma(s) - result * Math.exp(-x + s * Math.log(x));
  }
}

/**
 * Calculate minimum sample size for chi-square test
 */
export function calculateSampleSizeChiSquare(
  baselineConversionRate: number,
  minimumDetectableEffect: number,
  power: number = 0.8,
  alpha: number = 0.05
): number {
  const p1 = baselineConversionRate;
  const p2 = p1 * (1 + minimumDetectableEffect);

  const pPooled = (p1 + p2) / 2;

  const zAlpha = 1.96;
  const zBeta = 0.84;

  const nPerVariant =
    Math.pow(zAlpha * Math.sqrt(2 * pPooled * (1 - pPooled)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) /
    Math.pow(p2 - p1, 2);

  return Math.ceil(nPerVariant);
}
