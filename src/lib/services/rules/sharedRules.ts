import { CoreCaseData } from '@/types/agents';

/**
 * sharedRules.ts
 * Regras Transversais de Elegibilidade suportadas por ambos os ativos (Trabalhista e Precatórios).
 */

const PREMIUM_THRESHOLD = 3000000; // R$ 3.000.000

export function detectPremiumValueFlags(estimatedValue: number | undefined): string[] {
  const flags: string[] = [];
  if (estimatedValue && estimatedValue >= PREMIUM_THRESHOLD) {
    flags.push('premium_valor_extremo');
    flags.push('prioridade_maxima');
  }
  return flags;
}

/**
 * Avalia se o caso contém sinais de Parceria Estratégica (Advogados de Volume).
 * O utilizador instruiu que: "exceções estratégicas nunca devem ser aprovadas automaticamente
 * devem ser marcadas para decisão dos sócios".
 */
export function isStrategicException(caseData: CoreCaseData, extractedData: any): boolean {
  // Lógica fictícia expansível: ver se o lead tem email com domínio de mega escritório
  // ou se declarou ser advogado repetente.
  const isLawyerEmail = caseData.leads?.email?.includes('advogado') || caseData.leads?.email?.includes('adv.br');
  
  // Ou se o parser já detetou o campo lawyer_name e se trata de um advogado vip (baseado em BD futura)
  const isVipLawyer = extractedData?.lawyer_name?.toLowerCase().includes('partner');

  return !!(isLawyerEmail || isVipLawyer);
}

export function buildStrategicExceptionResponse(assetType: any): any {
  return {
    eligibility_status: 'revisao_humana',
    primary_reason: 'Caso oriundo de Parceria Estratégica / Advogado VIP. Encaminhar para decisão da diretoria.',
    flags: ['parceria_estrategica', 'revisao_socios'],
    next_action: 'escalar_diretoria',
    needs_human_review: true
  };
}
