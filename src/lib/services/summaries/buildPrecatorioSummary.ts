import { 
  CoreCaseData, 
  PrecatorioExtractedFields, 
  EligibilityResult, 
  RiskScoringResult,
  ExecutiveSummaryResult,
  RecommendedNextAction
} from '@/types/agents';

function formatCurrency(val?: number): string {
  if (!val) return 'R$ (Pendente)';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
}

export function buildPrecatorioSummary(
  caseData: CoreCaseData,
  features: PrecatorioExtractedFields,
  eligibility: EligibilityResult,
  risk: RiskScoringResult
): Omit<ExecutiveSummaryResult, 'asset_type'> {
  
  const valString = formatCurrency(features.estimated_face_value);
  const ente = features.public_entity || 'Ente Desconhecido';
  const nature = features.credit_nature || 'Natureza Comum';
  
  // Analisa Sinais Vitais (Documentos e Ofício)
  const hasOficio = eligibility.flags?.includes('fast_track_oficio_presente');
  let docTone = 'ofício requisitório expedido';
  if (!hasOficio && eligibility.flags?.includes('revisao_risco_sem_oficio')) docTone = 'estando suportado apenas por sentença ou acordo mas sem ofício expedido';
  else if (!hasOficio) docTone = 'mas carece de documentação base sólida identificável pela inteligência artificial';

  // Recommendation Logic
  let nextAction: RecommendedNextAction = 'aguardar_validacao_humana';
  if (eligibility.eligibility_status === 'rejeitado') nextAction = 'rejeicao_provavel';
  if (eligibility.eligibility_status === 'revisao_humana') nextAction = 'encaminhar_para_revisao_humana';
  if (eligibility.eligibility_status === 'aprovado_automaticamente') nextAction = 'pronto_para_comercial';
  if (eligibility.eligibility_status === 'pendente_documental') nextAction = 'solicitar_documento_complementar';

  if (risk.classifications.commercial_priority_level === 'premium') nextAction = 'pronto_para_comercial';

  // Short Summary
  const priorityString = risk.classifications.priority_label || 'indefinida';
  const enteLabel = eligibility.flags.includes('alerta_ente_municipal_evitar') ? 'Municipal' : 
                    eligibility.flags.includes('prioridade_ente_federal') ? 'Federal' : 'Estadual';

  const shortText = `Precatório ${enteLabel} de ${nature.toLowerCase()} contra [${ente}], estimado em ${valString}. Detetado: ${docTone}. Classificação global na ordem de ${risk.scores?.overall_operational_score || 0}% e prioridade comercial da operação reportada como ${priorityString.toUpperCase()}.`;

  // Full Summary
  const enteTone = enteLabel === 'Municipal' ? 'Atenção aos recorrentes atrasos expectáveis na fila deste Ente Municipal.' : 
                   enteLabel === 'Federal' ? 'Altamente atrativo em termos de segurança de solvência no panorama de entes da União.' : '';

  const fullText = `A Agile Intermediação identificou no seu espetro base um ativo de natureza Precatória. Trata-se de uma dívida garantida por ${ente} enquadrada como ${nature}.\nO panorama documental apresenta-se como: ${docTone}, perfazendo a quantia primária cifrada na ordem de ${valString}.\n${enteTone}\nConsiderando o cenário, o caso tem aptidão Comercial [${priorityString.toUpperCase()}] registada matematicamente pelo Módulo Operacional e Risco Legal enquadrado num perfil [${risk.classifications.legal_risk_level.toUpperCase()}].`;

  // Attention Points
  const keys: string[] = [];
  keys.push(`Esfera do Devedor: ${enteLabel.toUpperCase()}`);
  if (hasOficio) keys.push('Ofício Requisitório presente nos anais documentais.');
  if (features.payment_year) keys.push(`Ano apontado para o Pagamento: ${features.payment_year}`);
  if (risk.scores?.documentation_quality_score < 40) keys.push('Qualidade documental débil assinalada!');

  return {
    executive_summary_short: shortText,
    executive_summary_full: fullText,
    recommended_next_action: nextAction,
    key_attention_points: keys,
    needs_human_review: eligibility.needs_human_review || risk.needs_human_review
  };
}
