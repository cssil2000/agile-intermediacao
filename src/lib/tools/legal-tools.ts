import { supabase } from '@/lib/supabase';
import * as escavador from '@/lib/services/external/escavador';

// Janela de cache: re-usa dados do Escavador se a última query bem-sucedida for mais nova que este valor
const CACHE_WINDOW_MS = 60 * 60 * 1000; // 1 hora

/**
 * Ferramenta interna genérica para consulta por CNJ e persistência.
 *
 * Estratégia "Snapshot First, Update in Background":
 *  1. Verificar se existe resultado recente no cache (evita request duplicado para o mesmo CNJ).
 *  2. Buscar snapshot imediato dos dados que o Escavador já possui em cache (rápido, não bloqueia).
 *  3. Disparar pedido de atualização assíncrona ao Tribunal sem bloquear o agente.
 *  4. Retornar o snapshot imediatamente. A próxima execução já terá os dados atualizados.
 *
 * Isso elimina o loop de polling bloqueante que causava timeout dos agentes.
 */
export async function queryExternalProcessByCNJ(processNumber: string, caseId?: string) {
  console.log(`[Legal Tool] Iniciando consulta por CNJ (Escavador API): ${processNumber} (Case: ${caseId || 'N/A'})`);

  const cleanCNJ = processNumber.replace(/[^\d.-]/g, '');

  // 1. Verificar cache recente na tabela de auditoria
  const cacheThreshold = new Date(Date.now() - CACHE_WINDOW_MS).toISOString();
  const { data: recentQuery } = await supabase
    .from('external_process_queries')
    .select('*')
    .eq('query_value', processNumber)
    .eq('provider_name', 'escavador')
    .eq('status', 'success')
    .gte('created_at', cacheThreshold)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentQuery?.raw_response) {
    console.log(`[Legal Tool] Cache hit: usando resultado recente do Escavador para ${cleanCNJ} (${recentQuery.created_at}).`);
    return {
      success: true,
      data: recentQuery.raw_response,
      from_cache: true,
      polling_completed: false
    };
  }

  // 2. Criar registro de auditoria
  let queryRecord: any = null;
  const { data: record, error: initError } = await supabase
    .from('external_process_queries')
    .insert({
      case_id: caseId,
      provider_name: 'escavador',
      query_type: 'cnj_snapshot',
      query_value: processNumber,
      status: 'pending'
    })
    .select()
    .single();

  if (!initError) queryRecord = record;

  // 3. Buscar snapshot imediato (dados em cache do Escavador) — não bloqueia
  const snap = await escavador.getProcessSnapshotByCNJ(processNumber);

  // 4. Disparar pedido de atualização ao Tribunal em segundo plano (fire and forget)
  //    Não aguardamos nem fazemos polling — o resultado chegará na próxima execução do agente.
  escavador.requestEscavadorProcessUpdate(processNumber).then((updateResp) => {
    const status = updateResp.success ? 'awaiting_callback' : 'update_request_failed';
    console.log(`[Legal Tool] Pedido de atualização ao Tribunal para ${cleanCNJ}: ${status}`);
  }).catch((err) => {
    console.warn(`[Legal Tool] Erro ao disparar atualização em segundo plano para ${cleanCNJ}:`, err?.message);
  });

  // 5. Persistir resultado do snapshot para auditoria
  if (queryRecord) {
    await supabase
      .from('external_process_queries')
      .update({
        raw_response: snap.data || null,
        status: snap.success ? 'success' : 'error',
        error_message: snap.success ? null : (snap.error || 'Snapshot vazio ou com erro')
      })
      .eq('id', queryRecord.id);
  }

  if (!snap.success) {
    console.warn(`[Legal Tool] Snapshot não encontrado para ${cleanCNJ}: ${snap.error}`);
    return { success: false, error: snap.error, data: null };
  }

  return {
    success: true,
    data: snap.data,
    from_cache: false,
    polling_completed: false
  };
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
