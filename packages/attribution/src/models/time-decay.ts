import { Touchpoint, AttributionResult } from '../types';

/**
 * Time-Decay Attribution
 *
 * Gives more credit to touchpoints closer to conversion using exponential decay.
 * Default half-life: 7 days (credit halves every 7 days before conversion)
 *
 * Formula: credit = exp(-0.693 * days_before_conversion / half_life)
 *
 * Best for: Valuing recent interactions while acknowledging earlier touchpoints
 *
 * Example (7-day half-life):
 * User journey: Google Ad (14 days ago) → Facebook (7 days ago) → Direct (0 days ago)
 * Raw weights: Google (0.25), Facebook (0.5), Direct (1.0)
 * Normalized: Google (14.3%), Facebook (28.6%), Direct (57.1%)
 */
export function timeDecayAttribution(
  touchpoints: Touchpoint[],
  conversionTimestamp: Date,
  halfLifeDays: number = 7
): AttributionResult[] {
  if (touchpoints.length === 0) {
    return [];
  }

  const decayConstant = 0.693;

  const touchpointsWithWeight = touchpoints.map(tp => {
    const daysBeforeConversion =
      (conversionTimestamp.getTime() - tp.timestamp.getTime()) / (1000 * 60 * 60 * 24);

    const weight = Math.exp((-decayConstant * daysBeforeConversion) / halfLifeDays);

    return {
      touchpoint: tp,
      weight,
    };
  });

  const totalWeight = touchpointsWithWeight.reduce((sum, item) => sum + item.weight, 0);

  const resultMap = new Map<string, AttributionResult>();

  touchpointsWithWeight.forEach(({ touchpoint: tp, weight }) => {
    const key = `${tp.source}|${tp.medium}|${tp.campaign}`;
    const credit = weight / totalWeight;

    if (!resultMap.has(key)) {
      resultMap.set(key, {
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        credit: 0,
        touchpointCount: 0,
      });
    }

    const result = resultMap.get(key)!;
    result.credit += credit;
    result.touchpointCount++;
  });

  return Array.from(resultMap.values());
}
