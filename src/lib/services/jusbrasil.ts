/**
 * Jusbrasil API Service Layer
 * Responsável por toda a comunicação externa com a API do Jusbrasil.
 */

const JUSBRASIL_API_KEY = process.env.JUSBRASIL_API_KEY;
const JUSBRASIL_BASE_URL = process.env.JUSBRASIL_BASE_URL || 'https://api.jusbrasil.com.br/v1';

export type QueryType = 'cnj' | 'cpf' | 'cnpj' | 'oab';

export interface JusbrasilResponse {
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}

/**
 * Realiza uma chamada genérica para a API do Jusbrasil
 */
async function jusbrasilFetch(endpoint: string, options: RequestInit = {}): Promise<JusbrasilResponse> {
  if (!JUSBRASIL_API_KEY) {
    console.error('[Jusbrasil Service] JUSBRASIL_API_KEY não configurada.');
    return { success: false, error: 'Configuração de API ausente.', status: 500 };
  }

  const url = `${JUSBRASIL_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${JUSBRASIL_API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    console.log(`[Jusbrasil Service] Chamando endpoint: ${endpoint}`);
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      console.error(`[Jusbrasil Service] Erro na API: ${response.status}`, data);
      return { 
        success: false, 
        error: data.message || `Erro na API: ${response.status}`, 
        status: response.status 
      };
    }

    return { 
      success: true, 
      data, 
      status: response.status 
    };
  } catch (err: any) {
    console.error(`[Jusbrasil Service] Erro inesperado: ${err.message}`);
    return { 
      success: false, 
      error: 'Erro interno ao comunicar com provedor jurídico.', 
      status: 500 
    };
  }
}

/**
 * Consulta processo por número CNJ
 * Format: 0000000-00.0000.0.00.0000
 */
export async function fetchProcessByCNJ(cnj: string): Promise<JusbrasilResponse> {
  const cleanCnj = cnj.replace(/\D/g, ''); // Remove formatação se necessário
  return jusbrasilFetch(`/processos/${cleanCnj}`);
}

/**
 * Consulta processos por CPF ou CNPJ
 */
export async function fetchProcessesByIdentifier(identifier: string): Promise<JusbrasilResponse> {
  const type = identifier.length > 11 ? 'cnpj' : 'cpf';
  return jusbrasilFetch(`/consultas/${type}/${identifier}`);
}

/**
 * Consulta processos por OAB
 * Format: UF000000 (Ex: SP123456)
 */
export async function fetchProcessesByOab(oab: string): Promise<JusbrasilResponse> {
  return jusbrasilFetch(`/consultas/oab/${oab}`);
}

/**
 * Obtém detalhes estruturados de um processo específico
 */
export async function getProcessDetails(id: string): Promise<JusbrasilResponse> {
  return jusbrasilFetch(`/processos/${id}/detalhes`);
}
