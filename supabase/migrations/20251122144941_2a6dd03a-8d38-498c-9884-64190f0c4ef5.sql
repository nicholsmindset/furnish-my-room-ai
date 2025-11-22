-- Enable Row Level Security on admin_analytics view
-- Note: admin_analytics is a view, so we need to secure the underlying tables instead
-- The view queries: profiles, user_subscriptions, user_credits, design_generations, usage_logs

-- Secure admin_analytics access by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE (
  total_users bigint,
  active_subscriptions bigint,
  pro_subscribers bigint,
  business_subscribers bigint,
  total_designs bigint,
  designs_last_30_days bigint,
  designs_last_7_days bigint,
  new_users_30_days bigint,
  new_users_7_days bigint,
  total_credits_used bigint,
  avg_credits_per_user numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT * FROM admin_analytics;
END;
$$;