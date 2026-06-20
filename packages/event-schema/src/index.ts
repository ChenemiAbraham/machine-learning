import { z } from 'zod';

// =====================================================
// BASE SCHEMAS
// =====================================================

export const UTMParametersSchema = z.object({
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

export const DeviceContextSchema = z.object({
  device_id: z.string().optional(),
  device_type: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).optional(),
  device_os: z.string().optional(),
  device_model: z.string().optional(),
  app_version: z.string().optional(),
  browser: z.string().optional(),
  browser_version: z.string().optional(),
});

export const LocationContextSchema = z.object({
  ip_address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

export const ExperimentContextSchema = z.object({
  experiment_id: z.string().uuid().optional(),
  experiment_variant: z.string().optional(),
});

// =====================================================
// BASE EVENT SCHEMA
// =====================================================

export const BaseEventSchema = z.object({
  event_name: z.string(),
  user_id: z.string().uuid().optional(),
  anonymous_id: z.string().optional(),
  session_id: z.string().optional(),

  properties: z.record(z.any()).default({}),

  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  referrer: z.string().optional(),

  device_id: z.string().optional(),
  device_type: z.string().optional(),
  device_os: z.string().optional(),
  device_model: z.string().optional(),
  app_version: z.string().optional(),
  browser: z.string().optional(),
  browser_version: z.string().optional(),

  ip_address: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),

  experiment_id: z.string().uuid().optional(),
  experiment_variant: z.string().optional(),

  client_timestamp: z.string().datetime().optional(),
  server_timestamp: z.string().datetime().optional(),

  event_version: z.string().default('1.0'),
  sdk_version: z.string().optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// =====================================================
// SPECIFIC EVENT SCHEMAS
// =====================================================

// Page View
export const PageViewEventSchema = BaseEventSchema.extend({
  event_name: z.literal('page_view'),
  properties: z.object({
    page_url: z.string(),
    page_title: z.string().optional(),
    page_path: z.string().optional(),
    referrer: z.string().optional(),
  }),
});

export type PageViewEvent = z.infer<typeof PageViewEventSchema>;

// App Opened
export const AppOpenedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('app_opened'),
  properties: z.object({
    is_first_open: z.boolean().optional(),
    previous_app_version: z.string().optional(),
  }),
});

export type AppOpenedEvent = z.infer<typeof AppOpenedEventSchema>;

// Signup Started
export const SignupStartedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('signup_started'),
  properties: z.object({
    signup_method: z.enum(['email', 'phone', 'social']).optional(),
    source: z.string().optional(),
  }),
});

export type SignupStartedEvent = z.infer<typeof SignupStartedEventSchema>;

// Signup Completed
export const SignupCompletedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('signup_completed'),
  properties: z.object({
    signup_method: z.enum(['email', 'phone', 'social']),
    user_id: z.string().uuid(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
});

export type SignupCompletedEvent = z.infer<typeof SignupCompletedEventSchema>;

// KYC Started
export const KYCStartedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('kyc_started'),
  properties: z.object({
    kyc_type: z.enum(['basic', 'enhanced', 'full']).optional(),
  }),
});

export type KYCStartedEvent = z.infer<typeof KYCStartedEventSchema>;

// KYC Step Completed
export const KYCStepCompletedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('kyc_step_completed'),
  properties: z.object({
    step_name: z.string(),
    step_number: z.number().optional(),
    total_steps: z.number().optional(),
  }),
});

export type KYCStepCompletedEvent = z.infer<typeof KYCStepCompletedEventSchema>;

// KYC Completed
export const KYCCompletedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('kyc_completed'),
  properties: z.object({
    completion_time_seconds: z.number().optional(),
    attempt_count: z.number().optional(),
  }),
});

export type KYCCompletedEvent = z.infer<typeof KYCCompletedEventSchema>;

// KYC Failed
export const KYCFailedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('kyc_failed'),
  properties: z.object({
    failure_reason: z.string(),
    attempt_count: z.number().optional(),
  }),
});

export type KYCFailedEvent = z.infer<typeof KYCFailedEventSchema>;

// Transaction Initiated
export const TransactionInitiatedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('transaction_initiated'),
  properties: z.object({
    transaction_id: z.string().uuid(),
    transaction_type: z.enum(['send', 'receive', 'conversion', 'withdrawal', 'deposit']),
    amount: z.number(),
    currency: z.string(),
    recipient_country: z.string().optional(),
  }),
});

export type TransactionInitiatedEvent = z.infer<typeof TransactionInitiatedEventSchema>;

// Transaction Completed
export const TransactionCompletedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('transaction_completed'),
  properties: z.object({
    transaction_id: z.string().uuid(),
    transaction_type: z.enum(['send', 'receive', 'conversion', 'withdrawal', 'deposit']),
    amount: z.number(),
    currency: z.string(),
    fee: z.number().optional(),
    exchange_rate: z.number().optional(),
    is_first_transaction: z.boolean().optional(),
    completion_time_seconds: z.number().optional(),
  }),
});

export type TransactionCompletedEvent = z.infer<typeof TransactionCompletedEventSchema>;

// Transaction Failed
export const TransactionFailedEventSchema = BaseEventSchema.extend({
  event_name: z.literal('transaction_failed'),
  properties: z.object({
    transaction_id: z.string().uuid(),
    transaction_type: z.enum(['send', 'receive', 'conversion', 'withdrawal', 'deposit']),
    failure_reason: z.string(),
    error_code: z.string().optional(),
  }),
});

export type TransactionFailedEvent = z.infer<typeof TransactionFailedEventSchema>;

// =====================================================
// EVENT UNION TYPE
// =====================================================

export const EventSchema = z.union([
  PageViewEventSchema,
  AppOpenedEventSchema,
  SignupStartedEventSchema,
  SignupCompletedEventSchema,
  KYCStartedEventSchema,
  KYCStepCompletedEventSchema,
  KYCCompletedEventSchema,
  KYCFailedEventSchema,
  TransactionInitiatedEventSchema,
  TransactionCompletedEventSchema,
  TransactionFailedEventSchema,
  BaseEventSchema,
]);

export type Event = z.infer<typeof EventSchema>;

// =====================================================
// USER TYPES
// =====================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  country_code: z.string().optional(),
  kyc_status: z.enum(['not_started', 'in_progress', 'completed', 'failed', 'rejected']),
  kyc_completed_at: z.string().datetime().optional(),
  signup_source: z.string().optional(),
  signup_utm_source: z.string().optional(),
  signup_utm_medium: z.string().optional(),
  signup_utm_campaign: z.string().optional(),
  signup_utm_content: z.string().optional(),
  signup_utm_term: z.string().optional(),
  device_id: z.string().optional(),
  device_type: z.string().optional(),
  device_os: z.string().optional(),
  app_version: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// =====================================================
// TRANSACTION TYPES
// =====================================================

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['send', 'receive', 'conversion', 'withdrawal', 'deposit']),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  amount: z.number(),
  currency: z.string(),
  fee: z.number().optional(),
  exchange_rate: z.number().optional(),
  recipient_id: z.string().uuid().optional(),
  recipient_name: z.string().optional(),
  recipient_account: z.string().optional(),
  reference: z.string().optional(),
  provider: z.string().optional(),
  external_reference: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  failed_at: z.string().datetime().optional(),
  failure_reason: z.string().optional(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// =====================================================
// EXPERIMENT TYPES
// =====================================================

export const ExperimentVariantSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(1),
  description: z.string().optional(),
});

export const ExperimentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  hypothesis: z.string().optional(),
  status: z.enum(['draft', 'running', 'paused', 'completed', 'archived']),
  variants: z.array(ExperimentVariantSchema),
  allocation_percent: z.number().min(0).max(100).default(100),
  target_audience: z.record(z.any()).default({}),
  primary_metric: z.string(),
  secondary_metrics: z.array(z.string()).default([]),
  success_criteria: z.record(z.any()).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  confidence_level: z.number().default(0.95),
  minimum_detectable_effect: z.number().default(0.05),
  minimum_sample_size: z.number().optional(),
  results: z.record(z.any()).optional(),
  winner: z.string().optional(),
  created_by: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Experiment = z.infer<typeof ExperimentSchema>;
export type ExperimentVariant = z.infer<typeof ExperimentVariantSchema>;

export const ExperimentAssignmentSchema = z.object({
  id: z.string().uuid(),
  experiment_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  anonymous_id: z.string().optional(),
  variant: z.string(),
  assignment_hash: z.string(),
  assigned_at: z.string().datetime(),
});

export type ExperimentAssignment = z.infer<typeof ExperimentAssignmentSchema>;

// =====================================================
// SESSION TYPES
// =====================================================

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  anonymous_id: z.string().optional(),
  session_id: z.string(),
  device_id: z.string().optional(),
  first_event_at: z.string().datetime(),
  last_event_at: z.string().datetime(),
  event_count: z.number().default(0),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  referrer: z.string().optional(),
  landing_page: z.string().optional(),
  converted: z.boolean().default(false),
  conversion_event: z.string().optional(),
  converted_at: z.string().datetime().optional(),
  device_type: z.string().optional(),
  device_os: z.string().optional(),
  browser: z.string().optional(),
  country: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

// =====================================================
// RECONCILIATION TYPES
// =====================================================

export const ReconciliationReportSchema = z.object({
  id: z.string().uuid(),
  report_date: z.string(),
  entity_type: z.enum(['transactions', 'events', 'users']),
  source_count: z.number(),
  target_count: z.number(),
  discrepancy_count: z.number(),
  discrepancy_percentage: z.number().optional(),
  source_amount: z.number().optional(),
  target_amount: z.number().optional(),
  amount_discrepancy: z.number().optional(),
  status: z.enum(['healthy', 'warning', 'critical']).optional(),
  alerts: z.array(z.any()).default([]),
  sample_discrepancies: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
});

export type ReconciliationReport = z.infer<typeof ReconciliationReportSchema>;

// =====================================================
// ML FEATURE TYPES
// =====================================================

export const MLUserFeaturesSchema = z.object({
  user_id: z.string().uuid(),
  transaction_count_7d: z.number().default(0),
  transaction_count_30d: z.number().default(0),
  transaction_count_90d: z.number().default(0),
  total_volume_7d: z.number().default(0),
  total_volume_30d: z.number().default(0),
  avg_transaction_value_30d: z.number().default(0),
  days_since_last_transaction: z.number().optional(),
  first_transaction_date: z.string().optional(),
  app_open_count_7d: z.number().default(0),
  app_open_count_30d: z.number().default(0),
  session_count_7d: z.number().default(0),
  session_count_30d: z.number().default(0),
  days_since_last_app_open: z.number().optional(),
  kyc_completion_time_minutes: z.number().optional(),
  kyc_attempt_count: z.number().default(0),
  churn_risk_score: z.number().optional(),
  churn_probability: z.number().optional(),
  fraud_risk_score: z.number().optional(),
  fraud_probability: z.number().optional(),
  updated_at: z.string().datetime(),
});

export type MLUserFeatures = z.infer<typeof MLUserFeaturesSchema>;

export const MLPredictionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  model_name: z.string(),
  model_version: z.string(),
  prediction_type: z.enum(['churn', 'fraud', 'recommendation']),
  prediction: z.record(z.any()),
  probability: z.number().optional(),
  features_used: z.record(z.any()).optional(),
  inference_time_ms: z.number().optional(),
  action_taken: z.string().optional(),
  action_taken_at: z.string().datetime().optional(),
  actual_outcome: z.boolean().optional(),
  outcome_recorded_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
});

export type MLPrediction = z.infer<typeof MLPredictionSchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function validateEvent(event: unknown): Event {
  return EventSchema.parse(event);
}

export function isValidEvent(event: unknown): event is Event {
  return EventSchema.safeParse(event).success;
}

export function createEvent(
  eventName: string,
  properties: Record<string, any> = {},
  context: Partial<BaseEvent> = {}
): BaseEvent {
  return {
    event_name: eventName,
    properties,
    event_version: '1.0',
    ...context,
  };
}

export function enrichEventWithContext(
  event: Partial<BaseEvent>,
  utm: Partial<z.infer<typeof UTMParametersSchema>>,
  device: Partial<z.infer<typeof DeviceContextSchema>>,
  location: Partial<z.infer<typeof LocationContextSchema>>
): BaseEvent {
  return {
    ...event,
    ...utm,
    ...device,
    ...location,
  } as BaseEvent;
}
