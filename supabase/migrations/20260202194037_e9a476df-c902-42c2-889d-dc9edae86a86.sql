
-- Tabela de advogados parceiros
CREATE TABLE public.partner_lawyers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  oab TEXT,
  email TEXT,
  whatsapp TEXT,
  office_name TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tipos de casos externos
CREATE TABLE public.external_case_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de status de casos externos
CREATE TABLE public.external_case_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de casos externos
CREATE TABLE public.external_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
  type_id UUID NOT NULL REFERENCES public.external_case_types(id) ON DELETE RESTRICT,
  status_id UUID REFERENCES public.external_case_statuses(id) ON DELETE SET NULL,
  partner_lawyer_id UUID NOT NULL REFERENCES public.partner_lawyers(id) ON DELETE RESTRICT,
  authority_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  process_number TEXT,
  protocol_number TEXT,
  has_official_number BOOLEAN NOT NULL DEFAULT false,
  portal_link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de timeline de casos externos
CREATE TABLE public.external_case_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_case_id UUID NOT NULL REFERENCES public.external_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- note, update, document, status_change
  title TEXT,
  description TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de links de documentos para casos externos
CREATE TABLE public.external_case_document_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_case_id UUID NOT NULL REFERENCES public.external_cases(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Triggers para updated_at
CREATE TRIGGER update_partner_lawyers_updated_at
  BEFORE UPDATE ON public.partner_lawyers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_external_cases_updated_at
  BEFORE UPDATE ON public.external_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS para partner_lawyers
ALTER TABLE public.partner_lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_lawyers_select" ON public.partner_lawyers
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "partner_lawyers_insert" ON public.partner_lawyers
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "partner_lawyers_update" ON public.partner_lawyers
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "partner_lawyers_delete" ON public.partner_lawyers
  FOR DELETE USING (organization_id = current_org_id());

-- RLS para external_case_types
ALTER TABLE public.external_case_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_case_types_select" ON public.external_case_types
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "external_case_types_insert" ON public.external_case_types
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_types_update" ON public.external_case_types
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_types_delete" ON public.external_case_types
  FOR DELETE USING (organization_id = current_org_id());

-- RLS para external_case_statuses
ALTER TABLE public.external_case_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_case_statuses_select" ON public.external_case_statuses
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "external_case_statuses_insert" ON public.external_case_statuses
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_statuses_update" ON public.external_case_statuses
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_statuses_delete" ON public.external_case_statuses
  FOR DELETE USING (organization_id = current_org_id());

-- RLS para external_cases
ALTER TABLE public.external_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_cases_select" ON public.external_cases
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "external_cases_insert" ON public.external_cases
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_cases_update" ON public.external_cases
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_cases_delete" ON public.external_cases
  FOR DELETE USING (organization_id = current_org_id());

-- RLS para external_case_timeline_events
ALTER TABLE public.external_case_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_case_timeline_select" ON public.external_case_timeline_events
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "external_case_timeline_insert" ON public.external_case_timeline_events
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_timeline_update" ON public.external_case_timeline_events
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_timeline_delete" ON public.external_case_timeline_events
  FOR DELETE USING (organization_id = current_org_id());

-- RLS para external_case_document_links
ALTER TABLE public.external_case_document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_case_doc_links_select" ON public.external_case_document_links
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "external_case_doc_links_insert" ON public.external_case_document_links
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_doc_links_update" ON public.external_case_document_links
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "external_case_doc_links_delete" ON public.external_case_document_links
  FOR DELETE USING (organization_id = current_org_id());

-- Função para seed de taxonomia de casos externos
CREATE OR REPLACE FUNCTION public.seed_external_case_taxonomy(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Status padrão
  INSERT INTO external_case_statuses (organization_id, name, color, sort_order, is_default)
  VALUES
    (org_id, 'Aberto', '#3b82f6', 1, true),
    (org_id, 'Em andamento', '#22c55e', 2, false),
    (org_id, 'Aguardando', '#eab308', 3, false),
    (org_id, 'Concluído', '#6b7280', 4, false),
    (org_id, 'Arquivado', '#64748b', 5, false)
  ON CONFLICT DO NOTHING;

  -- Tipos padrão
  INSERT INTO external_case_types (organization_id, name, sort_order)
  VALUES
    (org_id, 'INSS - Benefício', 1),
    (org_id, 'INSS - Revisão', 2),
    (org_id, 'DETRAN', 3),
    (org_id, 'Prefeitura', 4),
    (org_id, 'Cartório', 5),
    (org_id, 'Outros', 6)
  ON CONFLICT DO NOTHING;
END;
$$;
