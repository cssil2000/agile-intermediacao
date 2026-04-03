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
  startAgentName: string, 
  reason: string, 
  userEmail: string
) {
  const index = AGENT_PIPELINE_ORDER.indexOf(startAgentName);
  if (index === -1) {
    throw new Error(`Agente de início não encontrado no pipeline: ${startAgentName}`);
  }

  const agentsToRun = AGENT_PIPELINE_ORDER.slice(index);
  const metadata: RerunMetadata = {
    triggerType: 'rerun_pipeline',
    rerunReason: reason,
    triggeredByEmail: userEmail
  };

  console.log(`[RerunService] Iniciando reexecução de PIPELINE a partir de ${startAgentName} para o caso ${caseId}`);

  await createActivityLog(
    caseId,
    'rerun_pipeline_iniciado',
    `Reexecução de pipeline a partir de [${startAgentName}] iniciada por ${userEmail}. Motivo: ${reason}`,
    'sistema'
  );

  const results = [];
  for (const agentName of agentsToRun) {
    const agentFn = AGENT_FUNCTIONS[agentName];
    if (agentFn) {
      console.log(`[RerunService] Pipeline: Executando ${agentName}...`);
      const res = await agentFn(caseId, metadata);
      results.push({ agentName, success: res.status === 'success' || res.status === 'em_analise' });
      
      // Se um agente falhar criticamente, podemos decidir parar ou continuar. 
      // Para integridade de dados, aqui paramos se houver erro interno.
      if (res.status === 'error' || res.status === 'erro_interno') {
        console.error(`[RerunService] Pipeline interrompido por erro no agente ${agentName}`);
        break;
      }
    }
  }

  return results;
}
