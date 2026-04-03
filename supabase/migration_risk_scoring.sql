-- Tabela Exclusiva para Arquivamento Detalhado e Auditoria do Risco e Scoring
CREATE TABLE IF NOT EXISTS public.risk_scores (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
    asset_type text NOT NULL,
    
    -- Pontuações de 0 a 100
    legal_risk_score integer NOT NULL DEFAULT 0,
    financial_risk_score integer NOT NULL DEFAULT 0,
    commercial_priority_score integer NOT NULL DEFAULT 0,
    documentation_quality_score integer NOT NULL DEFAULT 0,
    overall_operational_score integer NOT NULL DEFAULT 0,
    
    -- Classificações Verbais (baixo, medio, alto, premium)
    legal_risk_level text NOT NULL,
    financial_risk_level text NOT NULL,
    commercial_priority_level text NOT NULL,
    documentation_quality_level text NOT NULL,
    priority_label text NOT NULL,
    
    -- Contexto Extenso
    risk_summary text,
    flags text[] DEFAULT '{}'::text[],
    confidence text NOT NULL DEFAULT 'media',
    raw_reasoning jsonb DEFAULT '{}'::jsonb
);

-- Ativar RLS
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso genérico (A ajustar consoante o RLS da arquitetura)
CREATE POLICY "Acesso integral autenticados para Risk Scores" ON public.risk_scores
    FOR ALL USING (auth.role() = 'authenticated');
