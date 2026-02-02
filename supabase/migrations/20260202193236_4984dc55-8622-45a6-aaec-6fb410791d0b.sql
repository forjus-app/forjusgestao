-- =============================================
-- MÓDULO AGENDA JURÍDICA
-- =============================================

-- Tabela principal de eventos/compromissos
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Vínculos opcionais
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Responsável obrigatório
  responsible_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  
  -- Tipo do evento
  event_type text NOT NULL CHECK (event_type IN ('audiencia', 'pericia', 'sessao', 'reuniao', 'diligencia', 'outro')),
  
  -- Dados do evento
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  location text,
  online_link text,
  notes text,
  
  -- Status
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'done', 'canceled')),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_events_org_status ON events (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_events_org_type ON events (organization_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_org_start ON events (organization_id, start_at);
CREATE INDEX IF NOT EXISTS idx_events_case ON events (case_id);
CREATE INDEX IF NOT EXISTS idx_events_responsible ON events (responsible_member_id);

-- Tabela de lembretes (múltiplos por evento)
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  remind_at timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  sent_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event ON event_reminders (event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_pending ON event_reminders (remind_at) WHERE sent_at IS NULL;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- Policies para events
CREATE POLICY events_select ON events
FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY events_insert ON events
FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY events_update ON events
FOR UPDATE USING (organization_id = current_org_id())
WITH CHECK (organization_id = current_org_id());

CREATE POLICY events_delete ON events
FOR DELETE USING (organization_id = current_org_id());

-- Policies para event_reminders
CREATE POLICY event_reminders_select ON event_reminders
FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY event_reminders_insert ON event_reminders
FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY event_reminders_update ON event_reminders
FOR UPDATE USING (organization_id = current_org_id())
WITH CHECK (organization_id = current_org_id());

CREATE POLICY event_reminders_delete ON event_reminders
FOR DELETE USING (organization_id = current_org_id());