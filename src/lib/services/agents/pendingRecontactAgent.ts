import { supabase } from '@/lib/supabase';
import { getCaseWithDetails } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { PendingRecontactAgentOutput, PendingContactPayload, RerunMetadata } from '@/types/agents';
import { evaluatePendingStatus } from '../pending/pendingRules';
import { buildPendingMessages } from '../pending/buildPendingMessage';

/**
 * Agente de Pendências e Recontacto
 * Interseta fluxos onde o case ficou "pendente_documental", avalia o ROI do caso (Valor > 150k),
 * e gera as templates linguísticas de re-recrutamento da lead.
 */
export async function runPendingRecontactAgent(caseId: string, rerunMetadata?: RerunMetadata): Promise<PendingRecontactAgentOutput> {
  const agentName = 'pending_recontact_agent';
  
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
    // 1. DADOS SUPERIORES: CASE + LEAD
    const { data: caseData, error: caseError } = await getCaseWithDetails(caseId);
    if (caseError || !caseData) {
        return buildErrorResponse(caseId, agentName, 'Não foi possível recuperar a base de dados do caso.', runId);
    }
    const detailsRow = (caseData as any).leads || {};
    const leadName = detailsRow.full_name || 'Usuário Agile';
    const estimatedFaceValue = detailsRow.estimated_value || 0;

    // 2. RECUPERAÇÃO DAS MENSAGENS ANTERIORES E ELEGIBILIDADE
    const eligibilityStatus = (caseData as any).eligibility_status || '';
    const eligibilityFlags = (caseData as any).eligibility_flags || [];

    // Se o caso não estiver cimentado na elegibilidade como Pendente, o Agente cessa ignição e passa adiante.
    if (eligibilityStatus !== 'pendente_documental' && !(eligibilityFlags.includes('revisao_risco_sem_oficio'))) {
        const skipOutput: PendingRecontactAgentOutput = {
           agent_name: agentName,
           case_id: caseId,
           status: 'success',
           result: {
              pending_type: 'nenhuma',
              pending_items: [],
              pending_recovery_worth: 'nulo',
              recommended_pending_action: 'ignorar_nao_pendente'
           },
           warnings: ['Caso não detetado como pendente. Sem ação efetuada.']
        };
        if (runId) updateAgentRun(runId, { outputPayload: skipOutput, status: 'success' });
        return skipOutput;
    }

    // 3. MOTOR DE REGRAS - O que está quebrado e valerá a pena ir atrás de arranjar?
    const rulesOutcome = evaluatePendingStatus(
        eligibilityStatus,
        eligibilityFlags,
        caseData.asset_type as string,
        estimatedFaceValue
    );

    // Se a máquina decidiu que o valor é lixo perante a trabalheira de recuperar..
    if (rulesOutcome.action === 'ignorar_baixo_valor' || rulesOutcome.type === 'nenhuma') {
         const skippedValueOutput: PendingRecontactAgentOutput = {
           agent_name: agentName,
           case_id: caseId,
           status: 'success',
           result: {
              pending_type: rulesOutcome.type,
              pending_items: rulesOutcome.items,
              pending_recovery_worth: rulesOutcome.worth,
              recommended_pending_action: rulesOutcome.action
           },
           warnings: ['Caso classificado baixo-retorno para despendimento de esforço humano em follow-up operacional.']
         };

         await createActivityLog(
             caseId,
             'pendencia_arquivada',
             'O caso contém items informacionais em falta, todavia, devido ao valor diminuto aparente do Ativo, a máquina descartou Follow-up automático do Lead.',
             'sistema'
         );

         if (runId) updateAgentRun(runId, { outputPayload: skippedValueOutput, status: 'success' });
         return skippedValueOutput;
    }

    // 4. NLP COMMS BUILDER (Se decidimos lutar pelo caso)
    const commTexts = buildPendingMessages(leadName, caseData.asset_type as string, rulesOutcome.items);

    const finalResult: PendingContactPayload = {
         pending_type: rulesOutcome.type,
         pending_items: rulesOutcome.items,
         pending_recovery_worth: rulesOutcome.worth,
         recommended_pending_action: rulesOutcome.action,
         pending_request_subject: commTexts.subject,
         pending_request_message_short: commTexts.msgShort,
         pending_request_message_full: commTexts.msgFull
    };

    const finalOutput: PendingRecontactAgentOutput = {
       agent_name: agentName,
       case_id: caseId,
       status: 'success',
       result: finalResult,
       warnings: []
    };

    // 5. INSERTS DE DADOS
    
    // 5A. Cria a Tarefa Central na Tabela Independente de Pendências Assíncronas
    const { error: pendError } = await supabase
            .from('case_pending_actions')
            .insert({
                case_id: caseId,
                pending_type: finalResult.pending_type,
                pending_items: finalResult.pending_items,
                pending_recovery_worth: finalResult.pending_recovery_worth,
                recommended_pending_action: finalResult.recommended_pending_action,
                pending_request_subject: finalResult.pending_request_subject,
                pending_request_message_short: finalResult.pending_request_message_short,
                pending_request_message_full: finalResult.pending_request_message_full,
                status: 'pendente'
            });
            
    if (pendError) {
         console.error('[PendingAgent] Erro na tabela sql assincrona:', pendError);
         finalOutput.warnings.push('Houve falha a guardar a comunicação na bd case_pending_actions');
    }

    // 5B. Atualiza o Status global principal do processo, só pelo seguro.
    await supabase.from('cases').update({ eligibility_status: 'pendente_documental' }).eq('id', caseId);

    // 6. Auditoria Activity
    await createActivityLog(
        caseId,
        'pedido_de_complemento_gerado',
        `A Inteligência Artificial decretou a necessidade de obter documentos extra (${finalResult.pending_items.join(', ')}). Ação Requerida à equipa designada como [${finalResult.recommended_pending_action.toUpperCase()}]. Drafts redigidos em BD aguardando autorização de disparo final.`,
        'sistema'
    );

    if (runId) updateAgentRun(runId, { outputPayload: finalOutput, status: 'success' });

    return finalOutput;

  } catch (err: any) {
    console.error(`[PendingRecontactAgent] Crash severo em ${caseId}:`, err);
    return buildErrorResponse(caseId, agentName, `Critical engine err: ${err.message}`, runId);
  }
}

function buildErrorResponse(caseId: string, agentName: string, message: string, runId: string | null): PendingRecontactAgentOutput {
  const errorResp: PendingRecontactAgentOutput = {
    agent_name: agentName,
    case_id: caseId,
    status: 'erro_interno',
    result: {
       pending_type: 'nenhuma',
       pending_items: [],
       pending_recovery_worth: 'nulo',
       recommended_pending_action: 'ignorar_nao_pendente'
    },
    warnings: [message]
  };

  if (runId) updateAgentRun(runId, { outputPayload: errorResp, status: 'error', errorMessage: message });
  return errorResp;
}
