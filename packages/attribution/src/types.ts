export interface Touchpoint {
  timestamp: Date;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
  sessionId: string;
  eventId: string;
}

export interface AttributionResult {
  source: string;
  medium: string;
  campaign: string;
  credit: number;
  touchpointCount: number;
}

export interface ConversionData {
  userId: string;
  conversionTimestamp: Date;
  conversionValue?: number;
  touchpoints: Touchpoint[];
}

export enum AttributionModel {
  FIRST_TOUCH = 'first_touch',
  LAST_TOUCH = 'last_touch',
  LINEAR = 'linear',
  TIME_DECAY = 'time_decay',
  POSITION_BASED = 'position_based',
}

export interface AttributionConfig {
  model: AttributionModel;
  timeDecayHalfLife?: number;
  positionBasedWeights?: {
    first: number;
    last: number;
    middle: number;
  };
}

export interface AttributionSummary {
  model: AttributionModel;
  results: AttributionResult[];
  totalConversions: number;
  totalTouchpoints: number;
  averageTouchpointsPerConversion: number;
}
