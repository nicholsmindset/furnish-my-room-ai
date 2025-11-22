-- Add admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- Create a view for admin analytics
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.user_subscriptions WHERE is_active = true) as active_subscriptions,
  (SELECT COUNT(*) FROM public.user_subscriptions WHERE is_active = true AND subscription_tier = 'pro') as pro_subscribers,
  (SELECT COUNT(*) FROM public.user_subscriptions WHERE is_active = true AND subscription_tier = 'business') as business_subscribers,
  (SELECT COUNT(*) FROM public.design_generations) as total_designs,
  (SELECT COUNT(*) FROM public.design_generations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as designs_last_30_days,
  (SELECT COUNT(*) FROM public.design_generations WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as designs_last_7_days,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30_days,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_7_days,
  (SELECT SUM(credits_used) FROM public.user_credits) as total_credits_used,
  (SELECT AVG(credits_used)::int FROM public.user_credits WHERE credits_used > 0) as avg_credits_per_user;

-- Create RLS policy for admin analytics view
ALTER VIEW public.admin_analytics SET (security_invoker = on);

-- Grant select on admin analytics to authenticated users (will be protected by RLS)
GRANT SELECT ON public.admin_analytics TO authenticated;

-- Create a function to get user growth data
CREATE OR REPLACE FUNCTION public.get_user_growth_data()
RETURNS TABLE (
  date date,
  new_users bigint,
  total_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT CURRENT_DATE - INTERVAL '30 days' AS date
    UNION ALL
    SELECT date + INTERVAL '1 day'
    FROM date_series
    WHERE date < CURRENT_DATE
  ),
  daily_signups AS (
    SELECT 
      DATE(created_at) as signup_date,
      COUNT(*) as count
    FROM auth.users
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
  )
  SELECT 
    ds.date::date,
    COALESCE(daily_signups.count, 0)::bigint as new_users,
    (SELECT COUNT(*)::bigint FROM auth.users WHERE DATE(created_at) <= ds.date) as total_users
  FROM date_series ds
  LEFT JOIN daily_signups ON ds.date = daily_signups.signup_date
  ORDER BY ds.date;
END;
$$;

-- Create a function to get design generation stats
CREATE OR REPLACE FUNCTION public.get_design_generation_stats()
RETURNS TABLE (
  date date,
  designs_generated bigint,
  unique_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT CURRENT_DATE - INTERVAL '30 days' AS date
    UNION ALL
    SELECT date + INTERVAL '1 day'
    FROM date_series
    WHERE date < CURRENT_DATE
  )
  SELECT 
    ds.date::date,
    COALESCE(COUNT(dg.id), 0)::bigint as designs_generated,
    COALESCE(COUNT(DISTINCT dg.user_id), 0)::bigint as unique_users
  FROM date_series ds
  LEFT JOIN public.design_generations dg ON DATE(dg.created_at) = ds.date
  GROUP BY ds.date
  ORDER BY ds.date;
END;
$$;

-- Create a function to get subscription revenue metrics
CREATE OR REPLACE FUNCTION public.get_subscription_metrics()
RETURNS TABLE (
  tier text,
  active_count bigint,
  monthly_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    us.subscription_tier::text,
    COUNT(*)::bigint as active_count,
    CASE 
      WHEN us.subscription_tier = 'pro' THEN COUNT(*) * 29
      WHEN us.subscription_tier = 'business' THEN COUNT(*) * 99
      ELSE 0
    END::numeric as monthly_revenue
  FROM public.user_subscriptions us
  WHERE us.is_active = true
  GROUP BY us.subscription_tier;
END;
$$;

-- Create a function to get top users by designs
CREATE OR REPLACE FUNCTION public.get_top_users_by_designs(limit_count int DEFAULT 10)
RETURNS TABLE (
  user_email text,
  design_count bigint,
  subscription_tier text,
  credits_used int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.email,
    COUNT(dg.id)::bigint as design_count,
    COALESCE(us.subscription_tier::text, 'free') as subscription_tier,
    COALESCE(uc.credits_used, 0) as credits_used
  FROM public.profiles p
  LEFT JOIN public.design_generations dg ON dg.user_id = p.id
  LEFT JOIN public.user_subscriptions us ON us.user_id = p.id AND us.is_active = true
  LEFT JOIN public.user_credits uc ON uc.user_id = p.id
  GROUP BY p.id, p.email, us.subscription_tier, uc.credits_used
  ORDER BY design_count DESC
  LIMIT limit_count;
END;
$$;