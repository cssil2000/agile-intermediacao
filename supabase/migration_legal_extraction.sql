-- ==============================================================================
-- Migração: case_extractions
-- Descrição: Criação de tabela para guardar dados puros extraídos de OCR e Jusbrasil 
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.case_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    raw_input JSONB,
    extracted_fields JSONB NOT NULL,
    confidence TEXT CHECK (confidence IN ('alta', 'media', 'baixa')),
    warnings JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.case_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins podem ler extrações de agentes"
    ON public.case_extractions
    FOR SELECT
    TO authenticated
    USING ((auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Sistema pode inserir extrações"
    ON public.case_extractions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
