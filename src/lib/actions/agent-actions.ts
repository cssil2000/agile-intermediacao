'use server';

import { rerunSingleAgent, rerunPipelineFrom } from '@/lib/services/agentRuns/rerunService';
import { revalidatePath } from 'next/cache';

/**
 * Server Action para disparar reexecução de um agente.
 */
export async function triggerAgentRerun(
  caseId: string, 
  agentName: string, 
  reason: string, 
  userEmail: string
) {
  try {
    const result = await rerunSingleAgent(caseId, agentName, reason, userEmail);
    revalidatePath(`/internal/agents/${caseId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('[Action] Rerun Agent Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action para disparar reexecução de pipeline.
 */
export async function triggerPipelineRerun(
  caseId: string, 
  startAgentName: string, 
  reason: string, 
  userEmail: string
) {
  try {
    const result = await rerunPipelineFrom(caseId, startAgentName, reason, userEmail);
    revalidatePath(`/internal/agents/${caseId}`);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('[Action] Rerun Pipeline Error:', error);
    return { success: false, error: error.message };
  }
}
