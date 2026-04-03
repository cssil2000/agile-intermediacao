CREATE TABLE IF NOT EXISTS public.case_pending_actions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
    
    pending_type text NOT NULL,
    pending_items text[] DEFAULT '{}'::text[],
    pending_recovery_worth text NOT NULL,
    recommended_pending_action text NOT NULL,
    
    pending_request_subject text,
    pending_request_message_short text,
    pending_request_message_full text,
    
    status text DEFAULT 'pendente',
    
    last_sent_at timestamp with time zone,
    response_received_at timestamp with time zone
);

-- Ativar RLS
ALTER TABLE public.case_pending_actions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso genérico
CREATE POLICY "Acesso integral autenticados para Pending Actions" ON public.case_pending_actions
    FOR ALL USING (auth.role() = 'authenticated');
