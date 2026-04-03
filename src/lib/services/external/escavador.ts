/**
 * Integração com a API do Escavador
 * Foco: Chamadas backend seguras para atualização de processos e busca assíncrona.
 */

const ESCAVADOR_API_TOKEN = process.env.ESCAVADOR_API_TOKEN;
const ESCAVADOR_BASE_URL = process.env.ESCAVADOR_BASE_URL || 'https://api.escavador.com/api/v1';

const HEADERS = {
  'Authorization': `Bearer ${ESCAVADOR_API_TOKEN}`,
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

/**
 * Solicita a atualização de um processo de forma assíncrona usando o CNJ.
 * Documentação do Escavador prevê que esta chamada retorna um ID de monitoramento.
 */
export async function requestEscavadorProcessUpdate(processNumber: string) {
  if (!ESCAVADOR_API_TOKEN) {
    return { success: false, error: 'Token do Escavador não configurado no .env.local' };
  }

  // O Escavador, na v1/v2, aceita request assíncrona para atualização via endpoint específico.
  // URL indicativo baseado na API do Escavador para "async processos"
  const url = `${ESCAVADOR_BASE_URL}/async/processos`;
  const cleanCNJ = processNumber.replace(/[^\d.-]/g, '');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        numero_cnj: cleanCNJ
      }),
      // Para chamadas sever-side podemos querer um timeout para não bloquear agentes
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (!response.ok) {
        return { success: false, error: data.message || 'Erro na requisição ao Escavador', raw: data };
    }

    return { 
      success: true, 
      data, 
      // O Escavador retorna um id referente à query assíncrona
      query_id: data.id || data.id_async
    };
  } catch (err: any) {
    console.error('[Escavador API] Erro de rede:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Consulta o status de um pedido assíncrono feito anteriormente no Escavador.
 */
export async function getEscavadorProcessUpdateStatus(queryId: number | string) {
  if (!ESCAVADOR_API_TOKEN) {
    return { success: false, error: 'Token do Escavador não configurado' };
  }

  const url = `${ESCAVADOR_BASE_URL}/async/resultados/${queryId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (!response.ok) {
        return { success: false, error: data.message || 'Erro na consulta do status', raw: data };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Escavador API] Erro de rede ao checar status:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Consulta síncrona diretamente por CNJ (apenas para resgatar dados em cache do Escavador sem forçar tracking atualizado)
 */
export async function getProcessSnapshotByCNJ(processNumber: string) {
    if (!ESCAVADOR_API_TOKEN) {
        return { success: false, error: 'Token não configurado' };
    }
    
    // Rota de processo genérica do escavador
    const cleanCNJ = processNumber.replace(/[^\d.-]/g, '');
    const url = `${ESCAVADOR_BASE_URL}/processos/numero_cnj/${cleanCNJ}`;

    try {
        const response = await fetch(url, {
          method: 'GET',
          headers: HEADERS,
          signal: AbortSignal.timeout(10000)
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            return { success: false, error: data.message || 'Erro ao consultar o CNJ sincronamente.', raw: data };
        }
    
        return { success: true, data };
      } catch (err: any) {
        console.error('[Escavador API] Erro ao buscar snapshot:', err);
        return { success: false, error: err.message };
      }
}
