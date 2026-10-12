CREATE TABLE public.tiktok_oauth_attempts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.tiktok_oauth_attempts TO service_role;
ALTER TABLE public.tiktok_oauth_attempts ENABLE ROW LEVEL SECURITY;