import { NextResponse } from 'next/server';
import {
  requestProcessAutosUpdate,
  getEscavadorProcessUpdateStatus,
  getProcessAutosList,
} from '@/lib/services/external/escavador';

const TOKEN = process.env.ESCAVADOR_API_TOKEN;
const BASE = process.env.ESCAVADOR_BASE_URL || 'https://api.escavador.com/api/v2';

const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

export async function POST(request: Request) {
  if (!TOKEN) {
    return NextResponse.json({ success: false, error: 'Token do Escavador não configurado.' }, { status: 500 });
  }

  const body = await request.json();
  const { type, query, action, cnj, documentos_especificos } = body;

  // ── Ações de autos (documentos físicos do processo) ────────────────────────

  if (action === 'solicitar-autos') {
    if (!cnj?.trim()) {
      return NextResponse.json({ success: false, error: 'CNJ é obrigatório para solicitar autos.' }, { status: 400 });
    }
    const result = await requestProcessAutosUpdate(cnj, documentos_especificos);
    return NextResponse.json(result);
  }

  if (action === 'status-autos') {
    if (!cnj?.trim()) {
      return NextResponse.json({ success: false, error: 'CNJ é obrigatório.' }, { status: 400 });
    }
    const result = await getEscavadorProcessUpdateStatus(cnj);
    return NextResponse.json(result);
  }

  if (action === 'listar-autos') {
    if (!cnj?.trim()) {
      return NextResponse.json({ success: false, error: 'CNJ é obrigatório.' }, { status: 400 });
    }
    const result = await getProcessAutosList(cnj);
    return NextResponse.json(result);
  }

  // Proxy de download de documento — passa pelo backend para incluir o token
  if (action === 'download-doc') {
    const { doc_url } = body;
    if (!doc_url?.startsWith('https://api.escavador.com/')) {
      return NextResponse.json({ success: false, error: 'URL de documento inválida.' }, { status: 400 });
    }
    try {
      const docResp = await fetch(doc_url, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!docResp.ok) {
        return NextResponse.json({ success: false, error: `Erro ${docResp.status} ao baixar documento.` }, { status: docResp.status });
      }
      const contentType = docResp.headers.get('content-type') || 'application/octet-stream';
      const contentDisp = docResp.headers.get('content-disposition') || 'attachment; filename="documento.pdf"';
      const buffer = await docResp.arrayBuffer();
      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisp,
        },
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: 'Erro ao baixar documento.' }, { status: 500 });
    }
  }

  // ── Busca de processos (comportamento original) ─────────────────────────────

  if (!query?.trim()) {
    return NextResponse.json({ success: false, error: 'Informe um valor para pesquisa.' }, { status: 400 });
  }

  try {
    let url = '';
    const method = 'GET';

    if (type === 'cnj') {
      const cleanCNJ = query.replace(/[^\d.-]/g, '');
      url = `${BASE}/processos/numero_cnj/${cleanCNJ}`;
    } else if (type === 'cpf') {
      const cleanCPF = query.replace(/\D/g, '');
      url = `${BASE}/processos?cpf=${cleanCPF}&limit=20`;
    } else if (type === 'nome') {
      const encoded = encodeURIComponent(query.trim());
      url = `${BASE}/processos?q=${encoded}&limit=20`;
    } else {
      return NextResponse.json({ success: false, error: 'Tipo de busca inválido.' }, { status: 400 });
    }

    const resp = await fetch(url, { method, headers: HEADERS, signal: AbortSignal.timeout(15000) });
    const data = await resp.json();

    if (!resp.ok) {
      const msg = data?.message || data?.error || `Erro ${resp.status} na API do Escavador.`;
      return NextResponse.json({ success: false, error: msg, status: resp.status });
    }

    // Normaliza resposta: CNJ retorna objeto único, outros podem retornar lista
    const items = Array.isArray(data?.items || data)
      ? (data?.items || data)
      : [data];

    return NextResponse.json({ success: true, type, query, items, total: items.length });
  } catch (err: any) {
    console.error('[ConsultaJuridica API]', err);
    return NextResponse.json({ success: false, error: 'Erro de conexão com o Escavador.' }, { status: 500 });
  }
}
