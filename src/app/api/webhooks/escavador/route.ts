import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runLegalExtractionAgent } from '@/lib/services/agents/legalExtractionAgent';

/**
 * Webhook para receber Callbacks assíncronos do Escavador.
 * Rota: /api/webhooks/escavador
 */
export async function POST(req: Request) {
  try {
    // 1. O Escavador tipicamente usa um header de signature para precaver abusos,
    // Num sistema de produção real adicionaríamos validação:
    // const signature = req.headers.get('X-Escavador-Signature');
    
    // Ler o corpo do payload
    const payload = await req.json();

    console.log('[Webhook Escavador] Callback recebido:', JSON.stringify(payload).substring(0, 200) + '...');

    // 2. Extrair o ID gerado pelo Escavador que associámos originalmente à nossa query.
    // O webhook deles costuma devolver o id da requisição dentro do próprio JSON ou envio de monitoramento
    const providerQueryId = payload.id || payload.id_async || payload.monitoramento_id;

    if (!providerQueryId) {
       console.error('[Webhook Escavador] Callback falhou: ID da busca não detetado.');
       return NextResponse.json({ error: 'Missing async request ID' }, { status: 400 });
    }

    // 3. Procurar o registo original "awaiting_callback" na nossa BD (external_process_queries)
    // Como a migration oficial e estrutura ainda não tem o column `provider_query_id`, 
    // recorremos à busca pelo JSON no raw_response
    const { data: pendingQuery, error: dbError } = await supabase
      .from('external_process_queries')
      .select('*')
      .eq('status', 'awaiting_callback')
      .contains('raw_response', { id: providerQueryId })
      .single();

    // Em alternativa à query contains (se o schema for atualizado no futuro):
    // .eq('provider_query_id', providerQueryId)

    if (dbError || !pendingQuery) {
        console.warn(`[Webhook Escavador] Consulta não encontrada para o ID ${providerQueryId}. Pode já ter sido tratada.`);
        // Emitimos 200 na mesma para o Escavador parar de nos fazer retry
        return NextResponse.json({ received: true });
    }

    // 4. Se a reposta foi erro do lado deles (ex: processo não existe, abortado):
    if (payload.status === 'ERROR' || payload.error) {
       await supabase.from('external_process_queries').update({
           status: 'error',
           error_message: payload.message || 'Erro devolvido no callback.'
       }).eq('id', pendingQuery.id);
       return NextResponse.json({ received: true });
    }

    // 5. Sucesso: Guardar o Payload Massivo na tabela
    await supabase.from('external_process_queries').update({
        status: 'completed',
        raw_response: payload // Sobrescreve com os dados integrais devolvidos
    }).eq('id', pendingQuery.id);

    console.log(`[Webhook Escavador] Base de dados atualizada. Case_ID: ${pendingQuery.case_id}`);

    // 6. Ativar orquestrador ou Agente de Extração novamente com os dados frescos!
    if (pendingQuery.case_id) {
       console.log(`[Webhook Escavador] Relançando Agente de Extração para o Case ID: ${pendingQuery.case_id}...`);
       // Background task: chama o agente sem bloquear a resposta ao Webhook
       runLegalExtractionAgent(pendingQuery.case_id)
         .then(() => console.log(`[Webhook Escavador] Agente finalizado com sucesso em background.`))
         .catch(e => console.error(`[Webhook Escavador] Erro no Agente em background:`, e));
    }

    return NextResponse.json({ success: true, processed: true });

  } catch (error: any) {
    console.error('[Webhook Escavador] Erro fatal no processamento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
