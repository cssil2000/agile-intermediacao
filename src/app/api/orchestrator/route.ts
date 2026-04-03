import { NextResponse } from 'next/server';
import { runOrchestrator } from '@/lib/services/orchestrator/orchestrator';

export async function POST(request: Request) {
  try {
    const { case_id } = await request.json();

    if (!case_id) {
      return NextResponse.json(
        { error: 'O parâmetro case_id é obrigatório.' },
        { status: 400 }
      );
    }

    // Invocamos a espinha dorsal do sistema de agentes
    const result = await runOrchestrator(case_id);

    if (result.status === 'erro_interno') {
      return NextResponse.json(
        { error: result.log_message, data: result },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Orquestração finalizada com sucesso.'
    });
    
  } catch (err: any) {
    console.error('[API Orchestrator] Erro na rota:', err.message);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
