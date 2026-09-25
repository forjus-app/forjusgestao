ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS kanban_order integer;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY organization_id, assigned_member_id ORDER BY created_at) AS rn
  FROM public.service_requests
)
UPDATE public.service_requests s SET kanban_order = r.rn FROM ranked r WHERE s.id = r.id AND s.kanban_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_kanban_order ON public.service_requests (organization_id, assigned_member_id, kanban_order);