-- Juicyway Growth Platform - Initial Schema
-- This schema supports: event tracking, attribution, experiments, transactions, and ML features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  country_code TEXT,
  kyc_status TEXT CHECK (kyc_status IN ('not_started', 'in_progress', 'completed', 'failed', 'rejected')),
  kyc_completed_at TIMESTAMPTZ,
  signup_source TEXT,
  signup_utm_source TEXT,
  signup_utm_medium TEXT,
  signup_utm_campaign TEXT,
  signup_utm_content TEXT,
  signup_utm_term TEXT,
  device_id TEXT,
  device_type TEXT,
  device_os TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON public.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON public.users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_device_id ON public.users(device_id);
CREATE INDEX idx_users_kyc_status ON public.users(kyc_status);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- =====================================================
-- TRANSACTIONS (Transactional System of Record)
-- =====================================================

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('send', 'receive', 'conversion', 'withdrawal', 'deposit')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  amount DECIMAL(19, 4) NOT NULL,
  currency TEXT NOT NULL,
  fee DECIMAL(19, 4),
  exchange_rate DECIMAL(19, 8),
  recipient_id UUID REFERENCES public.users(id),
  recipient_name TEXT,
  recipient_account TEXT,
  reference TEXT,
  provider TEXT,
  external_reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transactions_completed_at ON public.transactions(completed_at);
CREATE INDEX idx_transactions_user_created ON public.transactions(user_id, created_at);

-- =====================================================
-- EVENTS (Immutable Event Log for Analytics)
-- =====================================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id),
  anonymous_id TEXT,
  session_id TEXT,
  device_id TEXT,

  -- Event metadata
  properties JSONB DEFAULT '{}'::jsonb,

  -- Attribution tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,

  -- Device & context
  device_type TEXT,
  device_os TEXT,
  device_model TEXT,
  app_version TEXT,
  browser TEXT,
  browser_version TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,

  -- Experiment tracking
  experiment_id UUID,
  experiment_variant TEXT,

  -- Timestamps
  client_timestamp TIMESTAMPTZ,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  event_version TEXT DEFAULT '1.0',
  sdk_version TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event queries
CREATE INDEX idx_events_event_name ON public.events(event_name);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_anonymous_id ON public.events(anonymous_id);
CREATE INDEX idx_events_session_id ON public.events(session_id);
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX idx_events_user_created ON public.events(user_id, created_at);
CREATE INDEX idx_events_experiment ON public.events(experiment_id, experiment_variant) WHERE experiment_id IS NOT NULL;
CREATE INDEX idx_events_properties ON public.events USING GIN (properties);

-- Partitioning by month for scalability (uncomment in production)
-- CREATE TABLE public.events_2024_06 PARTITION OF public.events
--   FOR VALUES FROM ('2024-06-01') TO ('2024-07-01');

-- =====================================================
-- SESSIONS (Session Stitching for Attribution)
-- =====================================================

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  anonymous_id TEXT,
  session_id TEXT UNIQUE NOT NULL,
  device_id TEXT,

  -- Session tracking
  first_event_at TIMESTAMPTZ NOT NULL,
  last_event_at TIMESTAMPTZ NOT NULL,
  event_count INT DEFAULT 0,

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_page TEXT,

  -- Conversion tracking
  converted BOOLEAN DEFAULT FALSE,
  conversion_event TEXT,
  converted_at TIMESTAMPTZ,

  -- Device info
  device_type TEXT,
  device_os TEXT,
  browser TEXT,
  country TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_anonymous_id ON public.sessions(anonymous_id);
CREATE INDEX idx_sessions_session_id ON public.sessions(session_id);
CREATE INDEX idx_sessions_first_event ON public.sessions(first_event_at);
CREATE INDEX idx_sessions_converted ON public.sessions(converted, converted_at);

-- =====================================================
-- EXPERIMENTS (A/B Testing & Feature Flags)
-- =====================================================

CREATE TABLE public.experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  hypothesis TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),

  -- Experiment configuration
  variants JSONB NOT NULL, -- [{"name": "control", "weight": 0.5}, {"name": "treatment", "weight": 0.5}]
  allocation_percent DECIMAL(5, 2) DEFAULT 100.00,

  -- Targeting
  target_audience JSONB DEFAULT '{}'::jsonb,

  -- Metrics
  primary_metric TEXT NOT NULL,
  secondary_metrics TEXT[],
  success_criteria JSONB,

  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Statistical settings
  confidence_level DECIMAL(5, 4) DEFAULT 0.95,
  minimum_detectable_effect DECIMAL(5, 4) DEFAULT 0.05,
  minimum_sample_size INT,

  -- Results
  results JSONB,
  winner TEXT,

  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_experiments_status ON public.experiments(status);
CREATE INDEX idx_experiments_name ON public.experiments(name);

-- =====================================================
-- EXPERIMENT ASSIGNMENTS
-- =====================================================

CREATE TABLE public.experiment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id),
  user_id UUID REFERENCES public.users(id),
  anonymous_id TEXT,
  variant TEXT NOT NULL,

  -- Consistency (for re-assignment checks)
  assignment_hash TEXT NOT NULL,

  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(experiment_id, user_id),
  UNIQUE(experiment_id, anonymous_id)
);

CREATE INDEX idx_assignments_experiment ON public.experiment_assignments(experiment_id);
CREATE INDEX idx_assignments_user ON public.experiment_assignments(user_id);
CREATE INDEX idx_assignments_anonymous ON public.experiment_assignments(anonymous_id);

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,

  -- Rollout configuration
  rollout_percentage DECIMAL(5, 2) DEFAULT 0.00,
  rollout_rules JSONB DEFAULT '[]'::jsonb,

  -- Targeting
  target_users UUID[],
  target_segments JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(enabled);

-- =====================================================
-- RECONCILIATION (Data Quality Monitoring)
-- =====================================================

CREATE TABLE public.reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('transactions', 'events', 'users')),

  -- Counts
  source_count BIGINT NOT NULL,
  target_count BIGINT NOT NULL,
  discrepancy_count BIGINT NOT NULL,
  discrepancy_percentage DECIMAL(5, 2),

  -- Amounts (for transactions)
  source_amount DECIMAL(19, 4),
  target_amount DECIMAL(19, 4),
  amount_discrepancy DECIMAL(19, 4),

  -- Status
  status TEXT CHECK (status IN ('healthy', 'warning', 'critical')),
  alerts JSONB DEFAULT '[]'::jsonb,

  -- Details
  sample_discrepancies JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(report_date, entity_type)
);

CREATE INDEX idx_reconciliation_date ON public.reconciliation_reports(report_date DESC);
CREATE INDEX idx_reconciliation_status ON public.reconciliation_reports(status);

-- =====================================================
-- ML FEATURES (For Feast Feature Store)
-- =====================================================

CREATE TABLE public.ml_user_features (
  user_id UUID PRIMARY KEY REFERENCES public.users(id),

  -- Transaction features
  transaction_count_7d INT DEFAULT 0,
  transaction_count_30d INT DEFAULT 0,
  transaction_count_90d INT DEFAULT 0,
  total_volume_7d DECIMAL(19, 4) DEFAULT 0,
  total_volume_30d DECIMAL(19, 4) DEFAULT 0,
  avg_transaction_value_30d DECIMAL(19, 4) DEFAULT 0,
  days_since_last_transaction INT,
  first_transaction_date DATE,

  -- Engagement features
  app_open_count_7d INT DEFAULT 0,
  app_open_count_30d INT DEFAULT 0,
  session_count_7d INT DEFAULT 0,
  session_count_30d INT DEFAULT 0,
  days_since_last_app_open INT,

  -- KYC features
  kyc_completion_time_minutes INT,
  kyc_attempt_count INT DEFAULT 0,

  -- Churn signals
  churn_risk_score DECIMAL(5, 4),
  churn_probability DECIMAL(5, 4),

  -- Fraud signals
  fraud_risk_score DECIMAL(5, 4),
  fraud_probability DECIMAL(5, 4),

  -- Updated timestamp for feature freshness
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_user_features_updated ON public.ml_user_features(updated_at);
CREATE INDEX idx_ml_user_features_churn ON public.ml_user_features(churn_risk_score DESC) WHERE churn_risk_score > 0.5;
CREATE INDEX idx_ml_user_features_fraud ON public.ml_user_features(fraud_risk_score DESC) WHERE fraud_risk_score > 0.7;

-- =====================================================
-- ML PREDICTIONS LOG
-- =====================================================

CREATE TABLE public.ml_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('churn', 'fraud', 'recommendation')),

  -- Prediction output
  prediction JSONB NOT NULL,
  probability DECIMAL(5, 4),

  -- Metadata
  features_used JSONB,
  inference_time_ms INT,

  -- Action taken
  action_taken TEXT,
  action_taken_at TIMESTAMPTZ,

  -- Ground truth (for model evaluation)
  actual_outcome BOOLEAN,
  outcome_recorded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ml_predictions_user ON public.ml_predictions(user_id);
CREATE INDEX idx_ml_predictions_type ON public.ml_predictions(prediction_type);
CREATE INDEX idx_ml_predictions_model ON public.ml_predictions(model_name, model_version);
CREATE INDEX idx_ml_predictions_created ON public.ml_predictions(created_at DESC);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Transactions: users can only see their own
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Events: users can view their own events
CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

-- Service role bypass (for Edge Functions)
CREATE POLICY "Service role has full access to users" ON public.users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to transactions" ON public.transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to events" ON public.events
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Get user funnel position
CREATE OR REPLACE FUNCTION get_user_funnel_stage(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_stage TEXT;
BEGIN
  SELECT CASE
    WHEN EXISTS(
      SELECT 1 FROM public.transactions
      WHERE user_id = p_user_id AND status = 'completed'
      GROUP BY user_id HAVING COUNT(*) > 1
    ) THEN 'repeat_user'
    WHEN EXISTS(
      SELECT 1 FROM public.transactions
      WHERE user_id = p_user_id AND status = 'completed'
    ) THEN 'first_transaction'
    WHEN EXISTS(
      SELECT 1 FROM public.users
      WHERE id = p_user_id AND kyc_status = 'completed'
    ) THEN 'kyc_complete'
    WHEN EXISTS(
      SELECT 1 FROM public.users
      WHERE id = p_user_id AND kyc_status IN ('in_progress', 'failed')
    ) THEN 'kyc_started'
    ELSE 'signup'
  END INTO v_stage;

  RETURN v_stage;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active users view
CREATE VIEW public.v_active_users AS
SELECT
  u.id,
  u.email,
  u.created_at,
  u.kyc_status,
  COUNT(DISTINCT t.id) as transaction_count,
  SUM(t.amount) FILTER (WHERE t.status = 'completed') as total_volume,
  MAX(t.created_at) as last_transaction_at
FROM public.users u
LEFT JOIN public.transactions t ON u.id = t.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.created_at, u.kyc_status;

-- Daily metrics view
CREATE VIEW public.v_daily_metrics AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT id) as signups,
  COUNT(DISTINCT id) FILTER (WHERE kyc_status = 'completed') as kyc_completions,
  COUNT(DISTINCT CASE
    WHEN EXISTS(
      SELECT 1 FROM public.transactions t
      WHERE t.user_id = users.id AND t.status = 'completed'
    ) THEN id
  END) as activated_users
FROM public.users
WHERE deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON TABLE public.users IS 'Core user profiles with KYC and attribution data';
COMMENT ON TABLE public.transactions IS 'Transactional system of record - source of truth for financial data';
COMMENT ON TABLE public.events IS 'Immutable event log for analytics and attribution';
COMMENT ON TABLE public.sessions IS 'Session tracking for multi-touch attribution';
COMMENT ON TABLE public.experiments IS 'A/B test configuration and results';
COMMENT ON TABLE public.reconciliation_reports IS 'Data quality monitoring and reconciliation';
COMMENT ON TABLE public.ml_user_features IS 'Feature store - online features for real-time ML inference';
COMMENT ON TABLE public.ml_predictions IS 'ML prediction log for monitoring and evaluation';
