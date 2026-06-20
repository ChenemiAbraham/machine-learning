-- Aggressively update timestamps to populate "last 7 days" metrics
-- This will make the dashboard show real data

-- Update 500 users (50%) to have been created in the last 7 days
UPDATE public.users
SET created_at = NOW() - (random() * INTERVAL '6 days')
WHERE id IN (
  SELECT id FROM public.users ORDER BY random() LIMIT 500
);

-- Update ALL completed transactions for those recent users to be in last 7 days
UPDATE public.transactions
SET
  created_at = NOW() - (random() * INTERVAL '6 days'),
  completed_at = NOW() - (random() * INTERVAL '6 days'),
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM public.users WHERE created_at > NOW() - INTERVAL '7 days'
)
AND status = 'completed';

-- Update ALL events for recent users to be in last 7 days
UPDATE public.events
SET server_timestamp = NOW() - (random() * INTERVAL '6 days')
WHERE user_id IN (
  SELECT id FROM public.users WHERE created_at > NOW() - INTERVAL '7 days'
);

-- Verify the changes
SELECT
  'Dashboard metrics (last 7 days):' AS status,
  (SELECT COUNT(*) FROM public.users WHERE created_at > NOW() - INTERVAL '7 days') AS users_last_7d,
  (SELECT COUNT(*) FROM public.transactions WHERE status = 'completed' AND created_at > NOW() - INTERVAL '7 days') AS transactions_last_7d,
  (SELECT ROUND(SUM(amount)::numeric, 2) FROM public.transactions WHERE status = 'completed' AND created_at > NOW() - INTERVAL '7 days') AS volume_last_7d,
  (SELECT COUNT(*) FROM public.events WHERE server_timestamp > NOW() - INTERVAL '7 days') AS events_last_7d;
