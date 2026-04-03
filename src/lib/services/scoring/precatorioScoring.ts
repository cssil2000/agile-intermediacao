import { 
  CoreCaseData, 
  PrecatorioExtractedFields, 
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
 * Motor Matemático de Scoring para Precatórios
 */
export function calculatePrecatorioScores(
  caseData: CoreCaseData,
  extractions: PrecatorioExtractedFields,
  eligibility: EligibilityResult
): { scores: ScoreBoard; classifications: ScoreClassifications; flags: string[] } {
  
  let legal = 70; // Partida conservadora
  let financial = 70;
  let commercial = 60;
  let docs = 50;
  
  const flags = new Set<string>(eligibility.flags);

  const val = extractions.estimated_face_value || 0;

  // --- 1. COMMERCIAL PRIORITY ---
  if (val >= THRESHOLDS.PRECATORIO.PREMIUM) {
      commercial = 100;
  } else if (val >= THRESHOLDS.PRECATORIO.PRIORITY) {
      commercial += 25; 
  } else if (val < THRESHOLDS.PRECATORIO.MIN) {
      commercial -= 40; 
  }

  if (flags.has('prioridade_ente_federal')) commercial += 15;
  if (flags.has('parceria_estrategica')) commercial = Math.max(commercial, 90);

  // --- 2. LEGAL SECURITY SCORE ---
  // Precatórios são dívidas publicamente reconhecidas, mas o risco reside na falha formal do documento.
  if (flags.has('fast_track_oficio_presente')) {
      legal += 20; // O Ofício sela a validade do crédito
  } else if (flags.has('revisao_risco_sem_oficio')) {
      legal -= 30; // Termos de acordo geram dúvidas se vão mesmo emitir o Ofício
  } else if (flags.has('ausencia_documentacao_base')) {
      legal = 10;
  }

  // --- 3. FINANCIAL SECURITY SCORE ---
  // Depende estritamente do devedor e do tempo de espera
  if (flags.has('prioridade_ente_federal')) {
      financial += 20; // União não falha sistamicamente
  } else if (flags.has('alerta_ente_municipal_evitar')) {
      financial -= 40; // Municípios atrasam decadas
  }

  if (flags.has('sweet_spot_prazo_2a3_anos')) {
      financial += 10;
  }

  // --- 4. DOCUMENTATION QUALITY SCORE ---
  if (flags.has('fast_track_oficio_presente')) {
      docs = 100;
  } else if (flags.has('revisao_risco_sem_oficio')) {
      docs = 40; // Tem sentença, mas falta a cereja
  } else if (flags.has('ausencia_documentacao_base')) {
      docs = 10;
  }

  // Limitar pontuações a 100/0
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  legal = clamp(legal);
  financial = clamp(financial);
  commercial = clamp(commercial);
  docs = clamp(docs);

  // --- OVERALL OPERATIONAL SCORE ---
  // Precatório: O Risco Financeiro do Ente domina a atratividade real da liquidez.
  const overall = (financial * 0.40) + (legal * 0.25) + (docs * 0.20) + (commercial * 0.15);

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
