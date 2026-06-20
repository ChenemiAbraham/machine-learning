import {
  firstTouchAttribution,
  lastTouchAttribution,
  linearAttribution,
  timeDecayAttribution,
  positionBasedAttribution,
  calculateAttribution,
  calculateBatchAttribution,
  compareAttributionModels,
} from '../index';
import { Touchpoint, AttributionModel, ConversionData } from '../types';

describe('Attribution Models', () => {
  const baseDate = new Date('2024-06-01T00:00:00Z');

  const createTouchpoint = (source: string, medium: string, daysAgo: number): Touchpoint => ({
    timestamp: new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    source,
    medium,
    campaign: 'test-campaign',
    sessionId: `session-${daysAgo}`,
    eventId: `event-${daysAgo}`,
  });

  describe('First-Touch Attribution', () => {
    it('should give 100% credit to first touchpoint', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 14),
        createTouchpoint('facebook', 'social', 7),
        createTouchpoint('direct', 'none', 0),
      ];

      const results = firstTouchAttribution(touchpoints);

      expect(results.find(r => r.source === 'google')?.credit).toBe(1.0);
      expect(results.find(r => r.source === 'facebook')?.credit).toBe(0.0);
      expect(results.find(r => r.source === 'direct')?.credit).toBe(0.0);
    });

    it('should handle single touchpoint', () => {
      const touchpoints = [createTouchpoint('google', 'cpc', 0)];
      const results = firstTouchAttribution(touchpoints);

      expect(results).toHaveLength(1);
      expect(results[0].credit).toBe(1.0);
    });

    it('should handle empty touchpoints', () => {
      const results = firstTouchAttribution([]);
      expect(results).toEqual([]);
    });
  });

  describe('Last-Touch Attribution', () => {
    it('should give 100% credit to last touchpoint', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 14),
        createTouchpoint('facebook', 'social', 7),
        createTouchpoint('direct', 'none', 0),
      ];

      const results = lastTouchAttribution(touchpoints);

      expect(results.find(r => r.source === 'google')?.credit).toBe(0.0);
      expect(results.find(r => r.source === 'facebook')?.credit).toBe(0.0);
      expect(results.find(r => r.source === 'direct')?.credit).toBe(1.0);
    });
  });

  describe('Linear Attribution', () => {
    it('should distribute credit equally', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 14),
        createTouchpoint('facebook', 'social', 7),
        createTouchpoint('direct', 'none', 0),
      ];

      const results = linearAttribution(touchpoints);

      results.forEach(result => {
        expect(result.credit).toBeCloseTo(1 / 3, 5);
      });
    });

    it('should aggregate multiple touchpoints from same source', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 14),
        createTouchpoint('google', 'cpc', 10),
        createTouchpoint('facebook', 'social', 5),
      ];

      const results = linearAttribution(touchpoints);

      expect(results.find(r => r.source === 'google')?.credit).toBeCloseTo(2 / 3, 5);
      expect(results.find(r => r.source === 'facebook')?.credit).toBeCloseTo(1 / 3, 5);
    });
  });

  describe('Time-Decay Attribution', () => {
    it('should give more credit to recent touchpoints', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 14),
        createTouchpoint('facebook', 'social', 7),
        createTouchpoint('direct', 'none', 0),
      ];

      const results = timeDecayAttribution(touchpoints, baseDate, 7);

      const googleCredit = results.find(r => r.source === 'google')?.credit || 0;
      const facebookCredit = results.find(r => r.source === 'facebook')?.credit || 0;
      const directCredit = results.find(r => r.source === 'direct')?.credit || 0;

      expect(directCredit).toBeGreaterThan(facebookCredit);
      expect(facebookCredit).toBeGreaterThan(googleCredit);

      const totalCredit = googleCredit + facebookCredit + directCredit;
      expect(totalCredit).toBeCloseTo(1.0, 5);
    });

    it('should respect half-life parameter', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 14),
        createTouchpoint('facebook', 'social', 7),
      ];

      const results7day = timeDecayAttribution(touchpoints, baseDate, 7);
      const results14day = timeDecayAttribution(touchpoints, baseDate, 14);

      const google7 = results7day.find(r => r.source === 'google')?.credit || 0;
      const google14 = results14day.find(r => r.source === 'google')?.credit || 0;

      expect(google14).toBeGreaterThan(google7);
    });
  });

  describe('Position-Based Attribution', () => {
    it('should give 40% to first, 40% to last, 20% to middle', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 21),
        createTouchpoint('facebook', 'social', 14),
        createTouchpoint('twitter', 'social', 7),
        createTouchpoint('direct', 'none', 0),
      ];

      const results = positionBasedAttribution(touchpoints);

      expect(results.find(r => r.source === 'google')?.credit).toBeCloseTo(0.4, 5);
      expect(results.find(r => r.source === 'direct')?.credit).toBeCloseTo(0.4, 5);

      const middleCredit =
        (results.find(r => r.source === 'facebook')?.credit || 0) +
        (results.find(r => r.source === 'twitter')?.credit || 0);

      expect(middleCredit).toBeCloseTo(0.2, 5);
    });

    it('should handle two touchpoints (50/50 split)', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 7),
        createTouchpoint('direct', 'none', 0),
      ];

      const results = positionBasedAttribution(touchpoints);

      expect(results.find(r => r.source === 'google')?.credit).toBe(0.5);
      expect(results.find(r => r.source === 'direct')?.credit).toBe(0.5);
    });

    it('should allow custom weights', () => {
      const touchpoints = [
        createTouchpoint('google', 'cpc', 14),
        createTouchpoint('facebook', 'social', 7),
        createTouchpoint('direct', 'none', 0),
      ];

      const results = positionBasedAttribution(touchpoints, {
        first: 0.5,
        last: 0.3,
        middle: 0.2,
      });

      expect(results.find(r => r.source === 'google')?.credit).toBeCloseTo(0.5, 5);
      expect(results.find(r => r.source === 'direct')?.credit).toBeCloseTo(0.3, 5);
      expect(results.find(r => r.source === 'facebook')?.credit).toBeCloseTo(0.2, 5);
    });
  });

  describe('Calculate Attribution', () => {
    it('should calculate attribution for a conversion', () => {
      const conversion: ConversionData = {
        userId: 'user-123',
        conversionTimestamp: baseDate,
        touchpoints: [
          createTouchpoint('google', 'cpc', 14),
          createTouchpoint('facebook', 'social', 7),
        ],
      };

      const results = calculateAttribution(conversion, {
        model: AttributionModel.LINEAR,
      });

      expect(results).toHaveLength(2);
      results.forEach(r => {
        expect(r.credit).toBeCloseTo(0.5, 5);
      });
    });
  });

  describe('Batch Attribution', () => {
    it('should aggregate attribution across multiple conversions', () => {
      const conversions: ConversionData[] = [
        {
          userId: 'user-1',
          conversionTimestamp: baseDate,
          touchpoints: [
            createTouchpoint('google', 'cpc', 7),
            createTouchpoint('direct', 'none', 0),
          ],
        },
        {
          userId: 'user-2',
          conversionTimestamp: baseDate,
          touchpoints: [
            createTouchpoint('google', 'cpc', 10),
            createTouchpoint('facebook', 'social', 5),
          ],
        },
        {
          userId: 'user-3',
          conversionTimestamp: baseDate,
          touchpoints: [createTouchpoint('facebook', 'social', 3)],
        },
      ];

      const summary = calculateBatchAttribution(conversions, {
        model: AttributionModel.LINEAR,
      });

      expect(summary.totalConversions).toBe(3);
      expect(summary.totalTouchpoints).toBe(5);
      expect(summary.averageTouchpointsPerConversion).toBeCloseTo(5 / 3, 5);

      const googleResult = summary.results.find(r => r.source === 'google');
      expect(googleResult?.credit).toBeCloseTo(1.0, 5);

      const facebookResult = summary.results.find(r => r.source === 'facebook');
      expect(facebookResult?.credit).toBeCloseTo(1.5, 5);
    });
  });

  describe('Compare Attribution Models', () => {
    it('should return results for all models', () => {
      const conversions: ConversionData[] = [
        {
          userId: 'user-1',
          conversionTimestamp: baseDate,
          touchpoints: [
            createTouchpoint('google', 'cpc', 14),
            createTouchpoint('facebook', 'social', 7),
            createTouchpoint('direct', 'none', 0),
          ],
        },
      ];

      const comparison = compareAttributionModels(conversions);

      expect(Object.keys(comparison)).toHaveLength(5);
      expect(comparison[AttributionModel.FIRST_TOUCH]).toBeDefined();
      expect(comparison[AttributionModel.LAST_TOUCH]).toBeDefined();
      expect(comparison[AttributionModel.LINEAR]).toBeDefined();
      expect(comparison[AttributionModel.TIME_DECAY]).toBeDefined();
      expect(comparison[AttributionModel.POSITION_BASED]).toBeDefined();
    });

    it('should show different credit distributions per model', () => {
      const conversions: ConversionData[] = [
        {
          userId: 'user-1',
          conversionTimestamp: baseDate,
          touchpoints: [
            createTouchpoint('google', 'cpc', 14),
            createTouchpoint('facebook', 'social', 7),
            createTouchpoint('direct', 'none', 0),
          ],
        },
      ];

      const comparison = compareAttributionModels(conversions);

      const googleFirstTouch =
        comparison[AttributionModel.FIRST_TOUCH].results.find(r => r.source === 'google')?.credit || 0;
      const googleLastTouch =
        comparison[AttributionModel.LAST_TOUCH].results.find(r => r.source === 'google')?.credit || 0;

      expect(googleFirstTouch).toBe(1.0);
      expect(googleLastTouch).toBe(0.0);
    });
  });
});
