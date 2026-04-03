
-- 1. Harden current_org_id() to explicitly check auth
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM profiles
  WHERE id = auth.uid()
    AND auth.uid() IS NOT NULL
$$;

-- 2. Validation trigger to prevent cross-org contact references in case_parties
CREATE OR REPLACE FUNCTION public.validate_case_party_contact_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the contact belongs to the same organization
  IF NOT EXISTS (
    SELECT 1 FROM contacts
    WHERE id = NEW.contact_id
      AND organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'Contact does not belong to the same organization';
  END IF;

  -- Ensure the case belongs to the same organization
  IF NOT EXISTS (
    SELECT 1 FROM cases
    WHERE id = NEW.case_id
      AND organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'Case does not belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_case_party_refs
BEFORE INSERT OR UPDATE ON public.case_parties
FOR EACH ROW
EXECUTE FUNCTION public.validate_case_party_contact_org();
