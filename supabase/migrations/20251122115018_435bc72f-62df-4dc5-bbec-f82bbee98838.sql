-- Create table for design generation history
CREATE TABLE IF NOT EXISTS public.design_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- nullable for now, will be required once auth is added
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  style TEXT NOT NULL,
  room_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.design_generations ENABLE ROW LEVEL SECURITY;

-- Create policies - permissive for now since no auth yet
-- Anyone can view all generations
CREATE POLICY "Anyone can view design generations" 
ON public.design_generations 
FOR SELECT 
USING (true);

-- Anyone can insert generations
CREATE POLICY "Anyone can create design generations" 
ON public.design_generations 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_design_generations_created_at ON public.design_generations(created_at DESC);
CREATE INDEX idx_design_generations_user_id ON public.design_generations(user_id) WHERE user_id IS NOT NULL;