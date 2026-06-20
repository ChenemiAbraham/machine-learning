import { Touchpoint, AttributionResult } from '../types';

/**
 * Position-Based Attribution (U-Shaped)
 *
 * Gives most credit to first and last touchpoints, distributes remainder to middle.
 * Default: 40% first, 40% last, 20% distributed among middle touchpoints
 *
 * Best for: Valuing both awareness and conversion while acknowledging nurture
 *
 * Example (40/40/20 split):
 * - 1 touchpoint: 100% to that touchpoint
 * - 2 touchpoints: 50% first, 50% last
 * - 3 touchpoints: 40% first, 20% middle, 40% last
 * - 4+ touchpoints: 40% first, 40% last, 20% split among middle touchpoints
 */
export function positionBasedAttribution(
  touchpoints: Touchpoint[],
  weights: { first: number; last: number; middle: number } = {
    first: 0.4,
    last: 0.4,
    middle: 0.2,
  }
): AttributionResult[] {
  if (touchpoints.length === 0) {
    return [];
  }

  if (weights.first + weights.last + weights.middle !== 1.0) {
    throw new Error('Weights must sum to 1.0');
  }

  const sorted = [...touchpoints].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const creditMap = new Map<string, number>();

  if (sorted.length === 1) {
    creditMap.set(getTouchpointKey(sorted[0]), 1.0);
  } else if (sorted.length === 2) {
    creditMap.set(getTouchpointKey(sorted[0]), 0.5);
    creditMap.set(getTouchpointKey(sorted[1]), 0.5);
  } else {
    const firstKey = getTouchpointKey(sorted[0]);
    const lastKey = getTouchpointKey(sorted[sorted.length - 1]);
    const middleTouchpoints = sorted.slice(1, -1);
    const creditPerMiddle = middleTouchpoints.length > 0 ? weights.middle / middleTouchpoints.length : 0;

    creditMap.set(firstKey, weights.first);
    creditMap.set(lastKey, weights.last);

    middleTouchpoints.forEach(tp => {
      const key = getTouchpointKey(tp);
      creditMap.set(key, (creditMap.get(key) || 0) + creditPerMiddle);
    });
  }

  const resultMap = new Map<string, AttributionResult>();

  touchpoints.forEach(tp => {
    const key = getTouchpointKey(tp);

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
    result.touchpointCount++;
  });

  creditMap.forEach((credit, key) => {
    const result = resultMap.get(key);
    if (result) {
      result.credit = credit;
    }
  });

  return Array.from(resultMap.values());
}

function getTouchpointKey(tp: Touchpoint): string {
  return `${tp.source}|${tp.medium}|${tp.campaign}`;
}
