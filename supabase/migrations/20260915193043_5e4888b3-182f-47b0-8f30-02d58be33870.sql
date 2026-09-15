ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS filed_at timestamptz,
  ADD COLUMN IF NOT EXISTS process_number text,
  ADD COLUMN IF NOT EXISTS tribunal text,
  ADD COLUMN IF NOT EXISTS comarca text;

ALTER TABLE public.service_requests ALTER COLUMN case_description SET DEFAULT '';

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS show_in_kanban boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned ON public.service_requests (organization_id, assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_service_timeline_request ON public.service_timeline_events (service_request_id, occurred_at DESC);