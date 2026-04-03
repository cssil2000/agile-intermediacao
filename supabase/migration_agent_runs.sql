CREATE TABLE IF NOT EXISTS public.agent_runs (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
    
    agent_name text NOT NULL,
    run_status text NOT NULL DEFAULT 'processing',
    
    input_payload jsonb DEFAULT '{}'::jsonb,
    output_payload jsonb DEFAULT '{}'::jsonb,
    
    warnings text[] DEFAULT '{}'::text[],
    error_message text,
    
    duration_ms integer,
    needs_human_review boolean DEFAULT false,
    confidence text,
    triggered_by text DEFAULT 'system',
    execution_order integer DEFAULT 0
);

-- Índices úteis para listagens do Next.js
CREATE INDEX IF NOT EXISTS idx_agent_runs_case_id ON public.agent_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON public.agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(run_status);

-- Ativar RLS
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Acesso integral autenticados para Agent Runs" ON public.agent_runs
    FOR ALL USING (auth.role() = 'authenticated');
