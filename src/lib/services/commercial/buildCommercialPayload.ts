import { CommercialSummaryPayload, CoreCaseData, RiskScoringResult, ExecutiveSummaryResult } from '@/types/agents';

// Função Utilitária Interna para Resumo Limpo
export function buildCommercialSnapshotPayload(
  caseData: CoreCaseData,
  detailsRow: any,
  risk: RiskScoringResult,
  summaryText: ExecutiveSummaryResult,
  extractionData: any
): CommercialSummaryPayload {
  
  // Extração inteligente de variáveis (dependendo de Trabalhista ou Precatório)
  let val = 0;
  let entityStr = 'Não listado';

  if (caseData.asset_type === 'trabalhista') {
      val = extractionData.identified_value || 0;
      entityStr = extractionData.defendant_company || 'Desconhecida';
  } else {
      val = extractionData.estimated_face_value || 0;
      entityStr = extractionData.public_entity || 'Desconhecida';
  }

  // Se o valor extraído for zero, podemos espreitar o input manual primário do lead (se existir no 'detailsRow')
  if (val === 0 && detailsRow && detailsRow.estimated_value) {
      val = typeof detailsRow.estimated_value === 'number' ? detailsRow.estimated_value : 0;
  }

  // Constrói O Payload Estrito a enviar por Webhook ou guardar nos Logs Limpos
  return {
     lead_name: detailsRow?.full_name || 'Agile Cliente',
     asset_type: caseData.asset_type as any,
     value: val,
     priority_label: risk.classifications?.priority_label || 'indefinida',
     risk: risk.classifications?.legal_risk_level || 'indefinido',
     entity: entityStr,
     summary: summaryText.executive_summary_short || 'Sem sumário disponível',
     next_step: summaryText.recommended_next_action?.replace(/_/g, ' ') || 'contactar'
  };
}
