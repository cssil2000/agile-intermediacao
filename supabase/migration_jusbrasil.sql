-- ============================================
-- Agile Intermediação — Jusbrasil Integration
-- ============================================

-- ============================================
-- 1. TABELA: external_process_queries
-- ============================================

CREATE TABLE IF NOT EXISTS external_process_queries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  provider_name   TEXT NOT NULL DEFAULT 'jusbrasil',
  query_type      TEXT NOT NULL, -- 'cnj', 'cpf', 'cnpj', 'oab'
  query_value     TEXT NOT NULL,
  raw_response    JSONB,
  parsed_summary  JSONB,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error'
  error_message   TEXT
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ext_queries_case_id ON external_process_queries(case_id);
CREATE INDEX IF NOT EXISTS idx_ext_queries_query_value ON external_process_queries(query_value);
CREATE INDEX IF NOT EXISTS idx_ext_queries_status ON external_process_queries(status);

-- RLS
ALTER TABLE external_process_queries ENABLE ROW LEVEL SECURITY;

-- Block anonymous access, allow only internal/authenticated roles (if defined)
-- For now, for MVP/Internal dashboard, we allow authenticated users
CREATE POLICY "Apenas usuários autenticados podem ver consultas externas"
  ON external_process_queries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sistema pode gerir consultas externas"
  ON external_process_queries FOR ALL
  TO authenticated
  USING (true);

-- Logging activity for external queries
CREATE OR REPLACE FUNCTION log_external_query_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (case_id, event_type, description, actor_type)
  VALUES (
    NEW.case_id,
    'external_query_' || NEW.query_type,
    'Consulta externa realizada: ' || NEW.query_value || ' (Status: ' || NEW.status || ')',
    'sistema'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_log_external_query
  AFTER INSERT OR UPDATE ON external_process_queries
  FOR EACH ROW
  WHEN (NEW.status <> 'pending')
  EXECUTE FUNCTION log_external_query_activity();
