import { NextResponse } from 'next/server';

const TOKEN = process.env.ESCAVADOR_API_TOKEN;
const BASE = process.env.ESCAVADOR_BASE_URL || 'https://api.escavador.com/api/v2';

const HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

export async function POST(request: Request) {
  if (!TOKEN) {
    return NextResponse.json({ success: false, error: 'Token do Escavador não configurado.' }, { status: 500 });
  }

  const { type, query } = await request.json();

  if (!query?.trim()) {
    return NextResponse.json({ success: false, error: 'Informe um valor para pesquisa.' }, { status: 400 });
  }

  try {
    let url = '';
    let method = 'GET';

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
