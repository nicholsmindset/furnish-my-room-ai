-- Fix overly permissive RLS policies on design_generations
-- Previously: Anyone could view/create any generation
-- Now: Users can only access their own generations

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view design generations" ON public.design_generations;
DROP POLICY IF EXISTS "Anyone can create design generations" ON public.design_generations;

-- Create proper user-scoped policies

-- Users can view their own generations
CREATE POLICY "Users can view own design generations"
ON public.design_generations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create generations for themselves
CREATE POLICY "Users can create own design generations"
ON public.design_generations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own generations
CREATE POLICY "Users can update own design generations"
ON public.design_generations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own generations
CREATE POLICY "Users can delete own design generations"
ON public.design_generations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all generations (for admin dashboard)
CREATE POLICY "Admins can view all design generations"
ON public.design_generations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public shared designs policy (for gallery viewing)
-- Only allow viewing generations that have a public share link
CREATE POLICY "Public can view shared design generations"
ON public.design_generations
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shared_designs sd
    WHERE sd.generation_id = id
    AND sd.is_public = true
    AND (sd.expires_at IS NULL OR sd.expires_at > now())
  )
);
