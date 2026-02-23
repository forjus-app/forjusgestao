-- Add partial unique index: prevent duplicate CNJ within same organization
-- Allows multiple NULL cnj_number rows (partial index only covers non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_org_cnj_unique
ON public.cases (organization_id, cnj_number)
WHERE cnj_number IS NOT NULL AND cnj_number != '';