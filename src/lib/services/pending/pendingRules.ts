import { PendingType, PendingRecoveryAction } from '@/types/agents';

export function evaluatePendingStatus(
  statusString: string, 
  flags: string[], 
  assetType: string, 
  value: number
): {
  type: PendingType;
  items: string[];
  worth: 'alto' | 'baixo' | 'nulo';
  action: PendingRecoveryAction;
} {
  let type: PendingType = 'nenhuma';
  const items: string[] = [];
  let action: PendingRecoveryAction = 'ignorar_nao_pendente';
  
  if (statusString !== 'pendente_documental') {
      return { type, items, worth: 'nulo', action };
  }

  // 1. Determina Itens em Falta pelas Flags da Elegibilidade
  if (assetType === 'precatorio' && flags.includes('revisao_risco_sem_oficio')) {
      type = 'falha_oficio';
      items.push('Cópia do Ofício Requisitório');
  } 
  else if (assetType === 'trabalhista' && flags.includes('escaninho_sem_acordao')) {
      type = 'falha_acordao';
      items.push('Cópia Integral do Acórdão');
  }
  else if (flags.includes('ausencia_documentacao_base')) {
      type = 'documentacao_ausente_geral';
      items.push('Processo Integral (Capa a Capa)');
      items.push('Documento de Identificação Pessoal');
  } else {
      type = 'valor_inconclusivo';
      items.push('Matriz de Cálculo do Crédito / Sentença de Liquidação');
  }

  // 2. Determina ROI / "Worth"
  let worth: 'alto' | 'baixo' | 'nulo' = 'baixo';
  if (value >= 150000) worth = 'alto';
  else if (value < 20000) worth = 'nulo';

  // 3. Determina Canal / Recomendação
  if (worth === 'nulo') {
      action = 'ignorar_baixo_valor';
  } else if (worth === 'alto') {
      action = 'disparar_whatsapp'; // Lead quente e de alto impacto -> Push
  } else {
      action = 'enviar_email'; // Valor razoável -> Abordagem conservadora assíncrona
  }

  return { type, items, worth, action };
}
