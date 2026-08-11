ALTER TABLE public.deadlines
  ADD COLUMN IF NOT EXISTS deadline_category text NOT NULL DEFAULT 'normal';

ALTER TABLE public.deadlines
  DROP CONSTRAINT IF EXISTS deadlines_deadline_category_check;

ALTER TABLE public.deadlines
  ADD CONSTRAINT deadlines_deadline_category_check
  CHECK (deadline_category IN ('normal','cumprimento_sentenca'));

CREATE INDEX IF NOT EXISTS idx_deadlines_category ON public.deadlines (organization_id, deadline_category);

CREATE TABLE public.deadline_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deadline_tags TO authenticated;
GRANT ALL ON public.deadline_tags TO service_role;

ALTER TABLE public.deadline_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_tags_select" ON public.deadline_tags
  FOR SELECT TO authenticated USING (organization_id = public.current_org_id());
CREATE POLICY "deadline_tags_insert" ON public.deadline_tags
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY "deadline_tags_update" ON public.deadline_tags
  FOR UPDATE TO authenticated USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY "deadline_tags_delete" ON public.deadline_tags
  FOR DELETE TO authenticated USING (organization_id = public.current_org_id());

CREATE TABLE public.deadline_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deadline_id uuid NOT NULL REFERENCES public.deadlines(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.deadline_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deadline_id, tag_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deadline_tag_links TO authenticated;
GRANT ALL ON public.deadline_tag_links TO service_role;

ALTER TABLE public.deadline_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadline_tag_links_select" ON public.deadline_tag_links
  FOR SELECT TO authenticated USING (organization_id = public.current_org_id());
CREATE POLICY "deadline_tag_links_insert" ON public.deadline_tag_links
  FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY "deadline_tag_links_update" ON public.deadline_tag_links
  FOR UPDATE TO authenticated USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY "deadline_tag_links_delete" ON public.deadline_tag_links
  FOR DELETE TO authenticated USING (organization_id = public.current_org_id());

CREATE INDEX IF NOT EXISTS idx_deadline_tag_links_deadline ON public.deadline_tag_links (deadline_id);
CREATE INDEX IF NOT EXISTS idx_deadline_tag_links_tag ON public.deadline_tag_links (tag_id);
