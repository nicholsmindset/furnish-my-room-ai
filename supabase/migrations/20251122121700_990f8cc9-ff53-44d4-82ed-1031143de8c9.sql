-- Create credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  credits_remaining INTEGER NOT NULL DEFAULT 3,
  credits_used INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Credits policies
CREATE POLICY "Users can view their own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
ON public.user_credits FOR UPDATE
USING (auth.uid() = user_id);

-- Create usage log table
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('generate', 'download', 'share', 'batch')),
  credits_cost INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Usage logs policies
CREATE POLICY "Users can view their own usage logs"
ON public.usage_logs FOR SELECT
USING (auth.uid() = user_id);

-- Create shared designs table for public gallery
CREATE TABLE public.shared_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES public.design_generations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.shared_designs ENABLE ROW LEVEL SECURITY;

-- Shared designs policies - public can view active shared designs
CREATE POLICY "Anyone can view public shared designs"
ON public.shared_designs FOR SELECT
USING (is_public = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Users can create their own shared designs"
ON public.shared_designs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared designs"
ON public.shared_designs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared designs"
ON public.shared_designs FOR DELETE
USING (auth.uid() = user_id);

-- Create subscription tracking table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_product_id TEXT NOT NULL,
  subscription_tier app_role NOT NULL DEFAULT 'free',
  subscription_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Function to initialize user credits
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_remaining, credits_used)
  VALUES (NEW.id, 3, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger for initializing credits on user creation
CREATE TRIGGER on_user_created_initialize_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_credits();

-- Function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(_user_id UUID, _credits_cost INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits_remaining INTO _current_credits
  FROM public.user_credits
  WHERE user_id = _user_id;

  -- Check if user has enough credits
  IF _current_credits IS NULL OR _current_credits < _credits_cost THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE public.user_credits
  SET 
    credits_remaining = credits_remaining - _credits_cost,
    credits_used = credits_used + _credits_cost,
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN TRUE;
END;
$$;

-- Function to reset monthly credits based on tier
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset credits for users based on their subscription tier
  UPDATE public.user_credits uc
  SET 
    credits_remaining = CASE
      WHEN us.subscription_tier = 'free' THEN 3
      WHEN us.subscription_tier = 'pro' THEN 50
      WHEN us.subscription_tier = 'business' THEN 999999
      ELSE 3
    END,
    credits_used = 0,
    last_reset_at = now(),
    updated_at = now()
  FROM public.user_subscriptions us
  WHERE uc.user_id = us.user_id
    AND uc.last_reset_at < (now() - interval '30 days');

  -- Reset for users without subscriptions
  UPDATE public.user_credits
  SET 
    credits_remaining = 3,
    credits_used = 0,
    last_reset_at = now(),
    updated_at = now()
  WHERE user_id NOT IN (SELECT user_id FROM public.user_subscriptions)
    AND last_reset_at < (now() - interval '30 days');
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_shared_designs_token ON public.shared_designs(share_token);
CREATE INDEX idx_shared_designs_user_id ON public.shared_designs(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();