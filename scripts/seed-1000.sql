-- Large-scale seed data for Juicyway Growth Platform
-- Generates 1,000 users with realistic journeys, transactions, and attribution data
-- Run this in Supabase SQL Editor

-- Clean existing data first
TRUNCATE public.experiment_assignments CASCADE;
TRUNCATE public.experiments CASCADE;
TRUNCATE public.reconciliation_reports CASCADE;
TRUNCATE public.ml_predictions CASCADE;
TRUNCATE public.ml_user_features CASCADE;
TRUNCATE public.events CASCADE;
TRUNCATE public.transactions CASCADE;
TRUNCATE public.sessions CASCADE;
TRUNCATE public.users CASCADE;

-- =====================================================
-- 1. INSERT 1,000 USERS
-- =====================================================
INSERT INTO public.users (
  email,
  first_name,
  last_name,
  phone,
  kyc_status,
  kyc_completed_at,
  signup_utm_source,
  signup_utm_medium,
  signup_utm_campaign,
  country_code,
  created_at
)
SELECT
  'user' || i || '@demo.juicyway.com',
  'User',
  'Demo' || i,
  '+234' || (7000000000 + i)::text,
  CASE
    WHEN i % 10 = 0 THEN 'not_started'
    WHEN i % 8 = 0 THEN 'in_progress'
    WHEN i % 15 = 0 THEN 'failed'
    ELSE 'completed'
  END,
  CASE
    WHEN i % 10 != 0 AND i % 15 != 0 THEN NOW() - (random() * INTERVAL '60 days')
    ELSE NULL
  END,
  CASE (i % 7)
    WHEN 0 THEN 'google'
    WHEN 1 THEN 'facebook'
    WHEN 2 THEN 'twitter'
    WHEN 3 THEN 'instagram'
    WHEN 4 THEN 'linkedin'
    WHEN 5 THEN 'referral'
    ELSE 'direct'
  END,
  CASE (i % 4)
    WHEN 0 THEN 'cpc'
    WHEN 1 THEN 'social'
    WHEN 2 THEN 'email'
    ELSE 'organic'
  END,
  CASE (i % 4)
    WHEN 0 THEN 'summer-promo'
    WHEN 1 THEN 'welcome-bonus'
    WHEN 2 THEN 'friend-referral'
    ELSE 'brand-awareness'
  END,
  CASE (i % 7)
    WHEN 0 THEN 'NG'
    WHEN 1 THEN 'GH'
    WHEN 2 THEN 'KE'
    WHEN 3 THEN 'ZA'
    WHEN 4 THEN 'UG'
    WHEN 5 THEN 'TZ'
    ELSE 'RW'
  END,
  NOW() - (random() * INTERVAL '90 days')
FROM generate_series(1, 1000) AS i;

-- =====================================================
-- 2. INSERT TRANSACTIONS (5 per completed user = ~3,500 total)
-- =====================================================
INSERT INTO public.transactions (
  user_id,
  type,
  status,
  amount,
  currency,
  fee,
  recipient_name,
  provider,
  reference,
  created_at,
  completed_at
)
SELECT
  u.id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'send'
    WHEN 1 THEN 'receive'
    WHEN 2 THEN 'deposit'
    WHEN 3 THEN 'withdrawal'
    ELSE 'conversion'
  END,
  CASE
    WHEN random() < 0.95 THEN 'completed'
    WHEN random() < 0.98 THEN 'pending'
    ELSE 'failed'
  END,
  (random() * 2000 + 10)::decimal(19,4),
  CASE (random() * 3)::int
    WHEN 0 THEN 'USD'
    WHEN 1 THEN 'EUR'
    ELSE 'GBP'
  END,
  (random() * 10 + 1)::decimal(19,4),
  'Recipient ' || (random() * 1000)::int,
  CASE (random() * 3)::int
    WHEN 0 THEN 'stripe'
    WHEN 1 THEN 'paystack'
    ELSE 'flutterwave'
  END,
  'TXN-' || md5(random()::text),
  u.created_at + (random() * INTERVAL '60 days'),
  u.created_at + (random() * INTERVAL '60 days')
FROM public.users u
CROSS JOIN generate_series(1, 5) AS s
WHERE u.kyc_status = 'completed';

-- =====================================================
-- 3. INSERT EVENTS (10 per user = 10,000 events)
-- =====================================================
INSERT INTO public.events (
  event_name,
  user_id,
  anonymous_id,
  session_id,
  properties,
  utm_source,
  utm_medium,
  utm_campaign,
  device_type,
  device_os,
  browser,
  country,
  server_timestamp
)
SELECT
  CASE (s % 10)
    WHEN 0 THEN 'page_view'
    WHEN 1 THEN 'app_opened'
    WHEN 2 THEN 'signup_started'
    WHEN 3 THEN 'signup_completed'
    WHEN 4 THEN 'kyc_started'
    WHEN 5 THEN 'kyc_completed'
    WHEN 6 THEN 'transaction_initiated'
    WHEN 7 THEN 'transaction_completed'
    WHEN 8 THEN 'button_clicked'
    ELSE 'feature_viewed'
  END,
  u.id,
  'anon_' || md5(u.id::text || s::text),
  'session_' || md5(u.id::text || (s / 3)::int::text),
  jsonb_build_object(
    'page', CASE (s % 5) WHEN 0 THEN 'home' WHEN 1 THEN 'pricing' WHEN 2 THEN 'features' ELSE 'dashboard' END,
    'button_color', CASE WHEN s % 2 = 0 THEN 'green' ELSE 'blue' END
  ),
  u.signup_utm_source,
  u.signup_utm_medium,
  u.signup_utm_campaign,
  CASE (s % 3)
    WHEN 0 THEN 'mobile'
    WHEN 1 THEN 'desktop'
    ELSE 'tablet'
  END,
  CASE (s % 4)
    WHEN 0 THEN 'iOS'
    WHEN 1 THEN 'Android'
    WHEN 2 THEN 'Windows'
    ELSE 'macOS'
  END,
  CASE (s % 3)
    WHEN 0 THEN 'Chrome'
    WHEN 1 THEN 'Safari'
    ELSE 'Firefox'
  END,
  u.country_code,
  u.created_at + (s * INTERVAL '6 hours')
FROM public.users u
CROSS JOIN generate_series(1, 10) AS s;

-- =====================================================
-- 4. INSERT 3 EXPERIMENTS
-- =====================================================
INSERT INTO public.experiments (
  name,
  description,
  status,
  variants,
  allocation_percent,
  primary_metric,
  secondary_metrics,
  start_date,
  minimum_sample_size,
  hypothesis
)
VALUES
  (
    'button_color_test',
    'Test green vs blue CTA button on signup page',
    'running',
    '[
      {"name": "control", "weight": 0.5, "description": "Green button (current)"},
      {"name": "treatment", "weight": 0.5, "description": "Blue button (new)"}
    ]'::jsonb,
    100,
    'signup_conversion_rate',
    ARRAY['click_through_rate', 'time_to_signup'],
    NOW() - INTERVAL '15 days',
    500,
    'Blue button will increase signup conversion by 10%'
  ),
  (
    'onboarding_flow_test',
    'Test single-step vs multi-step onboarding',
    'running',
    '[
      {"name": "control", "weight": 0.5, "description": "Single-step onboarding (current)"},
      {"name": "treatment", "weight": 0.5, "description": "Multi-step onboarding (new)"}
    ]'::jsonb,
    100,
    'kyc_completion_rate',
    ARRAY['time_to_complete', 'drop_off_rate'],
    NOW() - INTERVAL '10 days',
    400,
    'Multi-step onboarding will improve completion rate by 15%'
  ),
  (
    'transaction_fee_messaging',
    'Test transparent vs hidden fee display',
    'completed',
    '[
      {"name": "control", "weight": 0.5, "description": "Show fees at checkout"},
      {"name": "treatment", "weight": 0.5, "description": "Show fees upfront"}
    ]'::jsonb,
    100,
    'transaction_completion_rate',
    ARRAY['user_satisfaction', 'repeat_rate'],
    NOW() - INTERVAL '30 days',
    600,
    'Upfront fee display will increase trust and completion rate'
  );

-- =====================================================
-- 5. ASSIGN USERS TO EXPERIMENTS
-- =====================================================
INSERT INTO public.experiment_assignments (
  experiment_id,
  user_id,
  variant,
  assignment_hash,
  assigned_at
)
SELECT
  e.id,
  u.id,
  CASE
    WHEN ROW_NUMBER() OVER (PARTITION BY e.id ORDER BY u.created_at) % 2 = 0
    THEN 'control'
    ELSE 'treatment'
  END,
  md5(u.id::text || e.id::text),
  GREATEST(u.created_at, e.start_date)
FROM public.users u
CROSS JOIN public.experiments e
WHERE u.created_at >= e.start_date - INTERVAL '5 days';

-- =====================================================
-- 6. INSERT RECONCILIATION REPORTS (Last 30 days)
-- =====================================================
INSERT INTO public.reconciliation_reports (
  report_date,
  entity_type,
  source_count,
  target_count,
  discrepancy_count,
  discrepancy_percentage,
  status,
  sample_discrepancies,
  created_at
)
SELECT
  CURRENT_DATE - i,
  entity_type,
  CASE
    WHEN entity_type = 'users' THEN (SELECT COUNT(*) FROM public.users WHERE created_at::date <= CURRENT_DATE - i)
    WHEN entity_type = 'transactions' THEN (SELECT COUNT(*) FROM public.transactions WHERE created_at::date <= CURRENT_DATE - i)
    ELSE (SELECT COUNT(*) FROM public.events WHERE server_timestamp::date <= CURRENT_DATE - i)
  END,
  CASE
    WHEN entity_type = 'users' THEN (SELECT COUNT(*) FROM public.users WHERE created_at::date <= CURRENT_DATE - i)
    WHEN entity_type = 'transactions' THEN (SELECT COUNT(*) FROM public.transactions WHERE created_at::date <= CURRENT_DATE - i)
    ELSE (SELECT COUNT(*) FROM public.events WHERE server_timestamp::date <= CURRENT_DATE - i)
  END + (random() * 3 - 1)::int,
  CASE
    WHEN random() < 0.95 THEN 0
    ELSE (random() * 5)::int
  END,
  CASE
    WHEN random() < 0.95 THEN 0.0
    ELSE (random() * 0.5)::decimal(5,2)
  END,
  CASE
    WHEN random() < 0.95 THEN 'healthy'
    WHEN random() < 0.98 THEN 'warning'
    ELSE 'critical'
  END,
  CASE
    WHEN random() < 0.95 THEN '{"message": "All records reconciled successfully"}'::jsonb
    ELSE '{"message": "Minor discrepancies detected", "affected_records": []}'::jsonb
  END,
  (CURRENT_DATE - i)::timestamp + INTERVAL '9 hours'
FROM generate_series(0, 29) AS i
CROSS JOIN (VALUES ('users'), ('transactions'), ('events')) AS t(entity_type);

-- =====================================================
-- 7. INSERT ML USER FEATURES (for completed users)
-- =====================================================
INSERT INTO public.ml_user_features (
  user_id,
  transaction_count_7d,
  transaction_count_30d,
  transaction_count_90d,
  total_volume_7d,
  total_volume_30d,
  avg_transaction_value_30d,
  days_since_last_transaction,
  app_open_count_7d,
  app_open_count_30d,
  session_count_7d,
  days_since_last_app_open,
  kyc_completion_time_minutes,
  updated_at
)
SELECT
  u.id,
  (random() * 5)::int + 1,
  (random() * 15)::int + 5,
  (random() * 30)::int + 10,
  (random() * 5000 + 500)::decimal(19,4),
  (random() * 10000 + 1000)::decimal(19,4),
  (random() * 500 + 50)::decimal(19,4),
  (random() * 7)::int,
  (random() * 10)::int + 2,
  (random() * 30)::int + 10,
  (random() * 5)::int + 1,
  (random() * 3)::int,
  (random() * 20 + 5)::int,
  NOW()
FROM public.users u
WHERE u.kyc_status = 'completed';

-- =====================================================
-- SUCCESS SUMMARY
-- =====================================================
SELECT
  'Seed data generation completed!' AS message,
  (SELECT COUNT(*) FROM public.users) AS users_created,
  (SELECT COUNT(*) FROM public.transactions) AS transactions_created,
  (SELECT COUNT(*) FROM public.events) AS events_created,
  (SELECT COUNT(*) FROM public.experiments) AS experiments_created,
  (SELECT COUNT(*) FROM public.experiment_assignments) AS experiment_assignments,
  (SELECT COUNT(*) FROM public.reconciliation_reports) AS reconciliation_reports,
  (SELECT COUNT(*) FROM public.ml_user_features) AS ml_features_created;

-- Verification queries
SELECT 'User distribution by KYC status:' AS check_type;
SELECT kyc_status, COUNT(*) as count FROM public.users GROUP BY kyc_status ORDER BY count DESC;

SELECT 'Transaction distribution by status:' AS check_type;
SELECT status, COUNT(*) as count FROM public.transactions GROUP BY status ORDER BY count DESC;

SELECT 'Top 5 UTM sources:' AS check_type;
SELECT signup_utm_source, COUNT(*) as count FROM public.users GROUP BY signup_utm_source ORDER BY count DESC LIMIT 5;

SELECT 'Experiment status:' AS check_type;
SELECT name, status, (SELECT COUNT(*) FROM public.experiment_assignments WHERE experiment_id = e.id) as assignments
FROM public.experiments e;
