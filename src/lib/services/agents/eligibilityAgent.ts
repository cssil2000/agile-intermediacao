import { supabase } from '@/lib/supabase';
import { getCaseWithDetails } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { EligibilityAgentOutput, EligibilityResult, CoreCaseData, RerunMetadata } from '@/types/agents';
import { evaluateLaborEligibility } from '../rules/laborEligibilityRules';
import { evaluatePrecatorioEligibility } from '../rules/precatorioEligibilityRules';
import { isStrategicException, buildStrategicExceptionResponse } from '../rules/sharedRules';

/**
 * Agente Mestre de Elegibilidade
 * Aplica a Matriz Real Operacional da Empresa.
 */
export async function runEligibilityAgent(caseId: string, rerunMetadata?: RerunMetadata): Promise<EligibilityAgentOutput> {
  const agentName = 'eligibility_agent';
  
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
    // 1. Fetch de Dados Consolidados na BD
    const { data: caseData, error } = await getCaseWithDetails(caseId);
    if (error || !caseData) {
        return buildErrorResponse(caseId, agentName, 'Falha ao recuperar dados do caso no Supabase.', runId);
    }

    // Procura o melhor JSON de extração existente (o mais recente de alta confiança idealmente, ou o único disponível)
    const { data: latestExtraction } = await supabase
       .from('case_extractions')
       .select('extracted_fields')
       .eq('case_id', caseId)
       .order('created_at', { ascending: false })
       .limit(1)
       .single();

    const extractedData = latestExtraction ? latestExtraction.extracted_fields : {};

    // 2. Extrai os tipos dos Documentos Base 
    // Usado pela regra do Precatório (precisa especificamente de Oficio_Requisitorio)
    const docTypes = caseData.documents ? caseData.documents.map(d => d.document_type.toLowerCase()) : [];

    let result: Omit<EligibilityResult, 'asset_type'>;

    // 3. Aplicação Universal: Exceções Estratégicas (Ex: Advogados VIP)
    if (isStrategicException(caseData as any, extractedData)) {
         result = buildStrategicExceptionResponse(caseData.asset_type);
    } 
    // 4. Aplicação das Regras de Negócio Dirigidas
    else if (caseData.asset_type === 'trabalhista') {
         // Passa o extrato como o Extrator Trabalhista o gravou
         result = evaluateLaborEligibility(extractedData as any, docTypes.length);
    } else if (caseData.asset_type === 'precatorio') {
         result = evaluatePrecatorioEligibility(extractedData as any, docTypes);
    } else {
         return buildErrorResponse(caseId, agentName, `Asset type não elegível/desconhecido: ${caseData.asset_type}`, runId);
    }

    const fullResult: EligibilityResult = {
        asset_type: caseData.asset_type as any,
        ...result
    };

    const finalOutput: EligibilityAgentOutput = {
       agent_name: agentName,
       case_id: caseId,
       status: 'success',
       result: fullResult,
       warnings: []
    };

    // 5. Persistência de Estado Oficial no `cases` Table
    // Grava as definições da máquina
    const updateSchema = {
       eligibility_status: fullResult.eligibility_status,
       eligibility_reason: fullResult.primary_reason,
       eligibility_flags: fullResult.flags,
       needs_human_review: fullResult.needs_human_review,
       case_status: getGlobalStatusFromEligibility(fullResult.eligibility_status, caseData.case_status)
    };

    const { error: dbUpdateError } = await supabase
        .from('cases')
        .update(updateSchema)
        .eq('id', caseId);

    if (dbUpdateError) {
        console.error('[EligibilityAgent] Erro a atualizar o status da DB:', dbUpdateError);
        finalOutput.warnings.push('Decisão tomada, mas falhou ao gravar campos na base de dados relacional. Pode precisar atualizar a migration.');
    }

    // 6. Registos de Auditoria
    await createActivityLog(
        caseId,
        'elegibilidade_executada',
        `Avaliado como: ${fullResult.eligibility_status}. Ação seguinte: ${fullResult.next_action}`,
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
    console.error(`[EligibilityAgent] Erro no caso ${caseId}:`, err);
    return buildErrorResponse(caseId, agentName, `Falha interna excecional: ${err.message}`, runId);
  }
}

// Helper: Mapeia o estado de elegibilidade da máquina para o estado macroscópico da tabela original do sistema (case_status)
function getGlobalStatusFromEligibility(eligibilityStatus: string, currentStatus: string) {
    // Se o user quiser, este mapper poderá alinhar as linguagens do funil Kanban deles
    if (eligibilityStatus === 'rejeitado') return 'rejeitado';
    if (eligibilityStatus === 'aprovado_automaticamente') return 'aprovado'; // ou algo como triagem_aprovada
    if (eligibilityStatus === 'pendente_documental') return 'pendente_documental';
    if (eligibilityStatus === 'revisao_humana') return 'revisao_humana';
    
    return currentStatus; // Mantém fallback
}

function buildErrorResponse(caseId: string, agentName: string, message: string, runId: string | null): EligibilityAgentOutput {
  const errorResp: EligibilityAgentOutput = {
    agent_name: agentName,
    case_id: caseId,
    status: 'erro_interno',
    result: {
      asset_type: 'trabalhista', 
      eligibility_status: 'revisao_humana', // fallback passivo seguro
      primary_reason: 'Erro sistêmico forçou revisão humana.',
      flags: ['erro_interno_forca_revisao'],
      next_action: 'revisao_ti',
      needs_human_review: true
    },
    warnings: [message]
  };

  if (runId) {
    updateAgentRun(runId, {
      outputPayload: errorResp,
      status: 'error',
      errorMessage: message
    });
  }

  return errorResp;
}
