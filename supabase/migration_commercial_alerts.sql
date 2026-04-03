-- Adicionar Status Comercial de topo na Tabela Cases
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS commercial_status text,
ADD COLUMN IF NOT EXISTS last_alert_type text,
ADD COLUMN IF NOT EXISTS last_alert_priority text,
ADD COLUMN IF NOT EXISTS ready_for_commercial boolean DEFAULT false;

-- Tabela Central de Disparo de Alertas Internos
CREATE TABLE IF NOT EXISTS public.commercial_alerts (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
    
    alert_type text NOT NULL,
    alert_priority text NOT NULL,
    notify_roles text[] DEFAULT '{}'::text[],
    alert_reason text,
    commercial_status text,
    
    payload jsonb DEFAULT '{}'::jsonb,
    
    sent_at timestamp with time zone,
    delivery_status text DEFAULT 'pending'
);

-- Ativar RLS
ALTER TABLE public.commercial_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso genérico
CREATE POLICY "Acesso integral autenticados para Alertas Comerciais" ON public.commercial_alerts
    FOR ALL USING (auth.role() = 'authenticated');
