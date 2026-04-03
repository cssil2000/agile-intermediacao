import { supabase } from '@/lib/supabase';
import * as escavador from '@/lib/services/external/escavador';

/**
 * Ferramenta interna genérica para consulta por CNJ e persistência.
 * Assenta agora primariamente no motor do Escavador.
 */
export async function queryExternalProcessByCNJ(processNumber: string, caseId?: string) {
  console.log(`[Legal Tool] Iniciando consulta por CNJ (Escavador API): ${processNumber} (Case: ${caseId || 'N/A'})`);

  // 1. Criar registro de consulta pendente (Assíncrona)
  const { data: queryRecord, error: initError } = await supabase
    .from('external_process_queries')
    .insert({
      case_id: caseId,
      provider_name: 'escavador',
      query_type: 'cnj_async',
      query_value: processNumber,
      status: 'pending'
    })
    .select()
    .single();

  if (initError) {
    console.error('[Legal Tool] Erro ao criar registro de consulta:', initError);
    return { error: 'Falha na persistência inicial da query.' };
  }

  // 2. Chamar a API Assíncrona do Escavador para forçar uma atualização fresca do tribunal
  const response = await escavador.requestEscavadorProcessUpdate(processNumber);

  // 3. Atualizar registro com o retorno ou id do callback
  if (response.success && response.query_id) {
    await supabase
      .from('external_process_queries')
      .update({
        raw_response: response.data,
        status: 'awaiting_callback',
        // Injetando o Provider Query ID no record. Um migration futura pode criar a coluna `provider_query_id` oficial
        // Para já, gravamos o ID retornado dentro do raw_response para o webhook conseguir encontrar.
      })
      .eq('id', queryRecord.id);

    console.log(`[Legal Tool] Pedido assíncrono Escavador gerado (ID do Provider: ${response.query_id}).`);
    
    // Opcional para manter fluxo síncrono no momento ou falha de Callback: 
    // Podemos simultaneamente buscar o último Snapshot do Escavador e devolver esse enquanto esperamos a Assíncrona.
    const snap = await escavador.getProcessSnapshotByCNJ(processNumber);
    if (snap.success && snap.data) {
        return {
           success: true,
           is_async_queued: true,
           provider_query_id: response.query_id,
           data: snap.data // Retorna os dados em Cache / Snapshot
        };
    }

    return {
       success: true,
       is_async_queued: true,
       provider_query_id: response.query_id,
       data: null 
    };

  } else {
    // Falhou em criar pedido Assíncrono
    await supabase
      .from('external_process_queries')
      .update({
        status: 'error',
        raw_response: response.raw || null,
        error_message: response.error
      })
      .eq('id', queryRecord.id);

    return response;
  }
}

/**
 * Atualiza um "case" existente com dados extraídos pelo parser do Escavador.
 */
export async function updateCaseFromExternalData(caseId: string, parsedData: any) {
  try {
    const { data: currentCase } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (!currentCase) return;

    // Apenas atualizamos se o campo atual estiver vazio (preservar dados manuais da app)
    const updates: any = {};
    if (!currentCase.tribunal && parsedData.tribunal) updates.tribunal = parsedData.tribunal;
    if (!currentCase.court_region && parsedData.court_region) updates.court_region = parsedData.court_region;
    if (!currentCase.process_stage && parsedData.process_stage) updates.process_stage = parsedData.process_stage;
    if (!currentCase.defendant_company && parsedData.defendant_company) updates.defendant_company = parsedData.defendant_company;
    if (!currentCase.estimated_value && parsedData.estimated_value) updates.estimated_value = parsedData.estimated_value;

    if (Object.keys(updates).length > 0) {
      await supabase.from('cases').update(updates).eq('id', caseId);
      console.log(`[Legal Tool] Case ${caseId} atualizado com dados externos limpos.`);
    }
  } catch (err) {
    console.error('[Legal Tool] Erro ao atualizar case (DB Error):', err);
  }
}

/**
 * Funções Legadas Jusbrasil (Em transição para Escavador)
 * Mantidas para evitar quebra de build em rotas de API existentes.
 */
export async function queryJusbrasilByCNJ(processNumber: string, caseId?: string) {
  return queryExternalProcessByCNJ(processNumber, caseId);
}

export async function queryJusbrasilByCpfCnpj(value: string, caseId?: string) {
  return { 
    success: false, 
    status: 501, 
    error: 'Consulta por CPF/CNPJ temporariamente indisponível durante migração de provedor.' 
  };
}

export async function queryJusbrasilByOab(value: string, caseId?: string) {
  return { 
    success: false, 
    status: 501, 
    error: 'Consulta por OAB temporariamente indisponível durante migração de provedor.' 
  };
}
