import { PrecatorioExtractedFields, EligibilityStatus, EligibilityResult } from '@/types/agents';
import { detectPremiumValueFlags } from './sharedRules';

/**
 * Motor de Avaliação para Precatórios.
 */
export function evaluatePrecatorioEligibility(
  extractedData: PrecatorioExtractedFields, 
  documentTypes: string[]
): Omit<EligibilityResult, 'asset_type'> {
  
  const flags: string[] = [];
  let status: EligibilityStatus = 'revisao_humana';
  let reason = '';
  let nextAction = 'encaminhar_mesa_analise';
  let needs_human_review = true;

  const val = extractedData.estimated_face_value || 0;

  // 1. REGRAS DE VALOR MINIMO/MAXIMO
  if (val > 0 && val < 50000) {
      return {
          eligibility_status: 'rejeitado',
          primary_reason: 'Valor do crédito (R$ ' + val + ') muito abaixo do piso de Precatórios/RPVs (R$ 50 mil).',
          flags: ['valor_inviavel_rpv'],
          next_action: 'arquivar',
          needs_human_review: false
      };
  }

  if (val >= 100000) flags.push('prioridade_elevada_100k');
  
  const premiumFlags = detectPremiumValueFlags(val);
  flags.push(...premiumFlags);

  // 2. ENTE DEVEDOR / NATUREZA
  const entity = extractedData.public_entity?.toLowerCase() || '';
  if (entity.includes('municipal') || entity.includes('prefeitura') || entity.includes('município') || entity.includes('municipio')) {
      flags.push('alerta_ente_municipal_evitar');
  } else if (entity.includes('federal') || entity.includes('união') || entity.includes('uniao') || entity.includes('inss')) {
      flags.push('prioridade_ente_federal');
  }

  // 3. PRAZO DE PAGAMENTO
  if (extractedData.payment_year) {
      const atuais = new Date().getFullYear();
      const dif = extractedData.payment_year - atuais;
      if (dif >= 2 && dif <= 3) {
          flags.push('sweet_spot_prazo_2a3_anos');
      }
  }

  // 4. DOCUMENTAÇÃO E FAST-TRACK
  const hasOficio = documentTypes.some(d => d.includes('oficio_requisitorio') || d.includes('ofício requisitório'));
  const hasSentenca = documentTypes.some(d => d.includes('sentenca') || d.includes('sentença'));
  const hasAcordo = documentTypes.some(d => d.includes('acordo'));

  if (hasOficio) {
      status = 'aprovado_automaticamente';
      reason = 'Ofício Requisitório presente. Caso Fast-Tracked sem necessidade de revisão inicial do documento base.';
      flags.push('fast_track_oficio_presente');
      nextAction = 'encaminhar_desk_comercial';
      needs_human_review = false;
  } else if (!hasSentenca && !hasAcordo && !hasOficio) {
      status = 'pendente_documental';
      reason = 'Falta Documentação Essencial (Ausência de Ofício, Sentença ou Acordo).';
      flags.push('ausencia_documentacao_base');
      nextAction = 'solicitar_documentos';
      needs_human_review = true;
  } else {
      // Tem Sentença ou Acordo, mas não Ofício => Revisão Humana
      status = 'revisao_humana';
      reason = 'Ofício Requisitório ausente (Apenas providos Sentença/Acordo). Avaliação técnica do risco necessária.';
      flags.push('revisao_risco_sem_oficio');
      nextAction = 'encaminhar_mesa_analise';
      needs_human_review = true;
  }

  // Se Premium Value detetado, sobrepõe-se e avisa para prioridade máxima do workflow
  if (flags.includes('prioridade_maxima')) {
      nextAction = 'encaminhar_direto_socios_vip';
  }

  return {
      eligibility_status: status,
      primary_reason: reason,
      flags,
      next_action: nextAction,
      needs_human_review: needs_human_review
  };
}
