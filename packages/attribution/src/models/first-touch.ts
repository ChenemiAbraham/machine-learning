import { Touchpoint, AttributionResult } from '../types';

/**
 * First-Touch Attribution
 *
 * Gives 100% credit to the first touchpoint in the customer journey.
 * Best for: Understanding initial awareness channels
 *
 * Example:
 * User journey: Google Ad → Facebook → Direct
 * Credit: Google Ad (100%), Facebook (0%), Direct (0%)
 */
export function firstTouchAttribution(touchpoints: Touchpoint[]): AttributionResult[] {
  if (touchpoints.length === 0) {
    return [];
  }

  const sorted = [...touchpoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const firstTouchpoint = sorted[0];

  const key = `${firstTouchpoint.source}|${firstTouchpoint.medium}|${firstTouchpoint.campaign}`;
  const resultMap = new Map<string, AttributionResult>();

  touchpoints.forEach(tp => {
    const tpKey = `${tp.source}|${tp.medium}|${tp.campaign}`;
    if (!resultMap.has(tpKey)) {
      resultMap.set(tpKey, {
        source: tp.source,
        medium: tp.medium,
        campaign: tp.campaign,
        credit: tpKey === key ? 1.0 : 0.0,
        touchpointCount: 0,
      });
    }
    const result = resultMap.get(tpKey)!;
    result.touchpointCount++;
  });

  return Array.from(resultMap.values());
}
