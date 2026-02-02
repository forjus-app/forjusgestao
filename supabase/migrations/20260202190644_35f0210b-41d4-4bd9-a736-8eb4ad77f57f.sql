-- =========================================
-- 1) TEAM MEMBERS (Responsáveis internos)
-- =========================================
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  name text NOT NULL,
  role text NOT NULL DEFAULT 'advogado',

  email text,
  whatsapp text,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (organization_id, name)
);

CREATE TRIGGER trg_team_members_updated_at
BEFORE UPDATE ON team_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_team_members_org_active
ON team_members (organization_id, is_active);

-- =========================================
-- 2) DEADLINES (Prazos)
-- =========================================
CREATE TABLE IF NOT EXISTS deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type text NOT NULL,

  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,

  title text NOT NULL,

  responsible_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,

  delivery_due_at timestamptz NOT NULL,
  fatal_due_at timestamptz NOT NULL,

  status text NOT NULL DEFAULT 'open',

  completed_at timestamptz,
  completed_notes text,

  review_status text NOT NULL DEFAULT 'not_required',

  reviewed_at timestamptz,
  reviewed_notes text,

  priority int NOT NULL DEFAULT 0,
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_deadlines_updated_at
BEFORE UPDATE ON deadlines
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deadlines_org_status ON deadlines (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deadlines_org_responsible ON deadlines (organization_id, responsible_member_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_org_fatal ON deadlines (organization_id, fatal_due_at);
CREATE INDEX IF NOT EXISTS idx_deadlines_case ON deadlines (case_id);

-- =========================================
-- 3) TRIGGER: ao concluir, atualizar review_status
-- =========================================
CREATE OR REPLACE FUNCTION on_deadline_complete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.status = 'completed' AND OLD.status <> 'completed') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
    NEW.review_status = 'pending';
  END IF;

  IF (NEW.status = 'reviewed') THEN
    NEW.review_status = 'approved';
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;

  IF (NEW.status = 'adjustment_requested') THEN
    NEW.review_status = 'rejected';
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deadline_complete
BEFORE UPDATE ON deadlines
FOR EACH ROW EXECUTE FUNCTION on_deadline_complete();

-- =========================================
-- 4) RLS: team_members
-- =========================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY tm_select ON team_members
FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY tm_insert ON team_members
FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY tm_update ON team_members
FOR UPDATE USING (organization_id = current_org_id())
WITH CHECK (organization_id = current_org_id());

CREATE POLICY tm_delete ON team_members
FOR DELETE USING (organization_id = current_org_id());

-- =========================================
-- 5) RLS: deadlines
-- =========================================
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY dl_select ON deadlines
FOR SELECT USING (organization_id = current_org_id());

CREATE POLICY dl_insert ON deadlines
FOR INSERT WITH CHECK (organization_id = current_org_id());

CREATE POLICY dl_update ON deadlines
FOR UPDATE USING (organization_id = current_org_id())
WITH CHECK (organization_id = current_org_id());

CREATE POLICY dl_delete ON deadlines
FOR DELETE USING (organization_id = current_org_id());