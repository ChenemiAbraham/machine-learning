import { Touchpoint, AttributionResult } from '../types';

/**
 * Last-Touch Attribution
 *
 * Gives 100% credit to the last touchpoint before conversion.
 * Best for: Understanding final conversion drivers
 *
 * Example:
 * User journey: Google Ad → Facebook → Direct
 * Credit: Google Ad (0%), Facebook (0%), Direct (100%)
 */
export function lastTouchAttribution(touchpoints: Touchpoint[]): AttributionResult[] {
  if (touchpoints.length === 0) {
    return [];
  }

  const sorted = [...touchpoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const lastTouchpoint = sorted[sorted.length - 1];

  const key = `${lastTouchpoint.source}|${lastTouchpoint.medium}|${lastTouchpoint.campaign}`;
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
