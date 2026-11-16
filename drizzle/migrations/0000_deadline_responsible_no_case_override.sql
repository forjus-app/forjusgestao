DROP TRIGGER IF EXISTS trg_set_case_default_deadline_responsible ON public.deadlines;
CREATE OR REPLACE FUNCTION public.set_case_default_deadline_responsible()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.case_id IS NOT NULL AND NEW.responsible_member_id IS NOT NULL THEN
    UPDATE public.cases SET default_deadline_responsible_id = NEW.responsible_member_id, updated_at = now()
    WHERE id = NEW.case_id AND default_deadline_responsible_id IS NULL;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_set_case_default_deadline_responsible AFTER INSERT ON public.deadlines
FOR EACH ROW EXECUTE FUNCTION public.set_case_default_deadline_responsible();