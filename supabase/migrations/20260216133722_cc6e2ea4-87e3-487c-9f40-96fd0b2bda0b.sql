
-- Create tribunals table (global + per-org)
CREATE TABLE public.tribunals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  segment text,
  uf text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tribunals ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read global tribunals + their org's custom ones
CREATE POLICY "tribunals_select" ON public.tribunals
  FOR SELECT USING (
    organization_id IS NULL OR organization_id = current_org_id()
  );

-- Users can create custom tribunals for their org
CREATE POLICY "tribunals_insert" ON public.tribunals
  FOR INSERT WITH CHECK (
    organization_id = current_org_id()
  );

-- Users can update their org's custom tribunals only
CREATE POLICY "tribunals_update" ON public.tribunals
  FOR UPDATE USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());

-- Users can delete their org's custom tribunals only
CREATE POLICY "tribunals_delete" ON public.tribunals
  FOR DELETE USING (organization_id = current_org_id());

-- Seed all Brazilian courts (global, organization_id = NULL)
INSERT INTO public.tribunals (organization_id, name, code, segment, uf) VALUES
  -- Superiores
  (NULL, 'Supremo Tribunal Federal', 'STF', 'Superior', NULL),
  (NULL, 'Superior Tribunal de Justiça', 'STJ', 'Superior', NULL),
  (NULL, 'Tribunal Superior do Trabalho', 'TST', 'Superior', NULL),
  (NULL, 'Tribunal Superior Eleitoral', 'TSE', 'Superior', NULL),
  (NULL, 'Superior Tribunal Militar', 'STM', 'Superior', NULL),
  -- TJs
  (NULL, 'Tribunal de Justiça do Acre', 'TJAC', 'Estadual', 'AC'),
  (NULL, 'Tribunal de Justiça de Alagoas', 'TJAL', 'Estadual', 'AL'),
  (NULL, 'Tribunal de Justiça do Amapá', 'TJAP', 'Estadual', 'AP'),
  (NULL, 'Tribunal de Justiça do Amazonas', 'TJAM', 'Estadual', 'AM'),
  (NULL, 'Tribunal de Justiça da Bahia', 'TJBA', 'Estadual', 'BA'),
  (NULL, 'Tribunal de Justiça do Ceará', 'TJCE', 'Estadual', 'CE'),
  (NULL, 'Tribunal de Justiça do Distrito Federal e Territórios', 'TJDFT', 'Estadual', 'DF'),
  (NULL, 'Tribunal de Justiça do Espírito Santo', 'TJES', 'Estadual', 'ES'),
  (NULL, 'Tribunal de Justiça de Goiás', 'TJGO', 'Estadual', 'GO'),
  (NULL, 'Tribunal de Justiça do Maranhão', 'TJMA', 'Estadual', 'MA'),
  (NULL, 'Tribunal de Justiça de Mato Grosso', 'TJMT', 'Estadual', 'MT'),
  (NULL, 'Tribunal de Justiça de Mato Grosso do Sul', 'TJMS', 'Estadual', 'MS'),
  (NULL, 'Tribunal de Justiça de Minas Gerais', 'TJMG', 'Estadual', 'MG'),
  (NULL, 'Tribunal de Justiça do Pará', 'TJPA', 'Estadual', 'PA'),
  (NULL, 'Tribunal de Justiça da Paraíba', 'TJPB', 'Estadual', 'PB'),
  (NULL, 'Tribunal de Justiça do Paraná', 'TJPR', 'Estadual', 'PR'),
  (NULL, 'Tribunal de Justiça de Pernambuco', 'TJPE', 'Estadual', 'PE'),
  (NULL, 'Tribunal de Justiça do Piauí', 'TJPI', 'Estadual', 'PI'),
  (NULL, 'Tribunal de Justiça do Rio de Janeiro', 'TJRJ', 'Estadual', 'RJ'),
  (NULL, 'Tribunal de Justiça do Rio Grande do Norte', 'TJRN', 'Estadual', 'RN'),
  (NULL, 'Tribunal de Justiça do Rio Grande do Sul', 'TJRS', 'Estadual', 'RS'),
  (NULL, 'Tribunal de Justiça de Rondônia', 'TJRO', 'Estadual', 'RO'),
  (NULL, 'Tribunal de Justiça de Roraima', 'TJRR', 'Estadual', 'RR'),
  (NULL, 'Tribunal de Justiça de Santa Catarina', 'TJSC', 'Estadual', 'SC'),
  (NULL, 'Tribunal de Justiça de São Paulo', 'TJSP', 'Estadual', 'SP'),
  (NULL, 'Tribunal de Justiça de Sergipe', 'TJSE', 'Estadual', 'SE'),
  (NULL, 'Tribunal de Justiça do Tocantins', 'TJTO', 'Estadual', 'TO'),
  -- TRFs
  (NULL, 'Tribunal Regional Federal da 1ª Região', 'TRF1', 'Federal', NULL),
  (NULL, 'Tribunal Regional Federal da 2ª Região', 'TRF2', 'Federal', NULL),
  (NULL, 'Tribunal Regional Federal da 3ª Região', 'TRF3', 'Federal', NULL),
  (NULL, 'Tribunal Regional Federal da 4ª Região', 'TRF4', 'Federal', NULL),
  (NULL, 'Tribunal Regional Federal da 5ª Região', 'TRF5', 'Federal', NULL),
  (NULL, 'Tribunal Regional Federal da 6ª Região', 'TRF6', 'Federal', NULL),
  -- TRTs
  (NULL, 'Tribunal Regional do Trabalho da 1ª Região (RJ)', 'TRT1', 'Trabalho', 'RJ'),
  (NULL, 'Tribunal Regional do Trabalho da 2ª Região (SP)', 'TRT2', 'Trabalho', 'SP'),
  (NULL, 'Tribunal Regional do Trabalho da 3ª Região (MG)', 'TRT3', 'Trabalho', 'MG'),
  (NULL, 'Tribunal Regional do Trabalho da 4ª Região (RS)', 'TRT4', 'Trabalho', 'RS'),
  (NULL, 'Tribunal Regional do Trabalho da 5ª Região (BA)', 'TRT5', 'Trabalho', 'BA'),
  (NULL, 'Tribunal Regional do Trabalho da 6ª Região (PE)', 'TRT6', 'Trabalho', 'PE'),
  (NULL, 'Tribunal Regional do Trabalho da 7ª Região (CE)', 'TRT7', 'Trabalho', 'CE'),
  (NULL, 'Tribunal Regional do Trabalho da 8ª Região (PA/AP)', 'TRT8', 'Trabalho', 'PA'),
  (NULL, 'Tribunal Regional do Trabalho da 9ª Região (PR)', 'TRT9', 'Trabalho', 'PR'),
  (NULL, 'Tribunal Regional do Trabalho da 10ª Região (DF/TO)', 'TRT10', 'Trabalho', 'DF'),
  (NULL, 'Tribunal Regional do Trabalho da 11ª Região (AM/RR)', 'TRT11', 'Trabalho', 'AM'),
  (NULL, 'Tribunal Regional do Trabalho da 12ª Região (SC)', 'TRT12', 'Trabalho', 'SC'),
  (NULL, 'Tribunal Regional do Trabalho da 13ª Região (PB)', 'TRT13', 'Trabalho', 'PB'),
  (NULL, 'Tribunal Regional do Trabalho da 14ª Região (RO/AC)', 'TRT14', 'Trabalho', 'RO'),
  (NULL, 'Tribunal Regional do Trabalho da 15ª Região (Campinas)', 'TRT15', 'Trabalho', 'SP'),
  (NULL, 'Tribunal Regional do Trabalho da 16ª Região (MA)', 'TRT16', 'Trabalho', 'MA'),
  (NULL, 'Tribunal Regional do Trabalho da 17ª Região (ES)', 'TRT17', 'Trabalho', 'ES'),
  (NULL, 'Tribunal Regional do Trabalho da 18ª Região (GO)', 'TRT18', 'Trabalho', 'GO'),
  (NULL, 'Tribunal Regional do Trabalho da 19ª Região (AL)', 'TRT19', 'Trabalho', 'AL'),
  (NULL, 'Tribunal Regional do Trabalho da 20ª Região (SE)', 'TRT20', 'Trabalho', 'SE'),
  (NULL, 'Tribunal Regional do Trabalho da 21ª Região (RN)', 'TRT21', 'Trabalho', 'RN'),
  (NULL, 'Tribunal Regional do Trabalho da 22ª Região (PI)', 'TRT22', 'Trabalho', 'PI'),
  (NULL, 'Tribunal Regional do Trabalho da 23ª Região (MT)', 'TRT23', 'Trabalho', 'MT'),
  (NULL, 'Tribunal Regional do Trabalho da 24ª Região (MS)', 'TRT24', 'Trabalho', 'MS'),
  -- TJMs
  (NULL, 'Tribunal de Justiça Militar de São Paulo', 'TJM-SP', 'Militar', 'SP'),
  (NULL, 'Tribunal de Justiça Militar de Minas Gerais', 'TJM-MG', 'Militar', 'MG'),
  (NULL, 'Tribunal de Justiça Militar do Rio Grande do Sul', 'TJM-RS', 'Militar', 'RS');
