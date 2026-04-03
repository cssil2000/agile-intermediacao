import { getCaseWithDetails, updateCaseStatus } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { CoreCaseData, OrchestratorOutput, OrchestratorStatus, PipelineType } from '@/types/agents';

/**
 * Ponto de entrada do Orquestrador Central.
 * Coordena o fluxo macro da oportunidade.
 */
export async function runOrchestrator(caseId: string): Promise<OrchestratorOutput> {
  // 1. Inicia o registo de execução do agente (Orquestrador)
  const runId = await recordAgentRun({
    caseId,
    agentName: 'orchestrator_central',
    inputPayload: { caseId },
    status: 'processing'
  });

  try {
    // 2. Busca os dados do caso e contextos associados
    const { data: caseData, error: caseError } = await getCaseWithDetails(caseId);

    if (caseError || !caseData) {
      return buildErrorResponse(caseId, 'erro_interno', 'Falha ao buscar dados do caso no Supabase.', runId);
    }

    const { asset_type } = caseData;
    let result: Partial<OrchestratorOutput> = {};

    // 3. Avalia com base no tipo de ativo
    if (asset_type === 'trabalhista') {
      result = evaluateTrabalhista(caseData);
    } else if (asset_type === 'precatorio') {
      result = evaluatePrecatorio(caseData);
    } else {
      return buildErrorResponse(caseId, 'erro_interno', `Tipo de ativo desconhecido: ${asset_type}`, runId);
    }

    // 4. Monta a resposta final
    const finalResponse: OrchestratorOutput = {
      case_id: caseId,
      asset_type,
      pipeline_selected: result.pipeline_selected,
      status: result.status as OrchestratorStatus,
      next_steps: result.next_steps || [],
      missing_data: result.missing_data || [],
      needs_human_review: result.needs_human_review || false,
      log_message: result.log_message || 'Orquestração concluída com sucesso.'
    };

    // 5. Atualiza o status do banco de dados de acordo com a decisão
    // Apenas atualiza se o status for diferente do atual ou se houver forte justificativa do orquestrador
    const newDbStatus = mapOrchestratorStatusToDbStatus(finalResponse.status, caseData.case_status);
    if (newDbStatus !== caseData.case_status) {
       await updateCaseStatus(caseId, newDbStatus);
    }

    // 6. Regista em Activity Logs para histórico de negócio
    await createActivityLog(
      caseId, 
      'orchestrator_run', 
      `Orquestrador executado: ${finalResponse.log_message} (Status: ${finalResponse.status})`,
      'sistema'
    );

    // 7. Salva a resposta estruturada para auditoria técnica
    if (runId) {
      await updateAgentRun(runId, {
        outputPayload: finalResponse,
        status: finalResponse.needs_human_review ? 'success' : 'success' // Always success if we handled it safely
      });
    }

    return finalResponse;

  } catch (err: any) {
    console.error(`[Orchestrator] Falha fatal no case ${caseId}:`, err);
    return buildErrorResponse(caseId, 'erro_interno', `Falha interna inesperada: ${err.message}`, runId);
  }
}

/**
 * Avaliação Primária: Regras Trabalhistas
 */
function evaluateTrabalhista(caseData: CoreCaseData): Partial<OrchestratorOutput> {
  const missingData: string[] = [];
  const nextSteps: string[] = [];
  let needsHumanReview = false;
  let status: OrchestratorStatus = 'em_analise';
  let message = 'Caso trabalhista pronto para extração e consulta jurídica inicial.';

  // Verifica dados críticos do lead
  if (!caseData.leads?.full_name) missingData.push('nome_completo_ausente');
  if (!caseData.leads?.email && !caseData.leads?.phone) missingData.push('contato_ausente');

  // Verifica processo
  if (!caseData.process_number) {
    missingData.push('numero_processo_ausente');
  }

  // Decisão com base nos dados faltantes
  if (missingData.includes('numero_processo_ausente')) {
    status = 'pendente_documental';
    nextSteps.push('solicitar_complemento');
    message = 'Falta do número do processo ou identificação mínima para seguir com o trabalhista.';
  } else {
    // Pipeline principal identificada -> Próximos agentes
    nextSteps.push('consulta_juridica_inicial');
    nextSteps.push('extracao_documental');
  }

  return {
    pipeline_selected: 'pipeline_trabalhista',
    status,
    missing_data: missingData,
    needs_human_review: needsHumanReview,
    next_steps: nextSteps,
    log_message: message
  };
}

/**
 * Avaliação Primária: Regras Precatórios
 */
function evaluatePrecatorio(caseData: CoreCaseData): Partial<OrchestratorOutput> {
  const missingData: string[] = [];
  const nextSteps: string[] = [];
  let needsHumanReview = false;
  let status: OrchestratorStatus = 'em_analise';
  let message = 'Caso precatório pronto para análise inicial.';

  // Verifica dados do lead
  if (!caseData.leads?.full_name) missingData.push('nome_completo_ausente');
  if (!caseData.leads?.email && !caseData.leads?.phone) missingData.push('contato_ausente');

  // Verifica viabilidade básica do precatório (temos número ou tribunal/ente?)
  if (!caseData.precatorio_number && !caseData.documents?.length) {
    missingData.push('identificacao_precatorio_ausente');
  }

  if (missingData.includes('identificacao_precatorio_ausente')) {
    status = 'pendente_documental';
    nextSteps.push('solicitar_complemento');
    message = 'O caso de precatório não possui número do processo ou documentos que permitam a extração.';
  } else {
    nextSteps.push('extracao_documental');
    if (caseData.precatorio_number && caseData.precatorio_number.trim() !== '') {
        nextSteps.push('consulta_juridica_inicial');
    }
  }

  return {
    pipeline_selected: 'pipeline_precatorio',
    status,
    missing_data: missingData,
    needs_human_review: needsHumanReview,
    next_steps: nextSteps,
    log_message: message
  };
}

/**
 * Helper para construir respostas de erro limpas e registá-las no banco.
 */
function buildErrorResponse(caseId: string, status: OrchestratorStatus, message: string, runId: string | null): OrchestratorOutput {
  const response: OrchestratorOutput = {
    case_id: caseId,
    status,
    next_steps: [],
    missing_data: [],
    needs_human_review: true,
    log_message: message
  };

  if (runId) {
    updateAgentRun(runId, {
      outputPayload: response,
      status: 'error',
      errorMessage: message
    });
  }

  return response;
}

/**
 * Helper para mapear os status internos do orquestrador livre para os permitidos pelo ENUM case_status do banco de dados ('recebido', 'em_analise', 'revisao_humana', 'aprovado', 'rejeitado', 'proposta', 'encerrado')
 */
function mapOrchestratorStatusToDbStatus(orchStatus: OrchestratorStatus, currentStatus: string): string {
  // Nota: De acordo com o Supabase schema, os case_status são: ('recebido', 'em_analise', 'revisao_humana', 'aprovado', 'rejeitado', 'proposta', 'encerrado')
  // Como não há pendente_documental por padrão, mantemos 'recebido' ou enviamos para 'revisao_humana' dependendo da sua preferência. Vamos mapear o que der de forma segura.
  switch (orchStatus) {
    case 'em_analise': return 'em_analise';
    case 'revisao_humana': return 'revisao_humana';
    case 'pendente_documental': return currentStatus; // Preserva 'recebido' se o banco não suportar 'pendente_documental' diretamente
    default: return currentStatus;
  }
}
