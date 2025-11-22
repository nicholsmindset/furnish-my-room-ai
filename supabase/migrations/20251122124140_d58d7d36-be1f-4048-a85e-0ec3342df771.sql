-- Create function to get all users with their details for admin
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  subscription_tier text,
  is_active boolean,
  subscription_end timestamptz,
  stripe_product_id text,
  credits_remaining integer,
  credits_used integer,
  design_count bigint,
  user_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    p.created_at,
    COALESCE(us.subscription_tier::text, 'free') as subscription_tier,
    COALESCE(us.is_active, false) as is_active,
    us.subscription_end,
    us.stripe_product_id,
    COALESCE(uc.credits_remaining, 0) as credits_remaining,
    COALESCE(uc.credits_used, 0) as credits_used,
    COALESCE(COUNT(dg.id), 0)::bigint as design_count,
    COALESCE(ur.role::text, 'free') as user_role
  FROM public.profiles p
  LEFT JOIN public.user_subscriptions us ON us.user_id = p.id
  LEFT JOIN public.user_credits uc ON uc.user_id = p.id
  LEFT JOIN public.design_generations dg ON dg.user_id = p.id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  GROUP BY p.id, p.email, p.full_name, p.created_at, us.subscription_tier, 
           us.is_active, us.subscription_end, us.stripe_product_id, 
           uc.credits_remaining, uc.credits_used, ur.role
  ORDER BY p.created_at DESC;
END;
$$;

-- Create function to update user subscription
CREATE OR REPLACE FUNCTION public.admin_update_user_subscription(
  _user_id uuid,
  _subscription_tier app_role,
  _is_active boolean,
  _stripe_product_id text,
  _subscription_end timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update or insert subscription
  INSERT INTO public.user_subscriptions (user_id, subscription_tier, is_active, stripe_product_id, subscription_end)
  VALUES (_user_id, _subscription_tier, _is_active, _stripe_product_id, _subscription_end)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscription_tier = _subscription_tier,
    is_active = _is_active,
    stripe_product_id = COALESCE(_stripe_product_id, user_subscriptions.stripe_product_id),
    subscription_end = _subscription_end,
    updated_at = now();

  RETURN true;
END;
$$;

-- Create function to update user role
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  _user_id uuid,
  _new_role app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update user role
  UPDATE public.user_roles
  SET role = _new_role
  WHERE user_id = _user_id;

  -- If no row was updated, insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _new_role);
  END IF;

  RETURN true;
END;
$$;

-- Create function to update user credits
CREATE OR REPLACE FUNCTION public.admin_update_user_credits(
  _user_id uuid,
  _credits_remaining integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update user credits
  UPDATE public.user_credits
  SET credits_remaining = _credits_remaining,
      updated_at = now()
  WHERE user_id = _user_id;

  RETURN true;
END;
$$;