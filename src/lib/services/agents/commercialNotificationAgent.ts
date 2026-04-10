import { supabase } from '@/lib/supabase';
import { getCaseWithDetails } from '../cases/case-service';
import { createActivityLog, recordAgentRun, updateAgentRun } from '../logs/log-service';
import { CommercialAgentOutput, CommercialNotificationResult, RerunMetadata } from '@/types/agents';
import { determineCommercialAlertInfo } from '../commercial/alertRules';
import { buildCommercialSnapshotPayload } from '../commercial/buildCommercialPayload';
import { sendCommercialAlertEmail } from '../email/commercialAlertEmail';

/**
 * Agente Comercial e Notificações
 * Filtra "barulho" da IA, decidindo em nanossegundos que casos devem saltar para o telemóvel/email dos diretores ou equipa de análise.
 */
export async function runCommercialNotificationAgent(caseId: string, rerunMetadata?: RerunMetadata): Promise<CommercialAgentOutput> {
  const agentName = 'commercial_notification_agent';
  
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
        return buildErrorResponse(caseId, agentName, 'Acesso comprometido aos dados do Caso.', runId);
    }
    const detailsRow = (caseData as any).leads || {};

    // 2. EXTRAÇÕES 
    const { data: latestExtraction } = await supabase
       .from('case_extractions')
       .select('extracted_fields')
       .eq('case_id', caseId)
       .order('created_at', { ascending: false })
       .limit(1)
       .single();
    const extractedData = latestExtraction ? latestExtraction.extracted_fields : {};

    // 3. ELEGIBILIDADE (Em memória caso use a tabela DB nova ou na própria object)
    const eligibilityMem = {
        eligibility_status: (caseData as any).eligibility_status || 'pendente_documental',
        flags: (caseData as any).eligibility_flags || []
    };

    // 4. SCORINGS 
    const { data: riskRecord } = await supabase
       .from('risk_scores')
       .select('*')
       .eq('case_id', caseId)
       .order('created_at', { ascending: false })
       .limit(1)
       .single();

    // 5. RESUMOS EXECUTIVOS
    const { data: summaryRecord } = await supabase
       .from('case_summaries')
       .select('*')
       .eq('case_id', caseId)
       .order('created_at', { ascending: false })
       .limit(1)
       .single();

    if (!riskRecord || !summaryRecord) {
        console.warn(`[CommercialAgent] Risco ou Sumário inexistentes para ${caseId}. Fallbacks aplicados.`);
    }

    const priorityLabel = riskRecord ? riskRecord.priority_label : 'indefinida';
    const overallScore = riskRecord ? riskRecord.overall_operational_score : 0;
    const recommendedAction = summaryRecord ? summaryRecord.recommended_next_action : 'manter_em_analise';

    // Construção do Snapshot Snapshot Comercial Base
    const commercialPayload = buildCommercialSnapshotPayload(
        caseData as any, 
        detailsRow, 
        riskRecord || { classifications: {} } as any, 
        summaryRecord || {} as any, 
        extractedData
    );

    // 6. MATRIZ DE DELEGAÇÃO COMERCIAL (O Motor)
    const alertInfo = determineCommercialAlertInfo({
        value: commercialPayload.value,
        eligibility_status: eligibilityMem.eligibility_status,
        recommended_action: recommendedAction,
        priority_label: priorityLabel,
        lead_type: detailsRow.lead_type || 'usuario_comum',
        overall_score: overallScore
    });

    const finalResult: CommercialNotificationResult = {
        ...alertInfo,
        commercial_summary: alertInfo.should_create_alert ? commercialPayload : undefined
    };

    const finalOutput: CommercialAgentOutput = {
       agent_name: agentName,
       case_id: caseId,
       status: 'success',
       result: finalResult,
       warnings: []
    };

    // 7. SQL INSERTS

    // 7A. Grava na tabela Histórica de Alertas
    if (finalResult.should_create_alert) {
        const { error: alertDbError } = await supabase
            .from('commercial_alerts')
            .insert({
                case_id: caseId,
                alert_type: finalResult.alert_type,
                alert_priority: finalResult.alert_priority,
                notify_roles: finalResult.notify_roles,
                alert_reason: finalResult.alert_reason,
                commercial_status: finalResult.commercial_status,
                payload: commercialPayload,
                delivery_status: 'pending' // Fica pending para um CRON / Webhook varrer
            });
            
        if (alertDbError) {
             console.error('[Commercial] Erro a compilar novo alerta em BD:', alertDbError);
             finalOutput.warnings.push('Falha na inserção tabela commercial_alerts');
        }

        // Enviar email via Resend
        const emailResult = await sendCommercialAlertEmail({
            caseId,
            alertType: finalResult.alert_type,
            alertPriority: finalResult.alert_priority,
            alertReason: finalResult.alert_reason,
            payload: commercialPayload
        });

        if (!emailResult.success) {
            console.warn('[Commercial] Email não enviado:', emailResult.error);
            finalOutput.warnings.push(`Email não enviado: ${emailResult.error}`);
        }
    }

    // 7B. Modifica as FLAGS do Caso nativo
    await supabase.from('cases').update({
        commercial_status: finalResult.commercial_status,
        last_alert_type: finalResult.alert_type,
        last_alert_priority: finalResult.alert_priority,
        ready_for_commercial: finalResult.should_create_alert
    }).eq('id', caseId);

    // 8. Auditoria Activity
    const verb = finalResult.should_create_alert ? 'DISPARADO' : 'SILENCIADO';
    await createActivityLog(
        caseId,
        'alerta_comercial_avaliado',
        `Alerta Comercial ${verb}. Estado de operação atirado para: [${finalResult.commercial_status.replace(/_/g, ' ').toUpperCase()}].`,
        'sistema'
    );

    if (runId) updateAgentRun(runId, { outputPayload: finalOutput, status: 'success' });

    return finalOutput;

  } catch (err: any) {
    console.error(`[CommercialAgent] Eixo Truncado ${caseId}:`, err);
    return buildErrorResponse(caseId, agentName, `Erro: ${err.message}`, runId);
  }
}

function buildErrorResponse(caseId: string, agentName: string, message: string, runId: string | null): CommercialAgentOutput {
  const errorResp: CommercialAgentOutput = {
    agent_name: agentName,
    case_id: caseId,
    status: 'erro_interno',
    result: {
      should_create_alert: false,
      alert_type: 'sem_alerta_comercial',
      alert_priority: 'baixa',
      notify_roles: [],
      alert_reason: 'Crash técnico. Acesso Comercial Bloqueado.',
      commercial_status: 'pendente'
    },
    warnings: [message]
  };

  if (runId) updateAgentRun(runId, { outputPayload: errorResp, status: 'error', errorMessage: message });
  return errorResp;
}
