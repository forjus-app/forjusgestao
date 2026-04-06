
-- CRM Columns (Kanban columns)
CREATE TABLE public.crm_columns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_columns_select" ON public.crm_columns FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY "crm_columns_insert" ON public.crm_columns FOR INSERT WITH CHECK (organization_id = current_org_id());
CREATE POLICY "crm_columns_update" ON public.crm_columns FOR UPDATE USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());
CREATE POLICY "crm_columns_delete" ON public.crm_columns FOR DELETE USING (organization_id = current_org_id());

-- CRM Categories
CREATE TABLE public.crm_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_categories_select" ON public.crm_categories FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY "crm_categories_insert" ON public.crm_categories FOR INSERT WITH CHECK (organization_id = current_org_id());
CREATE POLICY "crm_categories_update" ON public.crm_categories FOR UPDATE USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());
CREATE POLICY "crm_categories_delete" ON public.crm_categories FOR DELETE USING (organization_id = current_org_id());

-- CRM Leads
CREATE TABLE public.crm_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.crm_columns(id) ON DELETE RESTRICT,
  name text NOT NULL,
  phone text,
  city text,
  email text,
  category_id uuid REFERENCES public.crm_categories(id) ON DELETE SET NULL,
  summary text,
  drive_link text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_leads_select" ON public.crm_leads FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY "crm_leads_insert" ON public.crm_leads FOR INSERT WITH CHECK (organization_id = current_org_id());
CREATE POLICY "crm_leads_update" ON public.crm_leads FOR UPDATE USING (organization_id = current_org_id()) WITH CHECK (organization_id = current_org_id());
CREATE POLICY "crm_leads_delete" ON public.crm_leads FOR DELETE USING (organization_id = current_org_id());

CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CRM Lead Tags (N:N with existing tags table)
CREATE TABLE public.crm_lead_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

ALTER TABLE public.crm_lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_lead_tags_select" ON public.crm_lead_tags FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY "crm_lead_tags_insert" ON public.crm_lead_tags FOR INSERT WITH CHECK (organization_id = current_org_id());
CREATE POLICY "crm_lead_tags_delete" ON public.crm_lead_tags FOR DELETE USING (organization_id = current_org_id());

-- CRM Lead History
CREATE TABLE public.crm_lead_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  from_column_id uuid REFERENCES public.crm_columns(id) ON DELETE SET NULL,
  to_column_id uuid NOT NULL REFERENCES public.crm_columns(id) ON DELETE SET NULL,
  moved_at timestamptz NOT NULL DEFAULT now(),
  moved_by uuid
);

ALTER TABLE public.crm_lead_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_lead_history_select" ON public.crm_lead_history FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY "crm_lead_history_insert" ON public.crm_lead_history FOR INSERT WITH CHECK (organization_id = current_org_id());

-- Seed function for default CRM columns and categories
CREATE OR REPLACE FUNCTION public.seed_crm_taxonomy(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO crm_columns (organization_id, name, color, sort_order)
  VALUES
    (org_id, 'Novo contato', '#3b82f6', 1),
    (org_id, 'Em análise', '#8b5cf6', 2),
    (org_id, 'Aguardando retorno', '#eab308', 3),
    (org_id, 'Reunião agendada', '#06b6d4', 4),
    (org_id, 'Proposta enviada', '#f97316', 5),
    (org_id, 'Fechado', '#22c55e', 6),
    (org_id, 'Não fechado', '#ef4444', 7),
    (org_id, 'Arquivado', '#6b7280', 8)
  ON CONFLICT DO NOTHING;

  INSERT INTO crm_categories (organization_id, name, sort_order)
  VALUES
    (org_id, 'Trabalhista', 1),
    (org_id, 'Bancário', 2),
    (org_id, 'Consumidor', 3),
    (org_id, 'Previdenciário', 4),
    (org_id, 'Empresarial', 5),
    (org_id, 'Família', 6),
    (org_id, 'Saúde', 7),
    (org_id, 'Outro', 8)
  ON CONFLICT DO NOTHING;
END;
$$;
