import { firstTouchAttribution } from './models/first-touch';
import { lastTouchAttribution } from './models/last-touch';
import { linearAttribution } from './models/linear';
import { timeDecayAttribution } from './models/time-decay';
import { positionBasedAttribution } from './models/position-based';

import {
  Touchpoint,
  AttributionResult,
  ConversionData,
  AttributionModel,
  AttributionConfig,
  AttributionSummary,
} from './types';

export * from './types';
export * from './models/first-touch';
export * from './models/last-touch';
export * from './models/linear';
export * from './models/time-decay';
export * from './models/position-based';

/**
 * Main attribution engine
 *
 * Calculates attribution credits for a single conversion based on configured model
 */
export function calculateAttribution(
  conversion: ConversionData,
  config: AttributionConfig
): AttributionResult[] {
  const { touchpoints } = conversion;

  if (touchpoints.length === 0) {
    return [];
  }

  switch (config.model) {
    case AttributionModel.FIRST_TOUCH:
      return firstTouchAttribution(touchpoints);

    case AttributionModel.LAST_TOUCH:
      return lastTouchAttribution(touchpoints);

    case AttributionModel.LINEAR:
      return linearAttribution(touchpoints);

    case AttributionModel.TIME_DECAY:
      return timeDecayAttribution(
        touchpoints,
        conversion.conversionTimestamp,
        config.timeDecayHalfLife || 7
      );

    case AttributionModel.POSITION_BASED:
      return positionBasedAttribution(touchpoints, config.positionBasedWeights);

    default:
      throw new Error(`Unknown attribution model: ${config.model}`);
  }
}

/**
 * Batch attribution calculation for multiple conversions
 *
 * Aggregates results across all conversions for channel-level analysis
 */
export function calculateBatchAttribution(
  conversions: ConversionData[],
  config: AttributionConfig
): AttributionSummary {
  const aggregatedResults = new Map<string, AttributionResult>();
  let totalTouchpoints = 0;

  conversions.forEach(conversion => {
    const results = calculateAttribution(conversion, config);
    totalTouchpoints += conversion.touchpoints.length;

    results.forEach(result => {
      const key = `${result.source}|${result.medium}|${result.campaign}`;

      if (!aggregatedResults.has(key)) {
        aggregatedResults.set(key, {
          source: result.source,
          medium: result.medium,
          campaign: result.campaign,
          credit: 0,
          touchpointCount: 0,
        });
      }

      const aggregated = aggregatedResults.get(key)!;
      aggregated.credit += result.credit;
      aggregated.touchpointCount += result.touchpointCount;
    });
  });

  const results = Array.from(aggregatedResults.values()).sort((a, b) => b.credit - a.credit);

  return {
    model: config.model,
    results,
    totalConversions: conversions.length,
    totalTouchpoints,
    averageTouchpointsPerConversion: totalTouchpoints / conversions.length,
  };
}

/**
 * Compare multiple attribution models side-by-side
 *
 * Returns results for all 5 models for easy comparison
 */
export function compareAttributionModels(conversions: ConversionData[]): {
  [model: string]: AttributionSummary;
} {
  const models = [
    AttributionModel.FIRST_TOUCH,
    AttributionModel.LAST_TOUCH,
    AttributionModel.LINEAR,
    AttributionModel.TIME_DECAY,
    AttributionModel.POSITION_BASED,
  ];

  const results: { [model: string]: AttributionSummary } = {};

  models.forEach(model => {
    results[model] = calculateBatchAttribution(conversions, {
      model,
      timeDecayHalfLife: 7,
      positionBasedWeights: { first: 0.4, last: 0.4, middle: 0.2 },
    });
  });

  return results;
}

/**
 * Helper: Build touchpoints from raw event data
 *
 * Converts database events into touchpoint format
 */
export function buildTouchpointsFromEvents(events: Array<{
  id: string;
  timestamp: Date | string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  session_id?: string;
}>): Touchpoint[] {
  return events
    .filter(e => e.utm_source && e.utm_medium)
    .map(e => ({
      timestamp: typeof e.timestamp === 'string' ? new Date(e.timestamp) : e.timestamp,
      source: e.utm_source || 'direct',
      medium: e.utm_medium || 'none',
      campaign: e.utm_campaign || 'none',
      content: e.utm_content,
      term: e.utm_term,
      sessionId: e.session_id || '',
      eventId: e.id,
    }));
}

/**
 * Helper: Calculate attribution for a user from database
 *
 * Fetches events, identifies conversion, and calculates attribution
 */
export async function calculateUserAttribution(
  userId: string,
  conversionEventName: string,
  fetchEvents: (userId: string) => Promise<Array<any>>,
  config: AttributionConfig
): Promise<AttributionResult[]> {
  const events = await fetchEvents(userId);

  const conversionEvent = events.find(e => e.event_name === conversionEventName);
  if (!conversionEvent) {
    return [];
  }

  const eventsBeforeConversion = events.filter(
    e => new Date(e.server_timestamp) <= new Date(conversionEvent.server_timestamp)
  );

  const touchpoints = buildTouchpointsFromEvents(eventsBeforeConversion);

  const conversion: ConversionData = {
    userId,
    conversionTimestamp: new Date(conversionEvent.server_timestamp),
    touchpoints,
  };

  return calculateAttribution(conversion, config);
}

/**
 * Utility: Format attribution result as percentage
 */
export function formatAttributionCredit(credit: number): string {
  return `${(credit * 100).toFixed(2)}%`;
}

/**
 * Utility: Get top N channels by attribution credit
 */
export function getTopChannels(results: AttributionResult[], limit: number = 10): AttributionResult[] {
  return results.sort((a, b) => b.credit - a.credit).slice(0, limit);
}
