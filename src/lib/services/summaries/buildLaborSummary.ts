import { 
  CoreCaseData, 
  LaborExtractedFields, 
  EligibilityResult, 
  RiskScoringResult,
  ExecutiveSummaryResult,
  RecommendedNextAction
} from '@/types/agents';

function formatCurrency(val?: number): string {
  if (!val) return 'R$ (Sob Consulta)';
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  return formatter.format(val);
}

export function buildLaborSummary(
  caseData: CoreCaseData,
  features: LaborExtractedFields,
  eligibility: EligibilityResult,
  risk: RiskScoringResult
): Omit<ExecutiveSummaryResult, 'asset_type'> {
  
  const valString = formatCurrency(features.identified_value);
  const phase = features.process_stage || 'Fase Processual Pendente';
  const hasAcordao = features.has_acordao ? 'com Acórdão expedido' : 'onde a documentação base principal é inconsistente/ausente';
  const empresa = features.defendant_company || 'entidade não especificada';

  // Analisa Sinais Vitais
  let companyTone = 'O polo alvo não suscita alarmes imediatos na matriz superficial';
  if (eligibility.flags?.includes('perfil_empresa_potencial')) companyTone = 'O devedor detém sinais fortes de atratividade (Empresa Consolidada/Multinacional)';
  if (eligibility.flags?.includes('risco_recuperacao_judicial_falencia')) companyTone = 'Há indícios críticos de insolvência ou Recuperação Judicial no polo alvo';

  // Recommendation Logic
  let nextAction: RecommendedNextAction = 'aguardar_validacao_humana';
  if (eligibility.eligibility_status === 'rejeitado') nextAction = 'rejeicao_provavel';
  if (eligibility.eligibility_status === 'revisao_humana') nextAction = 'encaminhar_para_revisao_humana';
  if (eligibility.eligibility_status === 'aprovado_automaticamente') nextAction = 'pronto_para_comercial';
  if (eligibility.eligibility_status === 'pendente_documental') nextAction = 'solicitar_documento_complementar';

  if (risk.flags?.includes('tese_stf_suspensa')) nextAction = 'rejeicao_provavel';

  // Short Summary
  const priorityString = risk.classifications?.priority_label || 'indefinida';
  const shortText = `Processo Trabalhista de ${valString}, alocado em [${phase}]. Apresenta-se ${hasAcordao} em favor da operação. Empresa alvo: ${empresa}. Score Global: ${risk.scores?.overall_operational_score || 0}/100. Prioridade etiquetada como ${priorityString.toUpperCase()}.`;

  // Full Summary
  const fullText = `A Agile Intermediação acusa uma oportunidade de antecipação Trabalhista contra [${empresa}], balizada presentemente em ${valString}. \nA operação encontra-se matriculada em [${phase}], ${hasAcordao}. ${companyTone}. \nMatematicamente o Agente de Scoring determinou uma Segurança Jurídica ${risk.classifications?.legal_risk_level?.toUpperCase()} e viabilidade Comercial ${priorityString.toUpperCase()}.`;

  // Attention Points
  const keys: string[] = [];
  if (features.identified_value && features.identified_value > 100000) keys.push('Ativo de Valor Relevante');
  if (features.has_acordao) keys.push('Acórdão atestado nos registos extraídos');
  if (eligibility.flags?.includes('risco_dpj_encontrada')) keys.push('Desconsideração de Personalidade Jurídica');
  if (eligibility.needs_human_review || nextAction === 'encaminhar_para_revisao_humana') keys.push('Revisão Analítica requerida perante Matrizes base');

  return {
    executive_summary_short: shortText,
    executive_summary_full: fullText,
    recommended_next_action: nextAction,
    key_attention_points: keys,
    needs_human_review: eligibility.needs_human_review || risk.needs_human_review
  };
}
