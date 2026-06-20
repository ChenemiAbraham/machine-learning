import { Touchpoint, AttributionResult } from '../types';

/**
 * Linear Attribution
 *
 * Gives equal credit to all touchpoints in the customer journey.
 * Best for: Balanced view of all contributing channels
 *
 * Example:
 * User journey: Google Ad → Facebook → Direct (3 touchpoints)
 * Credit: Google Ad (33.3%), Facebook (33.3%), Direct (33.3%)
 */
export function linearAttribution(touchpoints: Touchpoint[]): AttributionResult[] {
  if (touchpoints.length === 0) {
    return [];
  }

  const creditPerTouchpoint = 1.0 / touchpoints.length;
  const resultMap = new Map<string, AttributionResult>();

  touchpoints.forEach(tp => {
    const key = `${tp.source}|${tp.medium}|${tp.campaign}`;

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
    result.credit += creditPerTouchpoint;
    result.touchpointCount++;
  });

  return Array.from(resultMap.values());
}
