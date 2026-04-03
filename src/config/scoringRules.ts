/**
 * Configurações Centrais do Motor de Scoring.
 * Permite afinação da máquina pelo negócio sem refatoração pesada.
 */

export const SCORING_WEIGHTS = {
  VALOR: 5,
  FASE_PROCESSUAL: 5,
  SOLVENCIA_REU: 5,
  DOCUMENTACAO: 5,
  POTENCIAL_VOLUME: 5,
  RELACIONAMENTO_ADVOGADO: 3,
  TIPO_LEAD: 2,
  TRIBUNAL_ORIGEM: 2,
  PREVISIBILIDADE_PAGAMENTO: 1,
  NATUREZA_CREDITO: 1
};

export const THRESHOLDS = {
  TRABALHISTA: {
    MIN: 30000,
    PRIORITY: 100000,
    PREMIUM: 500000,
  },
  PRECATORIO: {
    MIN: 50000,
    PRIORITY: 100000,
    PREMIUM: 3000000,
  }
};

/**
 * Normaliza os Scores para Níveis Textuais
 */
export function classifyScoreAsLevel(score: number): 'baixo' | 'medio' | 'alto' {
  if (score < 45) return 'baixo';
  if (score < 75) return 'medio';
  return 'alto';
}

/**
 * Normaliza Scores Específicos Prioritários para Labels Textuais
 */
export function classifyPriorityAsLevel(score: number): 'baixa' | 'media' | 'alta' | 'premium' {
  if (score < 40) return 'baixa';
  if (score < 70) return 'media';
  if (score < 90) return 'alta';
  return 'premium';
}

/**
 * Calcula a soma dos Pesos Totais
 */
export const TOTAL_WEIGHT = Object.values(SCORING_WEIGHTS).reduce((acc, curr) => acc + curr, 0);
