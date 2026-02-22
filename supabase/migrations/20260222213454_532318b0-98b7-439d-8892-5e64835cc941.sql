
-- Tabela principal de petições/serviços
CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  service_type text NOT NULL DEFAULT 'peticao_inicial',
  assigned_member_id uuid NOT NULL REFERENCES public.team_members(id),
  client_contact_id uuid REFERENCES public.contacts(id),
  related_contact_id uuid REFERENCES public.contacts(id),
  case_id uuid REFERENCES public.cases(id),
  case_description text NOT NULL,
  facts text,
  requests text,
  evidence_list text,
  priority integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'new',
  drive_link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sr_select" ON public.service_requests FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY "sr_insert" ON public.service_requests FOR INSERT WITH CHECK (organization_id = current_org_id());
CREATE POLICY "sr_update" ON public.service_requests FOR UPDATE USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());
CREATE POLICY "sr_delete" ON public.service_requests FOR DELETE USING (organization_id = current_org_id());

CREATE TRIGGER set_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tabela de timeline
CREATE TABLE public.service_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  service_request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ste_select" ON public.service_timeline_events FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY "ste_insert" ON public.service_timeline_events FOR INSERT WITH CHECK (organization_id = current_org_id());
CREATE POLICY "ste_update" ON public.service_timeline_events FOR UPDATE USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());
CREATE POLICY "ste_delete" ON public.service_timeline_events FOR DELETE USING (organization_id = current_org_id());
