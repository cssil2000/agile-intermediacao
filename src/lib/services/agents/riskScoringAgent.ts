import { supabase } from '@/lib/supabase';
import { getCaseWithDetails } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { RiskScoringAgentOutput, RiskScoringResult, EligibilityResult, RerunMetadata } from '@/types/agents';
import { calculateLaborScores } from '../scoring/laborScoring';
import { calculatePrecatorioScores } from '../scoring/precatorioScoring';

/**
 * Agente Mestre de Risco e Scoring
 * Transforma dados do caso em avaliação operacional quantificável 0-100.
 */
export async function runRiskScoringAgent(caseId: string, rerunMetadata?: RerunMetadata): Promise<RiskScoringAgentOutput> {
  const agentName = 'risk_scoring_agent';
  
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
    // 1. Fetch de Dados da BD (Case)
    const { data: caseData, error: caseError } = await getCaseWithDetails(caseId);
    if (caseError || !caseData) {
        return buildErrorResponse(caseId, agentName, 'Falha ao recuperar dados do caso no Supabase.', runId);
    }

    // 2. Fetch Extrações Recentes
    const { data: latestExtraction } = await supabase
       .from('case_extractions')
       .select('extracted_fields')
       .eq('case_id', caseId)
       .order('created_at', { ascending: false })
       .limit(1)
       .single();

    const extractedData = latestExtraction ? latestExtraction.extracted_fields : {};

    // 3. Fake Mapeamento da Elegibilidade (Visto que gravamos diretamente no `cases`, vamos simular o formato de input)
    // Num sistema unificado, o pipeline passa no Orchestrator a estrutura em memória.
    const eligibilityMem: EligibilityResult = {
        asset_type: caseData.asset_type as any,
        eligibility_status: (caseData as any).eligibility_status || 'revisao_humana',
        primary_reason: (caseData as any).eligibility_reason || '',
        flags: (caseData as any).eligibility_flags || [],
        next_action: '',
        needs_human_review: (caseData as any).needs_human_review || false
    };

    let resultPayload: any;

    // 4. Delegação Matemática
    if (caseData.asset_type === 'trabalhista') {
         resultPayload = calculateLaborScores(caseData as any, extractedData as any, eligibilityMem);
    } else if (caseData.asset_type === 'precatorio') {
         resultPayload = calculatePrecatorioScores(caseData as any, extractedData as any, eligibilityMem);
    } else {
         return buildErrorResponse(caseId, agentName, `Asset type incompátivel para Scoring: ${caseData.asset_type}`, runId);
    }

    const { scores, classifications, flags } = resultPayload;

    // Constroi o Sumário Textual Explicativo para Humanos
    const risk_summary = `O caso demonstra Segurança Jurídica ${classifications.legal_risk_level.toUpperCase()} (Score: ${scores.legal_risk_score}/100) e Qualidade Documental ${classifications.documentation_quality_level.toUpperCase()} (${scores.documentation_quality_score}/100). Operacionalmente atinge uma valia Global de ${scores.overall_operational_score}/100.`;

    const fullResult: RiskScoringResult = {
        asset_type: caseData.asset_type as any,
        scores,
        classifications,
        risk_summary,
        flags,
        needs_human_review: eligibilityMem.needs_human_review || scores.overall_operational_score < 50
    };

    const finalOutput: RiskScoringAgentOutput = {
       agent_name: agentName,
       case_id: caseId,
       status: 'success',
       result: fullResult,
       warnings: []
    };

    // 5. Persistência na Mega Tabela Independente de Scoring `risk_scores`
    const { error: dbUpdateError } = await supabase
        .from('risk_scores')
        .insert({
            case_id: caseId,
            asset_type: caseData.asset_type,
            
            legal_risk_score: scores.legal_risk_score,
            financial_risk_score: scores.financial_risk_score,
            commercial_priority_score: scores.commercial_priority_score,
            documentation_quality_score: scores.documentation_quality_score,
            overall_operational_score: scores.overall_operational_score,

            legal_risk_level: classifications.legal_risk_level,
            financial_risk_level: classifications.financial_risk_level,
            commercial_priority_level: classifications.commercial_priority_level,
            documentation_quality_level: classifications.documentation_quality_level,
            priority_label: classifications.priority_label,
            
            risk_summary: risk_summary,
            flags: flags,
            confidence: 'alta'
        });

    if (dbUpdateError) {
        console.error('[RiskScoringAgent] Erro ao gravar tabela risk_scores:', dbUpdateError);
        finalOutput.warnings.push('Falhou ao arquivar pontuações na BD. Correste a migration SQL de risk_scores?');
    }

    // 6. Auditoria Padrão Workflow
    await createActivityLog(
        caseId,
        'risk_scoring_executado',
        `Score Global Operacional esticado em ${scores.overall_operational_score}/100. Prioridade etiquetada como ${classifications.priority_label.toUpperCase()}.`,
        'sistema'
    );

    if (runId) {
        await updateAgentRun(runId, {
            outputPayload: finalOutput,
            status: 'success'
        });
    }

    return finalOutput;

  } catch (err: any) {
    console.error(`[RiskScoringAgent] Fogo interno no caso ${caseId}:`, err);
    return buildErrorResponse(caseId, agentName, `Engine falhou: ${err.message}`, runId);
  }
}

function buildErrorResponse(caseId: string, agentName: string, message: string, runId: string | null): RiskScoringAgentOutput {
  const errorResp: RiskScoringAgentOutput = {
    agent_name: agentName,
    case_id: caseId,
    status: 'erro_interno',
    result: {
      asset_type: 'trabalhista', 
      scores: {
         legal_risk_score: 0,
         financial_risk_score: 0,
         commercial_priority_score: 0,
         documentation_quality_score: 0,
         overall_operational_score: 0
      },
      classifications: {
          legal_risk_level: 'baixo',
          financial_risk_level: 'baixo',
          commercial_priority_level: 'baixa',
          documentation_quality_level: 'baixo',
          priority_label: 'baixa'
      },
      risk_summary: 'Avaliação impossibilitada devido a quebra sistémica.',
      flags: ['erro_engine_scoring'],
      needs_human_review: true
    },
    warnings: [message]
  };

  if (runId) updateAgentRun(runId, { outputPayload: errorResp, status: 'error', errorMessage: message });
  return errorResp;
}
