import { 
  CoreCaseData, 
  LaborExtractedFields, 
  EligibilityResult, 
  ScoreBoard, 
  ScoreClassifications 
} from '@/types/agents';
import { 
  THRESHOLDS, 
  classifyScoreAsLevel, 
  classifyPriorityAsLevel 
} from '@/config/scoringRules';

/**
 * Motor Matemático de Scoring para Casos Trabalhistas
 */
export function calculateLaborScores(
  caseData: CoreCaseData,
  extractions: LaborExtractedFields,
  eligibility: EligibilityResult
): { scores: ScoreBoard; classifications: ScoreClassifications; flags: string[] } {
  
  let legal = 80;     // Base inicial razoável para Trabalhista
  let financial = 70; // Sensível
  let commercial = 50; 
  let docs = 50;
  
  const flags = new Set<string>(eligibility.flags);

  const val = extractions.identified_value || 0;

  // --- 1. COMMERCIAL PRIORITY (Valor + Volume) ---
  if (val >= THRESHOLDS.TRABALHISTA.PREMIUM) {
      commercial = 100;
  } else if (val >= THRESHOLDS.TRABALHISTA.PRIORITY) {
      commercial += 30; // ex: 80
  } else if (val < THRESHOLDS.TRABALHISTA.MIN) {
      commercial -= 30; // ex: 20
  } else {
      commercial += 15; // standard
  }

  // Advogado / Parceiro melhora prioridade
  if (flags.has('parceria_estrategica')) commercial = Math.max(commercial, 95);

  // --- 2. LEGAL SECURITY SCORE (Quão certo o direito está) ---
  // A partir do recurso = bom. Só sentença = arriscado. Tese suspensa = Fatal.
  if (flags.has('tese_stf_suspensa')) {
      legal = 10;
  } else if (flags.has('apenas_sentenca_1_grau') || flags.has('fase_prematura')) {
      legal -= 40;
  } else if (extractions.has_acordao) {
      legal += 15; 
  }

  // --- 3. FINANCIAL SECURITY SCORE (Solvência) ---
  if (flags.has('risco_recuperacao_judicial_falencia')) {
      financial = 20; // Risco de perda total
  } else if (flags.has('perfil_empresa_potencial')) {
      financial += 20; // SA, LTDA multinacional..
  }

  if (flags.has('risco_dpj_encontrada')) {
      financial -= 30; // A desconsideração prova que a empresa original não tem fundos
      legal -= 20; // Torna o processo super incerto
  }

  // --- 4. DOCUMENTATION QUALITY SCORE ---
  if (extractions.has_acordao) {
      docs += 40;
  }
  if (extractions.has_execution_signals) {
      docs += 10;
  }
  if (flags.has('ausencia_acordao') || flags.has('risco_documental')) {
      docs -= 30;
  }

  // Limitar pontuações a 100/0
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  legal = clamp(legal);
  financial = clamp(financial);
  commercial = clamp(commercial);
  docs = clamp(docs);

  // --- OVERALL OPERATIONAL SCORE ---
  // Trabalhista: A Solvência e Segurança Jurídica têm pesos astronómicos na vida real.
  const overall = (legal * 0.35) + (financial * 0.30) + (commercial * 0.20) + (docs * 0.15);

  const scores: ScoreBoard = {
      legal_risk_score: Math.round(legal),
      financial_risk_score: Math.round(financial),
      commercial_priority_score: Math.round(commercial),
      documentation_quality_score: Math.round(docs),
      overall_operational_score: Math.round(overall)
  };

  const classifications: ScoreClassifications = {
      legal_risk_level: classifyScoreAsLevel(scores.legal_risk_score),
      financial_risk_level: classifyScoreAsLevel(scores.financial_risk_score),
      commercial_priority_level: classifyPriorityAsLevel(scores.commercial_priority_score),
      documentation_quality_level: classifyScoreAsLevel(scores.documentation_quality_score),
      priority_label: classifyPriorityAsLevel(scores.commercial_priority_score)
  };

  return { scores, classifications, flags: Array.from(flags) };
}
