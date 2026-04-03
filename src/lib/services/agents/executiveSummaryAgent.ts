import { supabase } from '@/lib/supabase';
import { getCaseWithDetails } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { ExecutiveSummaryAgentOutput, EligibilityResult, RerunMetadata } from '@/types/agents';
import { buildLaborSummary } from '../summaries/buildLaborSummary';
import { buildPrecatorioSummary } from '../summaries/buildPrecatorioSummary';

/**
 * Agente de Resumo Executivo
 * Traduz as matrizes quantitativas operacionais em relatórios acionáveis de 10 segundos.
 */
export async function runExecutiveSummaryAgent(caseId: string, rerunMetadata?: RerunMetadata): Promise<ExecutiveSummaryAgentOutput> {
  const agentName = 'executive_summary_agent';
  
  const runId = await recordAgentRun({
    caseId,
    agentName,
    inputPayload: { caseId, rerunMetadata },
    status: 'processing',
    triggerType: rerunMetadata?.triggerType,
    rerunReason: rerunMetadata?.rerunReason,
    triggeredByEmail: rerunMetadata?.triggeredByEmail
  });

  try {
    // 1. DADOS SUPERIORES: CASE
    const { data: caseData, error: caseError } = await getCaseWithDetails(caseId);
    if (caseError || !caseData) {
        return buildErrorResponse(caseId, agentName, 'Acesso comprometido aos dados core do Caso.', runId);
    }

    // 2. EXTRAÇÕES (Para detalhes Factuais)
    const { data: latestExtraction } = await supabase
       .from('case_extractions')
       .select('extracted_fields')
       .eq('case_id', caseId)
       .order('created_at', { ascending: false })
       .limit(1)
       .single();
    const extractedData = latestExtraction ? latestExtraction.extracted_fields : {};

    // 3. ELEGIBILIDADE (Para Flags Críticos)
    const eligibilityMem: EligibilityResult = {
        asset_type: caseData.asset_type as any,
        eligibility_status: (caseData as any).eligibility_status || 'pendente_documental',
        primary_reason: (caseData as any).eligibility_reason || '',
        flags: (caseData as any).eligibility_flags || [],
        next_action: '',
        needs_human_review: (caseData as any).needs_human_review || false
    };

    // 4. SCORINGS (Para as notas matemáticas exatas)
    const { data: riskRecord } = await supabase
       .from('risk_scores')
       .select('*')
       .eq('case_id', caseId)
       .order('created_at', { ascending: false })
       .limit(1)
       .single();

    if (!riskRecord) {
       console.warn(`[SummaryAgent] Risk Scores inexistentes para caso ${caseId}. Fallback to zero.`);
    }

    const riskMem = riskRecord ? {
        scores: {
           legal_risk_score: riskRecord.legal_risk_score,
           financial_risk_score: riskRecord.financial_risk_score,
           commercial_priority_score: riskRecord.commercial_priority_score,
           documentation_quality_score: riskRecord.documentation_quality_score,
           overall_operational_score: riskRecord.overall_operational_score
        },
        classifications: {
           legal_risk_level: riskRecord.legal_risk_level,
           financial_risk_level: riskRecord.financial_risk_level,
           commercial_priority_level: riskRecord.commercial_priority_level,
           documentation_quality_level: riskRecord.documentation_quality_level,
           priority_label: riskRecord.priority_label
        },
        flags: riskRecord.flags || [],
        risk_summary: riskRecord.risk_summary,
        needs_human_review: false
    } : { scores: {}, classifications: {}, flags: [] };

    // 5. Motor de Síntese
    let partialResult: any;

    if (caseData.asset_type === 'trabalhista') {
        partialResult = buildLaborSummary(caseData as any, extractedData as any, eligibilityMem, riskMem as any);
    } else if (caseData.asset_type === 'precatorio') {
        partialResult = buildPrecatorioSummary(caseData as any, extractedData as any, eligibilityMem, riskMem as any);
    } else {
        return buildErrorResponse(caseId, agentName, `Formato do ativo não decifrável pelo Agente Resumo: ${caseData.asset_type}`, runId);
    }

    const finalOutput: ExecutiveSummaryAgentOutput = {
       agent_name: agentName,
       case_id: caseId,
       status: 'success',
       result: {
           asset_type: caseData.asset_type as any,
           ...partialResult
       },
       warnings: []
    };

    // 6. SQL INSERT na tabela `case_summaries`
    const { error: dbUpdateError } = await supabase
        .from('case_summaries')
        .insert({
            case_id: caseId,
            agent_name: agentName,
            executive_summary_short: partialResult.executive_summary_short,
            executive_summary_full: partialResult.executive_summary_full,
            recommended_next_action: partialResult.recommended_next_action,
            key_attention_points: partialResult.key_attention_points,
            confidence: 'alta'
        });

    if (dbUpdateError) {
        console.error('[SummaryAgent] Erro na SQL case_summaries:', dbUpdateError);
        finalOutput.warnings.push('Resumo gerado, mas ocorreu erro de SQL a gravar na tabela case_summaries.');
    }

    // 7. Auditoria Activity
    await createActivityLog(
        caseId,
        'resumo_executivo_gerado',
        `Resumo executivo finalizado. Acção de Destino Operacional Recomendada: "${partialResult.recommended_next_action.replace(/_/g, ' ').toUpperCase()}".`,
        'sistema'
    );

    if (runId) updateAgentRun(runId, { outputPayload: finalOutput, status: 'success' });

    return finalOutput;

  } catch (err: any) {
    console.error(`[SummaryAgent] Colapso Interno ${caseId}:`, err);
    return buildErrorResponse(caseId, agentName, `Erro: ${err.message}`, runId);
  }
}

function buildErrorResponse(caseId: string, agentName: string, message: string, runId: string | null): ExecutiveSummaryAgentOutput {
  const errorResp: ExecutiveSummaryAgentOutput = {
    agent_name: agentName,
    case_id: caseId,
    status: 'erro_interno',
    result: {
      asset_type: 'trabalhista', 
      executive_summary_short: 'Acesso bloqueado por falha técnica.',
      executive_summary_full: 'Sistema não reuniu recursos para formular texto. Exigido verificação TI.',
      recommended_next_action: 'aguardar_validacao_humana',
      key_attention_points: ['Erro Interno do Engine de Resumo'],
      needs_human_review: true
    },
    warnings: [message]
  };

  if (runId) updateAgentRun(runId, { outputPayload: errorResp, status: 'error', errorMessage: message });
  return errorResp;
}
