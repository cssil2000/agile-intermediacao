import { getCaseWithDetails, updateCaseAndLeadFields } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { CoreCaseData, CaptureAgentOutput, CaptureNormalizationResult, CompletenessLevel, RerunMetadata } from '@/types/agents';

/**
 * Ponto de entrada do Agente de Captura e Normalização.
 */
export async function runCaptureNormalizationAgent(caseId: string, rerunMetadata?: RerunMetadata): Promise<CaptureAgentOutput> {
  const agentName = 'capture_normalization_agent';
  
  // 1. Registar o início da execução
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
    // 2. Fetch Dados
    const { data: caseData, error } = await getCaseWithDetails(caseId);
    
    if (error || !caseData) {
      return buildErrorResponse(caseId, agentName, 'Falha ao recuperar dados do caso no Supabase.', runId);
    }

    // 3. Normalizar
    const normalizedData = normalizeData(caseData);
    
    // 4. Validar e Avaliar Completude
    const required = validateRequiredFields(caseData.asset_type, normalizedData);
    const recommended = validateRecommendedFields(caseData.asset_type, normalizedData);
    const issues = checkIssues(normalizedData);
    
    const completenessScore = calculateCompletenessScore(required, recommended, issues);
    const completenessLevel = getCompletenessLevel(completenessScore);
    
    const readyForNextStep = required.length === 0 && issues.formatIssues.length === 0;

    // 5. Preparar Resposta
    const result: CaptureNormalizationResult = {
      asset_type: caseData.asset_type,
      normalized_data: normalizedData,
      missing_required_fields: required,
      missing_recommended_fields: recommended,
      format_issues: issues.formatIssues,
      consistency_issues: issues.consistencyIssues,
      completeness_score: completenessScore,
      completeness_level: completenessLevel,
      ready_for_next_step: readyForNextStep
    };

    const response: CaptureAgentOutput = {
      agent_name: agentName,
      case_id: caseId,
      status: readyForNextStep ? 'em_analise' : 'pendente_documental',
      result,
      warnings: issues.consistencyIssues,
      needs_human_review: issues.consistencyIssues.length > 0 || issues.formatIssues.length > 0,
      log_message: readyForNextStep 
        ? 'Dados normalizados com sucesso e prontos para a próxima etapa.' 
        : 'Faltam dados essenciais ou existem problemas de formato.'
    };

    // 6. Atualizar a base de dados (Guardar os campos normalizados)
    await persistNormalizedData(caseData, normalizedData);

    // 7. Atualizar Históricos e Logs
    await createActivityLog(
      caseId, 
      'captura_normalizacao_executada', 
      response.log_message + ` (Score: ${completenessScore})`,
      'sistema'
    );

    if (runId) {
      await updateAgentRun(runId, {
        outputPayload: response,
        status: 'success'
      });
    }

    return response;

  } catch (err: any) {
    console.error(`[CaptureAgent] Erro fatal no caso ${caseId}:`, err);
    return buildErrorResponse(caseId, agentName, `Falha interna: ${err.message}`, runId);
  }
}

// --- Funções de Normalização Limpa ---

function normalizeData(caseData: CoreCaseData): Record<string, any> {
  const norm: Record<string, any> = {};

  // Lead Data
  if (caseData.leads) {
    norm.full_name = normalizeName(caseData.leads.full_name);
    norm.email = normalizeEmail(caseData.leads.email);
    norm.phone = normalizePhone(caseData.leads.phone);
  }

  // Case Data Relevante
  norm.process_number = normalizeString(caseData.process_number);
  norm.precatorio_number = normalizeString(caseData.precatorio_number);
  norm.tribunal = normalizeString(caseData.tribunal);
  norm.court_region = normalizeString(caseData.court_region);
  
  return norm;
}

function normalizeName(name?: string): string | undefined {
  if (!name) return undefined;
  // Remove espaços duplicados e faz trim
  let cleanInfo = name.replace(/\s+/g, ' ').trim();
  
  // Tentar capitalizar a primeira letra sem forçar destruição de nomes estilo "d'Ávila"
  // Esta abordagem é suave.
  return cleanInfo.replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeEmail(email?: string): string | undefined {
  if (!email) return undefined;
  return email.trim().toLowerCase();
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Preserva dígitos e o sinal de mais.
  return phone.replace(/[^\d+]/g, '');
}

function normalizeString(text?: string): string | undefined {
  if (!text) return undefined;
  return text.replace(/\s+/g, ' ').trim();
}

// --- Funções de Validação de Regras ---

function validateRequiredFields(assetType: string, nomData: any): string[] {
  const missing: string[] = [];
  
  if (!nomData.full_name) missing.push('full_name');
  if (!nomData.email && !nomData.phone) missing.push('contact_info');

  if (assetType === 'trabalhista') {
    if (!nomData.process_number) missing.push('process_number');
  } else if (assetType === 'precatorio') {
    if (!nomData.precatorio_number) missing.push('precatorio_number');
  }

  return missing;
}

function validateRecommendedFields(assetType: string, nomData: any): string[] {
  const missing: string[] = [];
  
  if (assetType === 'trabalhista') {
    if (!nomData.tribunal && !nomData.court_region) missing.push('tribunal_region');
    // Em teoria, extrairemos stage e company depois, mas a entrada ajuda
  }

  return missing;
}

function checkIssues(nomData: any) {
  const formatIssues: string[] = [];
  const consistencyIssues: string[] = [];

  // Validação simples de email
  if (nomData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nomData.email)) {
    formatIssues.push('email_invalido');
  }

  // Se o telefone foi limpo mas tem poucos dígitos, é suspeito
  if (nomData.phone && nomData.phone.replace('+', '').length < 8) {
    formatIssues.push('telefone_muito_curto');
  }

  // Inconsistência simples: número do processo mal formado para CNJ
  if (nomData.process_number && nomData.process_number.replace(/\D/g, '').length !== 20) {
    consistencyIssues.push('numero_processo_nao_padrao_cnj');
  }

  return { formatIssues, consistencyIssues };
}

function calculateCompletenessScore(required: string[], recommended: string[], issues: any): number {
  let score = 100;

  // Penalizações por falhas obrigatórias
  score -= (required.length * 20);
  
  // Penalizações por falhas recomendadas
  score -= (recommended.length * 10);

  // Penalizações por formatação duvidosa
  score -= (issues.formatIssues.length * 5);
  score -= (issues.consistencyIssues.length * 5);

  return Math.max(0, score); // Nunca abaixo de zero
}

function getCompletenessLevel(score: number): CompletenessLevel {
  if (score >= 80) return 'alta';
  if (score >= 50) return 'media';
  return 'baixa';
}

// --- Funções de Aplicação de Dados à BD ---

async function persistNormalizedData(oldData: CoreCaseData, newData: Record<string, any>) {
  const caseUpdates: Record<string, any> = {};
  const leadUpdates: Record<string, any> = {};

  // Avalia Case
  if (newData.process_number !== oldData.process_number && newData.process_number) caseUpdates.process_number = newData.process_number;
  if (newData.precatorio_number !== oldData.precatorio_number && newData.precatorio_number) caseUpdates.precatorio_number = newData.precatorio_number;
  if (newData.tribunal !== oldData.tribunal && newData.tribunal) caseUpdates.tribunal = newData.tribunal;
  if (newData.court_region !== oldData.court_region && newData.court_region) caseUpdates.court_region = newData.court_region;

  // Avalia Lead
  if (oldData.leads) {
    if (newData.full_name !== oldData.leads.full_name && newData.full_name) leadUpdates.full_name = newData.full_name;
    if (newData.email !== oldData.leads.email && newData.email) leadUpdates.email = newData.email;
    if (newData.phone !== oldData.leads.phone && newData.phone) leadUpdates.phone = newData.phone;
  }

  const caseDataAny: any = oldData;
  const leadId = caseDataAny.lead_id;

  if (Object.keys(caseUpdates).length > 0 || Object.keys(leadUpdates).length > 0) {
     console.log(`[CaptureAgent] Guardando normalizações na base de dados para o caso ${oldData.id}`);
     await updateCaseAndLeadFields(oldData.id, leadId, caseUpdates, leadUpdates);
  }
}

// --- Helper Func ---

function buildErrorResponse(caseId: string, agentName: string, message: string, runId: string | null): CaptureAgentOutput {
  const errorResp: CaptureAgentOutput = {
    agent_name: agentName,
    case_id: caseId,
    status: 'erro_interno', // Assuming OchestratorStatus intersection
    result: {
      asset_type: 'trabalhista', // placeholder
      normalized_data: {},
      missing_required_fields: [],
      missing_recommended_fields: [],
      format_issues: [],
      consistency_issues: [],
      completeness_score: 0,
      completeness_level: 'baixa',
      ready_for_next_step: false
    },
    warnings: [],
    needs_human_review: true,
    log_message: message
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
