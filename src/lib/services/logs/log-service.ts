import { supabase } from '@/lib/supabase';
import { AgentRunState } from '@/types/agents';

/**
 * Criação genérica de log de atividade aplicacional/utilizador.
 */
export async function createActivityLog(caseId: string | null, eventType: string, description: string, actorType: 'sistema' | 'admin' | 'analista' | 'cliente' = 'sistema') {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        case_id: caseId,
        event_type: eventType,
        description,
        actor_type: actorType
      });

    if (error) {
      console.error('[LogService] Erro ao criar Activity Log:', error);
    }
  } catch (err: any) {
    console.error('[LogService] Erro interno:', err.message);
  }
}

/**
 * Regista de forma detalhada uma execução do Orquestrador ou de um Agente especializado.
 * Se o runId for retornado, pode ser atualizado mais tarde.
 */
export async function recordAgentRun(runState: AgentRunState): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('agent_runs')
      .insert({
        case_id: runState.caseId,
        agent_name: runState.agentName,
        input_payload: runState.inputPayload,
        output_payload: runState.outputPayload,
        run_status: runState.status, // Nota: Na migration é run_status, no log-service era status
        error_message: runState.errorMessage,
        trigger_type: runState.triggerType || 'automatico',
        rerun_reason: runState.rerunReason,
        triggered_by_email: runState.triggeredByEmail
      })
      .select('id')
      .single();

    if (error) {
      console.error('[LogService] Erro ao gravar execução de Agente/Orquestrador:', error);
      return null;
    }

    return data.id;
  } catch (err: any) {
    console.error('[LogService] Erro interno gravar Agent Run:', err.message);
    return null;
  }
}

/**
 * Atualiza uma execução de agente existente.
 */
export async function updateAgentRun(runId: string, runState: Partial<AgentRunState>) {
  try {
    const updatePayload: any = {};
    if (runState.outputPayload !== undefined) updatePayload.output_payload = runState.outputPayload;
    if (runState.status !== undefined) updatePayload.run_status = runState.status;
    if (runState.errorMessage !== undefined) updatePayload.error_message = runState.errorMessage;

    const { error } = await supabase
      .from('agent_runs')
      .update(updatePayload)
      .eq('id', runId);

    if (error) {
      console.error(`[LogService] Erro ao atualizar Agent Run ${runId}:`, error);
    }
  } catch (err: any) {
    console.error(`[LogService] Erro interno atualizar Agent Run ${runId}:`, err.message);
  }
}
