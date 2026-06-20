-- Simple seed data for Juicyway Growth Platform
-- Run this in Supabase SQL Editor

-- Insert 10 demo users
INSERT INTO public.users (email, kyc_status, signup_utm_source, signup_utm_medium, signup_utm_campaign, country_code, created_at)
VALUES
  ('user1@demo.com', 'completed', 'google', 'cpc', 'summer-promo', 'NG', NOW() - INTERVAL '30 days'),
  ('user2@demo.com', 'completed', 'facebook', 'social', 'brand-awareness', 'GH', NOW() - INTERVAL '25 days'),
  ('user3@demo.com', 'in_progress', 'twitter', 'social', 'welcome-bonus', 'KE', NOW() - INTERVAL '20 days'),
  ('user4@demo.com', 'completed', 'google', 'cpc', 'friend-referral', 'ZA', NOW() - INTERVAL '15 days'),
  ('user5@demo.com', 'completed', 'linkedin', 'social', 'summer-promo', 'UG', NOW() - INTERVAL '10 days'),
  ('user6@demo.com', 'not_started', 'direct', 'organic', NULL, 'TZ', NOW() - INTERVAL '5 days'),
  ('user7@demo.com', 'completed', 'instagram', 'social', 'brand-awareness', 'RW', NOW() - INTERVAL '4 days'),
  ('user8@demo.com', 'completed', 'google', 'organic', NULL, 'NG', NOW() - INTERVAL '3 days'),
  ('user9@demo.com', 'failed', 'facebook', 'cpc', 'welcome-bonus', 'GH', NOW() - INTERVAL '2 days'),
  ('user10@demo.com', 'completed', 'referral', 'referral', 'friend-referral', 'KE', NOW() - INTERVAL '1 day');

-- Insert transactions for completed users
WITH user_ids AS (
  SELECT id FROM public.users WHERE kyc_status = 'completed' LIMIT 7
)
INSERT INTO public.transactions (user_id, type, status, amount, currency_code, created_at, completed_at)
SELECT
  id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'send'
    WHEN 1 THEN 'receive'
    WHEN 2 THEN 'deposit'
    WHEN 3 THEN 'withdrawal'
    ELSE 'conversion'
  END,
  'completed',
  (random() * 1000 + 50)::decimal(19,4),
  'USD',
  NOW() - (random() * INTERVAL '20 days'),
  NOW() - (random() * INTERVAL '20 days')
FROM user_ids, generate_series(1, 5);

-- Insert events for user journeys
WITH user_data AS (
  SELECT id, created_at FROM public.users
)
INSERT INTO public.events (event_name, user_id, session_id, properties, utm_source, utm_medium, server_timestamp)
SELECT
  'signup_completed',
  id,
  gen_random_uuid()::text,
  '{}'::jsonb,
  CASE (random() * 4)::int
    WHEN 0 THEN 'google'
    WHEN 1 THEN 'facebook'
    WHEN 2 THEN 'twitter'
    ELSE 'direct'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'cpc'
    WHEN 1 THEN 'social'
    ELSE 'organic'
  END,
  created_at
FROM user_data;

-- Insert 2 experiments
INSERT INTO public.experiments (name, description, status, variants, allocation_percent, primary_metric, start_date, minimum_sample_size)
VALUES
  (
    'button_color_test',
    'Test green vs blue CTA button',
    'running',
    '[
      {"name": "control", "weight": 0.5, "description": "Green button"},
      {"name": "treatment", "weight": 0.5, "description": "Blue button"}
    ]'::jsonb,
    100,
    'conversion_rate',
    NOW() - INTERVAL '15 days',
    200
  ),
  (
    'onboarding_flow_test',
    'Test single-step vs multi-step onboarding',
    'running',
    '[
      {"name": "control", "weight": 0.5, "description": "Single-step onboarding"},
      {"name": "treatment", "weight": 0.5, "description": "Multi-step onboarding"}
    ]'::jsonb,
    100,
    'completion_rate',
    NOW() - INTERVAL '10 days',
    300
  );

-- Assign users to experiments
WITH exp_button AS (
  SELECT id FROM public.experiments WHERE name = 'button_color_test' LIMIT 1
),
exp_onboarding AS (
  SELECT id FROM public.experiments WHERE name = 'onboarding_flow_test' LIMIT 1
),
users_sample AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM public.users LIMIT 10
)
INSERT INTO public.experiment_assignments (experiment_id, user_id, variant, assignment_hash, assigned_at)
SELECT
  exp_button.id,
  users_sample.id,
  CASE WHEN MOD(rn, 2) = 0 THEN 'control' ELSE 'treatment' END,
  md5(users_sample.id::text || exp_button.id::text),
  NOW() - INTERVAL '10 days'
FROM users_sample, exp_button
UNION ALL
SELECT
  exp_onboarding.id,
  users_sample.id,
  CASE WHEN MOD(rn, 2) = 0 THEN 'treatment' ELSE 'control' END,
  md5(users_sample.id::text || exp_onboarding.id::text),
  NOW() - INTERVAL '5 days'
FROM users_sample, exp_onboarding;

-- Insert a reconciliation report (healthy status)
INSERT INTO public.reconciliation_reports (report_date, entity_type, source_count, target_count, discrepancy_count, status, created_at)
VALUES
  (CURRENT_DATE, 'transactions', 35, 35, 0, 'healthy', NOW()),
  (CURRENT_DATE - 1, 'events', 10, 10, 0, 'healthy', NOW() - INTERVAL '1 day'),
  (CURRENT_DATE - 2, 'users', 10, 10, 0, 'healthy', NOW() - INTERVAL '2 days');

-- Success message
SELECT
  (SELECT COUNT(*) FROM public.users) as users_created,
  (SELECT COUNT(*) FROM public.transactions) as transactions_created,
  (SELECT COUNT(*) FROM public.events) as events_created,
  (SELECT COUNT(*) FROM public.experiments) as experiments_created,
  (SELECT COUNT(*) FROM public.experiment_assignments) as assignments_created,
  (SELECT COUNT(*) FROM public.reconciliation_reports) as reconciliation_reports_created;
