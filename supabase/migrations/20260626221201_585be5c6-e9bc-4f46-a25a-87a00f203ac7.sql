
UPDATE public.deadlines SET status = 'open' WHERE status = 'in_progress';

ALTER TABLE public.deadlines DROP CONSTRAINT IF EXISTS deadlines_status_check;
ALTER TABLE public.deadlines
  ADD CONSTRAINT deadlines_status_check CHECK (status IN ('open','completed'));

ALTER TABLE public.deadlines DROP COLUMN IF EXISTS delivery_due_at;
ALTER TABLE public.deadlines ALTER COLUMN fatal_due_at DROP NOT NULL;
ALTER TABLE public.deadlines
  ADD COLUMN IF NOT EXISTS transit_judged_at timestamptz;

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS default_deadline_responsible_id uuid
    REFERENCES public.team_members(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.set_case_default_deadline_responsible()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.case_id IS NOT NULL AND NEW.responsible_member_id IS NOT NULL THEN
    UPDATE public.cases
      SET default_deadline_responsible_id = NEW.responsible_member_id,
          updated_at = now()
      WHERE id = NEW.case_id
        AND (default_deadline_responsible_id IS DISTINCT FROM NEW.responsible_member_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_case_default_deadline_responsible ON public.deadlines;
CREATE TRIGGER trg_set_case_default_deadline_responsible
  AFTER INSERT OR UPDATE OF responsible_member_id, case_id ON public.deadlines
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_default_deadline_responsible();
