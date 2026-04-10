/**
 * Integração com a API do Escavador
 * Foco: Chamadas backend seguras para atualização de processos e busca assíncrona.
 */

const ESCAVADOR_API_TOKEN = process.env.ESCAVADOR_API_TOKEN;
const ESCAVADOR_BASE_URL = process.env.ESCAVADOR_BASE_URL || 'https://api.escavador.com/api/v2';

const HEADERS = {
  'Authorization': `Bearer ${ESCAVADOR_API_TOKEN}`,
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

/**
 * Solicita a atualização de um processo de forma assíncrona usando o CNJ.
 * Na V2, este endpoint solicita a atualização nos sistemas dos Tribunais.
 */
export async function requestEscavadorProcessUpdate(processNumber: string) {
  if (!ESCAVADOR_API_TOKEN) {
    return { success: false, error: 'Token do Escavador não configurado no .env.local' };
  }

  const cleanCNJ = processNumber.replace(/[^\d.-]/g, '');
  const url = `${ESCAVADOR_BASE_URL}/processos/numero_cnj/${cleanCNJ}/solicitar-atualizacao`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (!response.ok) {
        // Tratar 422 como "já está na fila" ou "já atualizado" (não é um erro impeditivo)
        const msg = data.message?.toLowerCase() || '';
        const isQueued = msg.includes('aguardando') || msg.includes('processamento');
        const isUpdated = msg.includes('atualizado hoje');

        if (response.status === 422 && (isQueued || isUpdated)) {
            return { 
                success: true, 
                is_already_queued: isQueued, 
                is_already_updated: isUpdated,
                data 
            };
        }
        return { success: false, error: data.message || 'Erro na requisição ao Escavador', raw: data };
    }

    return { 
      success: true, 
      data, 
      query_id: data.id // Na V2 o ID da solicitação vem no campo 'id'
    };
  } catch (err: any) {
    console.error('[Escavador API] Erro de rede:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Consulta o status de um pedido de atualização feito anteriormente.
 */
export async function getEscavadorProcessUpdateStatus(processNumber: string) {
  if (!ESCAVADOR_API_TOKEN) {
    return { success: false, error: 'Token do Escavador não configurado' };
  }

  const cleanCNJ = processNumber.replace(/[^\d.-]/g, '');
  const url = `${ESCAVADOR_BASE_URL}/processos/numero_cnj/${cleanCNJ}/status-atualizacao`;

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
 * Solicita os autos (documentos físicos) de um processo via certificado digital A1.
 * Requer que o certificado esteja carregado em https://api.escavador.com/certificados
 *
 * @param documentosEspecificos - 'INICIAIS' para apenas documentos iniciais (mais rápido/barato), omitir para todos
 */
export async function requestProcessAutosUpdate(
  processNumber: string,
  documentosEspecificos?: 'INICIAIS'
) {
  if (!ESCAVADOR_API_TOKEN) {
    return { success: false, error: 'Token do Escavador não configurado' };
  }

  const cleanCNJ = processNumber.replace(/[^\d.-]/g, '');
  const url = `${ESCAVADOR_BASE_URL}/processos/numero_cnj/${cleanCNJ}/solicitar-atualizacao`;

  const body: Record<string, any> = {
    autos: 1,
    utilizar_certificado: 1,
  };
  if (documentosEspecificos) {
    body.documentos_especificos = documentosEspecificos;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.message?.toLowerCase() || '';
      const isQueued = msg.includes('aguardando') || msg.includes('processamento');
      const isUpdated = msg.includes('atualizado hoje');

      if (response.status === 422 && (isQueued || isUpdated)) {
        return { success: true, is_already_queued: isQueued, is_already_updated: isUpdated, data };
      }

      // 403 normalmente significa que o certificado não está cadastrado ou não tem acesso ao tribunal
      if (response.status === 403) {
        return {
          success: false,
          error: 'Certificado digital não autorizado para este tribunal. Verifique se o e-CPF está cadastrado em api.escavador.com/certificados e habilitado no tribunal correspondente.',
          code: 'CERTIFICADO_NAO_AUTORIZADO',
          raw: data,
        };
      }

      return { success: false, error: data.message || `Erro ${response.status}`, raw: data };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Escavador API] Erro ao solicitar autos:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Lista os documentos (autos) disponíveis de um processo após o status ser SUCESSO.
 * Cada item retornado contém links.api para download do arquivo.
 */
export async function getProcessAutosList(processNumber: string) {
  if (!ESCAVADOR_API_TOKEN) {
    return { success: false, error: 'Token do Escavador não configurado' };
  }

  const cleanCNJ = processNumber.replace(/[^\d.-]/g, '');
  const url = `${ESCAVADOR_BASE_URL}/processos/numero_cnj/${cleanCNJ}/autos`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `Erro ${response.status}`, raw: data };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Escavador API] Erro ao listar autos:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Consulta síncrona diretamente por CNJ (dados em cache do Escavador)
 */
export async function getProcessSnapshotByCNJ(processNumber: string) {
    if (!ESCAVADOR_API_TOKEN) {
        return { success: false, error: 'Token não configurado' };
    }
    
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
