import { LaborExtractedFields, EligibilityStatus, EligibilityResult } from '@/types/agents';
import { detectPremiumValueFlags } from './sharedRules';

/**
 * Motor de Avaliação para Créditos Trabalhistas.
 */
export function evaluateLaborEligibility(
  extractedData: LaborExtractedFields, 
  originalDocumentsCount: number
): Omit<EligibilityResult, 'asset_type'> {
  
  const flags: string[] = [];
  let status: EligibilityStatus = 'revisao_humana'; // Por defeito, Trabalhistas caem sempre em Revisão para Teses.
  let reason = '';
  let nextAction = 'revisao_humana_obrigatoria';

  const val = extractedData.identified_value || 0;

  // 1. REGRAS DE VALOR MINIMO/MAXIMO
  if (val > 0 && val < 30000) {
     return {
         eligibility_status: 'rejeitado',
         primary_reason: 'Valor do crédito (R$ ' + val + ') muito abaixo do piso viável (R$ 30 mil).',
         flags: ['valor_inviavel'],
         next_action: 'arquivar',
         needs_human_review: false
     };
  }

  if (val >= 100000) flags.push('prioridade_elevada');
  if (val >= 50000 && extractedData.has_acordao) flags.push('interesse_especial_ro');
  
  const premiumFlags = detectPremiumValueFlags(val);
  flags.push(...premiumFlags);

  // 2. REGRAS DE FASE PROCESSUAL E RECURSO
  // Apenas a partir do recurso. Se tiver apenas sentença -> rejeitado.
  // Se não tiver Acórdão lido nem Sentença, consideramos prematuro.
  const isPremature = !extractedData.has_acordao && !extractedData.has_sentence && !extractedData.has_execution_signals && (!extractedData.process_stage || extractedData.process_stage.toLowerCase().includes('conhecimento inicial'));
  
  if (isPremature) {
      return {
         eligibility_status: 'rejeitado',
         primary_reason: 'Processo em fase processual inicial precoce.',
         flags: ['fase_prematura'],
         next_action: 'arquivar',
         needs_human_review: false
      };
  }

  if (extractedData.has_sentence && !extractedData.has_acordao && !extractedData.has_execution_signals) {
     // Apenas Sentença de primeiro grau
     return {
        eligibility_status: 'rejeitado',
        primary_reason: 'Apenas Sentença de Primeiro Grau. Não aceitamos.',
        flags: ['apenas_sentenca_1_grau'],
        next_action: 'arquivar',
        needs_human_review: false
     };
  }

  // 3. DOCUMENTAÇÃO OBRIGATÓRIA
  // Acórdão no Tribunal como mínimo.
  if (!extractedData.has_acordao) {
      return {
          eligibility_status: 'pendente_documental',
          primary_reason: 'Falta o documento de Acórdão ou indícios do seu trâmite.',
          flags: ['ausencia_acordao', 'risco_documental'],
          next_action: 'solicitar_documentos',
          needs_human_review: true // Em trabalhista sem acordão é tendencialmente pendência
      };
  }

  // 4. POLO PASSIVO (Defendant) E TESES
  // "teses suspensas pelo STF" -> Esta info viria idealmente do Extrator (ex: leitura do Acórdão).
  // Vamos simular a existência dessa flag caso o extrator consiga capturar as palavras.
  if (extractedData.relevant_movements_summary?.toLowerCase().includes('tese suspensa') || 
      extractedData.relevant_movements_summary?.toLowerCase().includes('repercussão geral stf susp')) {
       return {
          eligibility_status: 'rejeitado',
          primary_reason: 'Identificado bloqueio por tese suspensa no STF.',
          flags: ['tese_stf_suspensa'],
          next_action: 'arquivar',
          needs_human_review: false
       };
  }

  // Flag de Risco Empresarial
  const defendant = extractedData.defendant_company?.toLowerCase() || '';
  if (defendant.includes('recuperacao judicial') || defendant.includes('falencia') || defendant.includes('massa falida')) {
      flags.push('risco_recuperacao_judicial_falencia');
      // Não damos auto-rejeito mas avisa fortemente
  }

  if (defendant.includes('sa') || defendant.includes('s.a') || defendant.includes('ltda')) {
      flags.push('perfil_empresa_potencial');
  }

  if (extractedData.relevant_movements_summary?.toLowerCase().includes('desconsideração da personalidade jurídica')) {
      flags.push('risco_dpj_encontrada');
  }

  // 5. FECHO
  // Trabalhistas nunca são "aprovados_automaticamente" por regra devido à:
  // "Revisão humana obrigatória em trabalhista: verificação de teses, verificação de valores"
  flags.push('revisao_tese_obrigatoria', 'revisao_valor_obrigatoria');
  
  status = 'revisao_humana';
  reason = 'Critérios Base cumpridos. Exige obrigatoriamente validação Humana Analítica de Teses e Valores aferidos.';
  nextAction = 'encaminhar_mesa_analise';

  return {
    eligibility_status: status,
    primary_reason: reason,
    flags,
    next_action: nextAction,
    needs_human_review: true
  };
}
