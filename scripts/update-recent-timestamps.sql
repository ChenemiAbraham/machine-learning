-- Update some records to have very recent timestamps
-- This ensures the dashboard shows data even if it filters by recent dates

-- Update 100 users to have been created in the last 7 days
UPDATE public.users
SET created_at = NOW() - (random() * INTERVAL '6 days')
WHERE id IN (
  SELECT id FROM public.users ORDER BY created_at DESC LIMIT 100
);

-- Update their transactions to be recent too
UPDATE public.transactions
SET
  created_at = NOW() - (random() * INTERVAL '5 days'),
  completed_at = NOW() - (random() * INTERVAL '5 days')
WHERE user_id IN (
  SELECT id FROM public.users ORDER BY created_at DESC LIMIT 100
)
AND status = 'completed';

-- Update events to be recent
UPDATE public.events
SET server_timestamp = NOW() - (random() * INTERVAL '6 days')
WHERE user_id IN (
  SELECT id FROM public.users ORDER BY created_at DESC LIMIT 100
);

-- Update experiment assignments to be recent
UPDATE public.experiment_assignments
SET assigned_at = NOW() - (random() * INTERVAL '10 days')
WHERE user_id IN (
  SELECT id FROM public.users ORDER BY created_at DESC LIMIT 200
);

-- Verify updates
SELECT
  'Recent data summary:' AS status,
  (SELECT COUNT(*) FROM public.users WHERE created_at > NOW() - INTERVAL '7 days') AS users_last_7d,
  (SELECT COUNT(*) FROM public.transactions WHERE created_at > NOW() - INTERVAL '7 days') AS transactions_last_7d,
  (SELECT COUNT(*) FROM public.events WHERE server_timestamp > NOW() - INTERVAL '7 days') AS events_last_7d;
