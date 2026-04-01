-- ============================================
-- Agile Intermediação — Migration: Suporte a Precatórios
-- Execute este ficheiro no Supabase SQL Editor
-- ============================================

-- 1. Criar tipos ENUM se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
        CREATE TYPE asset_type AS ENUM ('trabalhista', 'precatorio');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_nature') THEN
        CREATE TYPE credit_nature AS ENUM ('alimentar', 'comum', 'outro');
    END IF;
END $$;

-- 2. Adicionar novos campos à tabela cases
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS asset_type asset_type DEFAULT 'trabalhista',
ADD COLUMN IF NOT EXISTS precatorio_number TEXT,
ADD COLUMN IF NOT EXISTS public_entity TEXT,
ADD COLUMN IF NOT EXISTS credit_nature credit_nature,
ADD COLUMN IF NOT EXISTS court_origin TEXT,
ADD COLUMN IF NOT EXISTS estimated_face_value NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS discount_expectation NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS payment_year INTEGER,
ADD COLUMN IF NOT EXISTS priority_right BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lawyer_name TEXT,
ADD COLUMN IF NOT EXISTS lawyer_contact TEXT;

-- 3. Garantir que todos os registos existentes são 'trabalhista'
UPDATE cases SET asset_type = 'trabalhista' WHERE asset_type IS NULL;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cases_asset_type ON cases(asset_type);
CREATE INDEX IF NOT EXISTS idx_cases_precatorio_number ON cases(precatorio_number);
CREATE INDEX IF NOT EXISTS idx_cases_payment_year ON cases(payment_year);
