import { runCaptureNormalizationAgent } from '../agents/captureNormalizationAgent';
import { runLegalExtractionAgent } from '../agents/legalExtractionAgent';
import { runEligibilityAgent } from '../agents/eligibilityAgent';
import { runRiskScoringAgent } from '../agents/riskScoringAgent';
import { runExecutiveSummaryAgent } from '../agents/executiveSummaryAgent';
import { runCommercialNotificationAgent } from '../agents/commercialNotificationAgent';
import { runPendingRecontactAgent } from '../agents/pendingRecontactAgent';
import { RerunMetadata } from '@/types/agents';
import { AGENT_PIPELINE_ORDER, getAgentsFollowing } from './agentOrder';
import { createActivityLog } from '../logs/log-service';

/**
 * Mapa de funções dos agentes por nome.
 */
const AGENT_FUNCTIONS: Record<string, (caseId: string, metadata?: RerunMetadata) => Promise<any>> = {
  'capture_normalization_agent': runCaptureNormalizationAgent,
  'legal_extraction_agent': runLegalExtractionAgent,
  'eligibility_agent': runEligibilityAgent,
  'risk_scoring_agent': runRiskScoringAgent,
  'executive_summary_agent': runExecutiveSummaryAgent,
  'commercial_notification_agent': runCommercialNotificationAgent,
  'pending_recontact_agent': runPendingRecontactAgent
};

/**
 * Reexecuta um único agente para um caso específico.
 */
export async function rerunSingleAgent(
  caseId: string, 
  agentName: string, 
  reason: string, 
  userEmail: string
) {
  const agentFn = AGENT_FUNCTIONS[agentName];
  if (!agentFn) {
    throw new Error(`Agente não encontrado: ${agentName}`);
  }

  const metadata: RerunMetadata = {
    triggerType: 'rerun_agente',
    rerunReason: reason,
    triggeredByEmail: userEmail
  };

  console.log(`[RerunService] Iniciando reexecução manual do agente ${agentName} para o caso ${caseId}`);
  
  await createActivityLog(
    caseId,
    'rerun_manual_iniciado',
    `Reexecução manual do agente [${agentName}] iniciada por ${userEmail}. Motivo: ${reason}`,
    'sistema'
  );

  return await agentFn(caseId, metadata);
}

/**
 * Reexecuta o pipeline a partir de um agente específico.
 * Execução sequencial para garantir integridade.
 */
export async function rerunPipelineFrom(
  caseId: string, 
  startAgentName: string | null = null, 
  metadata: RerunMetadata = { triggerType: 'rerun_pipeline', rerunReason: 'Reexecução manual' }
) {
  let agentsToRun: string[] = [];

  if (startAgentName) {
    const index = AGENT_PIPELINE_ORDER.indexOf(startAgentName);
    if (index === -1) {
      throw new Error(`Agente de início não encontrado no pipeline: ${startAgentName}`);
    }
    agentsToRun = AGENT_PIPELINE_ORDER.slice(index);
  } else {
    // Se não houver agente de início, começa a partir do primeiro do pipeline (quase sempre legal_extraction para novos casos)
    // No Agile, omitimos o 'capture_normalization_agent' na execução manual de pipeline se não for explicitado
    agentsToRun = AGENT_PIPELINE_ORDER.filter(a => a !== 'capture_normalization_agent');
  }

  console.log(`[RerunService] Iniciando execução de PIPELINE para o caso ${caseId}. Agentes: ${agentsToRun.join(' -> ')}`);

  await createActivityLog(
    caseId,
    'pipeline_ai_iniciado',
    `Processamento de IA iniciado. Gatilho: ${metadata.triggerType}. Motivo: ${metadata.rerunReason}`,
    'sistema'
  );

  const results = [];
  for (const agentName of agentsToRun) {
    const agentFn = AGENT_FUNCTIONS[agentName];
    if (agentFn) {
      console.log(`[RerunService] Pipeline: Executando ${agentName}...`);
      try {
        const res = await agentFn(caseId, metadata);
        results.push({ agentName, success: res.status === 'success' || res.status === 'em_analise' });
        
        // Se um agente falhar criticamente, paramos para permitir intervenção.
        if (res.status === 'error' || res.status === 'erro_interno') {
          console.error(`[RerunService] Pipeline interrompido por erro no agente ${agentName}`);
          break;
        }
      } catch (err) {
        console.error(`[RerunService] Falha catastrófica no agente ${agentName}:`, err);
        break;
      }
    }
  }

  return results;
}
