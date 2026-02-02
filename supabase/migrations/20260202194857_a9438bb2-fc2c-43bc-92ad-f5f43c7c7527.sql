
-- Adicionar campo drive_link na tabela cases
ALTER TABLE public.cases ADD COLUMN drive_link TEXT;

-- Adicionar campo drive_link na tabela deadlines
ALTER TABLE public.deadlines ADD COLUMN drive_link TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.cases.drive_link IS 'Link para pasta/arquivo do Google Drive relacionado ao processo';
COMMENT ON COLUMN public.deadlines.drive_link IS 'Link para pasta/arquivo do Google Drive relacionado ao prazo';
