-- ============================================
-- Agile Intermediação — Database Schema (MVP)
-- Execute este ficheiro no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TIPOS ENUMERADOS
-- ============================================

CREATE TYPE lead_type AS ENUM ('advogado', 'reclamante', 'outro');
CREATE TYPE lead_status AS ENUM ('novo', 'em_triagem', 'pendente', 'qualificado', 'rejeitado', 'convertido');
CREATE TYPE asset_type AS ENUM ('trabalhista', 'precatorio');
CREATE TYPE credit_nature AS ENUM ('alimentar', 'comum', 'outro');
CREATE TYPE case_status AS ENUM ('recebido', 'em_analise', 'revisao_humana', 'aprovado', 'rejeitado', 'proposta', 'encerrado');
CREATE TYPE case_priority AS ENUM ('baixa', 'media', 'alta', 'premium');
CREATE TYPE actor_type AS ENUM ('sistema', 'admin', 'analista', 'cliente');
CREATE TYPE file_status AS ENUM ('enviado', 'validado', 'ilegivel', 'pendente');
CREATE TYPE user_role AS ENUM ('admin', 'analista', 'socio', 'comercial');

-- ============================================
-- 2. FUNÇÃO AUXILIAR: updated_at AUTOMÁTICO
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. SEQUÊNCIA PARA REFERÊNCIA INTERNA
-- ============================================

CREATE SEQUENCE IF NOT EXISTS case_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_internal_reference()
RETURNS TRIGGER AS $$
BEGIN
  NEW.internal_reference = 'AGI-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('case_ref_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TABELA: leads
-- ============================================

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  lead_type       lead_type NOT NULL DEFAULT 'outro',
  source_page     TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  notes           TEXT,
  privacy_consent BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_consent_at TIMESTAMPTZ,
  status          lead_status NOT NULL DEFAULT 'novo'
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. TABELA: cases
-- ============================================

CREATE TABLE cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  asset_type          asset_type NOT NULL DEFAULT 'trabalhista',
  process_number      TEXT NOT NULL,
  tribunal            TEXT,
  court_region        TEXT,
  defendant_company   TEXT,
  estimated_value     NUMERIC(15, 2),
  process_stage       TEXT,
  -- Campos de Precatório
  precatorio_number   TEXT,
  public_entity       TEXT,
  credit_nature       credit_nature,
  court_origin        TEXT,
  estimated_face_value NUMERIC(15, 2),
  discount_expectation NUMERIC(5, 2),
  payment_year        INTEGER,
  priority_right      BOOLEAN DEFAULT FALSE,
  lawyer_name         TEXT,
  lawyer_contact      TEXT,
  -- Status e Metadados
  case_status         case_status NOT NULL DEFAULT 'recebido',
  priority            case_priority NOT NULL DEFAULT 'media',
  score_total         NUMERIC(5, 2),
  ai_summary          TEXT,
  ai_recommendation   TEXT,
  risk_level          TEXT,
  solvency_level      TEXT,
  internal_reference  TEXT UNIQUE
);

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cases_generate_ref
  BEFORE INSERT ON cases
  FOR EACH ROW EXECUTE FUNCTION generate_internal_reference();

-- ============================================
-- 6. TABELA: activity_logs
-- ============================================

CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lead_id     UUID REFERENCES leads(id) ON DELETE SET NULL,
  case_id     UUID REFERENCES cases(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  description TEXT,
  actor_type  actor_type NOT NULL DEFAULT 'sistema',
  actor_id    UUID
);

-- ============================================
-- 7. TABELA: documents
-- ============================================

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_type   TEXT,
  file_url        TEXT,
  file_name       TEXT,
  file_status     file_status NOT NULL DEFAULT 'pendente',
  extracted_text  TEXT
);

-- ============================================
-- 8. TABELA: users (área interna futura)
-- ============================================

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'analista',
  status      TEXT NOT NULL DEFAULT 'ativo'
);

-- ============================================
-- 9. ÍNDICES
-- ============================================

CREATE INDEX idx_leads_email       ON leads(email);
CREATE INDEX idx_leads_status      ON leads(status);
CREATE INDEX idx_leads_created_at  ON leads(created_at DESC);

CREATE INDEX idx_cases_process_number    ON cases(process_number);
CREATE INDEX idx_cases_case_status       ON cases(case_status);
CREATE INDEX idx_cases_asset_type        ON cases(asset_type);
CREATE INDEX idx_cases_lead_id           ON cases(lead_id);
CREATE INDEX idx_cases_internal_ref      ON cases(internal_reference);
CREATE INDEX idx_cases_created_at        ON cases(created_at DESC);

CREATE INDEX idx_activity_logs_lead_id   ON activity_logs(lead_id);
CREATE INDEX idx_activity_logs_case_id   ON activity_logs(case_id);
CREATE INDEX idx_activity_logs_event     ON activity_logs(event_type);

CREATE INDEX idx_documents_case_id       ON documents(case_id);

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activar RLS em todas as tabelas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para formulário público: permitir INSERT anónimo em leads, cases e activity_logs
CREATE POLICY "Permitir insert público em leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir insert público em cases"
  ON cases FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir insert público em activity_logs"
  ON activity_logs FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política para leitura: apenas para select do case recém-criado (sucesso page)
CREATE POLICY "Permitir select público em cases por internal_reference"
  ON cases FOR SELECT
  TO anon
  USING (true);

-- Bloquear tudo por defeito em documents e users (apenas área interna)
CREATE POLICY "Bloquear acesso anon a documents"
  ON documents FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Bloquear acesso anon a users"
  ON users FOR ALL
  TO anon
  USING (false);
