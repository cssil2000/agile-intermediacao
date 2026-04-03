import { NextResponse } from 'next/server';
import { queryJusbrasilByCNJ, queryJusbrasilByCpfCnpj, queryJusbrasilByOab } from '@/lib/tools/legal-tools';

export async function POST(request: Request) {
  try {
    const { type, value, caseId } = await request.json();

    if (!type || !value) {
      return NextResponse.json(
        { error: 'Tipo (type) e Valor (value) são obrigatórios.' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'cnj':
        result = await queryJusbrasilByCNJ(value, caseId);
        break;
      case 'cpf':
      case 'cnpj':
        result = await queryJusbrasilByCpfCnpj(value, caseId);
        break;
      case 'oab':
        result = await queryJusbrasilByOab(value, caseId);
        break;
      default:
        return NextResponse.json(
          { error: 'Tipo de consulta inválido (cnj, cpf, cnpj, oab).' },
          { status: 400 }
        );
    }

    if (!('success' in result) || !result.success) {
      const errorMsg = (result as any).error || 'Erro na consulta externa';
      const statusCode = (result as any).status || 500;
      return NextResponse.json(
        { error: errorMsg },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: (result as any).data,
      message: 'Consulta realizada e registada com sucesso.'
    });
    
  } catch (err: any) {
    console.error('[API Jusbrasil] Erro na rota:', err.message);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
