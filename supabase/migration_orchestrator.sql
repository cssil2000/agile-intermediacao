-- ============================================
-- Agile Intermediação — Orchestrator & Agents Schema
-- ============================================

-- ============================================
-- TABELA: agent_runs
-- Histórico de execução dos agentes da pipeline
-- ============================================

CREATE TABLE IF NOT EXISTS agent_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  case_id         UUID REFERENCES cases(id) ON DELETE CASCADE,
  agent_name      TEXT NOT NULL, -- e.g., 'orchestrator', 'extraction_agent'
  input_payload   JSONB,
  output_payload  JSONB,
  status          TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'success', 'error', 'failed'
  error_message   TEXT
);

-- Indices para rápida recuperação
CREATE INDEX IF NOT EXISTS idx_agent_runs_case_id ON agent_runs(case_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_name ON agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
-- Apenas sistema interno ou utilizadores autenticados autorizados devem conseguir ler
CREATE POLICY "Permitir leitura de agent_runs para autenticados"
  ON agent_runs FOR SELECT
  TO authenticated
  USING (true);

-- Apenas o sistema (/api/orchestrator) pode inserir ou atualizar através da service_role key, 
-- mas se a API route usa role de utilizador, abrimos para authenticated
CREATE POLICY "Permitir gestão de agent_runs para autenticados"
  ON agent_runs FOR ALL
  TO authenticated
  USING (true);
