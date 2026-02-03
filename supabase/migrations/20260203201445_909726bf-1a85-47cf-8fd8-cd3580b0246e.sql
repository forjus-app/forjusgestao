-- Tabela principal de acordos/negociações
CREATE TABLE public.settlement_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  case_id uuid NULL REFERENCES public.cases(id) ON DELETE SET NULL,
  client_contact_id uuid NULL REFERENCES public.contacts(id) ON DELETE SET NULL,
  counterparty_contact_id uuid NULL REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'negotiating', 'awaiting_response', 'closed')),
  notes text NULL,
  next_followup_at timestamptz NULL,
  followup_enabled boolean NOT NULL DEFAULT false,
  followup_every_n_days integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de histórico de interações
CREATE TABLE public.settlement_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  settlement_case_id uuid NOT NULL REFERENCES public.settlement_cases(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('whatsapp', 'email', 'phone_call', 'note')),
  direction text NULL CHECK (direction IS NULL OR direction IN ('outbound', 'inbound')),
  message text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  next_followup_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_settlement_cases_org ON public.settlement_cases(organization_id);
CREATE INDEX idx_settlement_cases_status ON public.settlement_cases(status);
CREATE INDEX idx_settlement_cases_followup ON public.settlement_cases(next_followup_at) WHERE next_followup_at IS NOT NULL;
CREATE INDEX idx_settlement_cases_assigned ON public.settlement_cases(assigned_member_id);
CREATE INDEX idx_settlement_interactions_case ON public.settlement_interactions(settlement_case_id);
CREATE INDEX idx_settlement_interactions_org ON public.settlement_interactions(organization_id);

-- Trigger para updated_at
CREATE TRIGGER update_settlement_cases_updated_at
  BEFORE UPDATE ON public.settlement_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Habilitar RLS
ALTER TABLE public.settlement_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_interactions ENABLE ROW LEVEL SECURITY;

-- Policies para settlement_cases
CREATE POLICY "settlement_cases_select" ON public.settlement_cases
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "settlement_cases_insert" ON public.settlement_cases
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "settlement_cases_update" ON public.settlement_cases
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "settlement_cases_delete" ON public.settlement_cases
  FOR DELETE USING (organization_id = current_org_id());

-- Policies para settlement_interactions
CREATE POLICY "settlement_interactions_select" ON public.settlement_interactions
  FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY "settlement_interactions_insert" ON public.settlement_interactions
  FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY "settlement_interactions_update" ON public.settlement_interactions
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

CREATE POLICY "settlement_interactions_delete" ON public.settlement_interactions
  FOR DELETE USING (organization_id = current_org_id());

-- Função para atualizar next_followup_at após interação outbound
CREATE OR REPLACE FUNCTION public.update_settlement_followup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settlement settlement_cases%ROWTYPE;
BEGIN
  -- Buscar o acordo
  SELECT * INTO v_settlement FROM settlement_cases WHERE id = NEW.settlement_case_id;
  
  -- Se a interação define próximo follow-up, usar esse valor
  IF NEW.next_followup_at IS NOT NULL THEN
    UPDATE settlement_cases 
    SET next_followup_at = NEW.next_followup_at
    WHERE id = NEW.settlement_case_id;
  -- Se automação está habilitada e é uma interação outbound
  ELSIF v_settlement.followup_enabled = true 
    AND v_settlement.followup_every_n_days IS NOT NULL 
    AND v_settlement.status != 'closed'
    AND NEW.direction = 'outbound' THEN
    UPDATE settlement_cases 
    SET next_followup_at = now() + (v_settlement.followup_every_n_days || ' days')::interval
    WHERE id = NEW.settlement_case_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para automação de follow-up
CREATE TRIGGER trigger_update_settlement_followup
  AFTER INSERT ON public.settlement_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_settlement_followup();