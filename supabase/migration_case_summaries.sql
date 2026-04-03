CREATE TABLE IF NOT EXISTS public.case_summaries (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
    agent_name text NOT NULL DEFAULT 'executive_summary_agent',
    
    executive_summary_short text NOT NULL,
    executive_summary_full text NOT NULL,
    recommended_next_action text NOT NULL,
    key_attention_points text[] DEFAULT '{}'::text[],
    
    confidence text NOT NULL DEFAULT 'alta',
    warnings text[] DEFAULT '{}'::text[]
);

-- Ativar RLS
ALTER TABLE public.case_summaries ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso genérico
CREATE POLICY "Acesso integral autenticados para Case Summaries" ON public.case_summaries
    FOR ALL USING (auth.role() = 'authenticated');
