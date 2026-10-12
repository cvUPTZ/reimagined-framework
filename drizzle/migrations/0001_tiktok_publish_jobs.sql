CREATE TABLE public.tiktok_publish_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 project_name text NOT NULL,
 publish_id text UNIQUE,
 upload_url_ciphertext text,
 video_size bigint NOT NULL,
 chunk_size integer NOT NULL,
 chunk_count integer NOT NULL,
 uploaded_bytes bigint NOT NULL DEFAULT 0,
 status text NOT NULL DEFAULT 'INITIALIZING',
 fail_reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tiktok_publish_jobs TO service_role;
ALTER TABLE public.tiktok_publish_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX tiktok_publish_jobs_user_idx ON public.tiktok_publish_jobs (user_id, created_at DESC);