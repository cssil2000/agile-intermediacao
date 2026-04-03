-- Adicionar colunas de auditoria para reexecução controlada
ALTER TABLE public.agent_runs 
ADD COLUMN IF NOT EXISTS trigger_type text DEFAULT 'automatico',
ADD COLUMN IF NOT EXISTS rerun_reason text,
ADD COLUMN IF NOT EXISTS triggered_by_email text;

-- Atualizar o comentário para documentação
COMMENT ON COLUMN public.agent_runs.trigger_type IS 'Tipo de disparo: automatico, manual, rerun_agente, rerun_pipeline';
COMMENT ON COLUMN public.agent_runs.rerun_reason IS 'Motivo informado pelo utilizador para a reexecução';
COMMENT ON COLUMN public.agent_runs.triggered_by_email IS 'Email do utilizador que iniciou a ação manual';
