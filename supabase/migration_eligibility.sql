-- Adicionar campos de Elegibilidade e Scoring à Tabela Cases
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS eligibility_status text,
ADD COLUMN IF NOT EXISTS eligibility_reason text,
ADD COLUMN IF NOT EXISTS eligibility_flags text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS needs_human_review boolean DEFAULT false;

-- Em PostgreSQL, atualizar um tipo ENUM existente é complexo sem perder dados ou recriar a coluna, 
-- pelo que, se o case_status atualizado pela elegibilidade falhar no seu ORM/DB por estar bloqueado no ENUM original, 
-- a melhor prática local é fazer cast do novo output.
-- Tipicamente a coluna case_status é text. Caso o projeto use ENUM oficial:
-- ALTER TYPE case_status_enum ADD VALUE IF NOT EXISTS 'aprovado_automaticamente';
-- ALTER TYPE case_status_enum ADD VALUE IF NOT EXISTS 'rejeitado';
-- (Apenas descomente se case_status for um ENUM no seu PostgreSQL).
