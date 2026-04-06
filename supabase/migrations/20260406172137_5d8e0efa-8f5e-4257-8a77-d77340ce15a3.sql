
-- Add approval flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Mark all existing profiles as approved
UPDATE public.profiles SET is_approved = true;

-- Create saas_admins table to identify platform administrators
CREATE TABLE public.saas_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS on saas_admins - only service role can manage
ALTER TABLE public.saas_admins ENABLE ROW LEVEL SECURITY;

-- No public policies - only accessible via service role key (edge functions)
