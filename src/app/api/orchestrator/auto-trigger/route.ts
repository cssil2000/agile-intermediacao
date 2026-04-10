import { NextResponse } from 'next/server';
import { runOrchestrator } from '@/lib/services/orchestrator/orchestrator';
import { rerunPipelineFrom } from '@/lib/services/agentRuns/rerunService';

// Vercel Pro: permitir execução mais longa para o polling do Escavador
export const maxDuration = 300; // segundos (máximo: 5 minutos)
export const dynamic = 'force-dynamic';

/**
 * POST /api/orchestrator/auto-trigger
 * 
 * Endpoint chamado automaticamente após a criação de um novo caso.
 * Executa o orquestrador e, se o caso estiver pronto, dispara o pipeline completo de agentes.
 */
export async function POST(request: Request) {
  try {
    const { case_id } = await request.json();

    if (!case_id) {
      return NextResponse.json(
        { error: 'O parâmetro case_id é obrigatório.' },
        { status: 400 }
      );
    }

    console.log(`[AutoTrigger] Iniciando processamento automático para caso ${case_id}`);

    // 1. Executa o Orquestrador (avalia o caso e decide pipeline)
    const orchestratorResult = await runOrchestrator(case_id);

    if (orchestratorResult.status === 'erro_interno') {
      console.error(`[AutoTrigger] Orquestrador retornou erro para caso ${case_id}:`, orchestratorResult.log_message);
      return NextResponse.json({
        success: false,
        phase: 'orchestrator',
        error: orchestratorResult.log_message,
        data: orchestratorResult
      }, { status: 500 });
    }

    // 2. Se o orquestrador decidiu que o caso está pronto para análise, dispara o pipeline
    let pipelineResults = null;
    if (orchestratorResult.status === 'em_analise') {
      console.log(`[AutoTrigger] Caso ${case_id} aprovado para análise. Disparando pipeline de agentes...`);
      
      try {
        pipelineResults = await rerunPipelineFrom(case_id, null, {
          triggerType: 'automatico',
          rerunReason: 'Trigger automático pós-submissão de formulário'
        });
        console.log(`[AutoTrigger] Pipeline concluído para caso ${case_id}. Resultados:`, pipelineResults);
      } catch (pipelineError: any) {
        console.error(`[AutoTrigger] Erro no pipeline para caso ${case_id}:`, pipelineError);
        // Não retorna erro — o orquestrador já rodou com sucesso
        pipelineResults = { error: pipelineError.message };
      }
    } else {
      console.log(`[AutoTrigger] Caso ${case_id} não está pronto para pipeline. Status: ${orchestratorResult.status}`);
    }

    return NextResponse.json({
      success: true,
      orchestrator: orchestratorResult,
      pipeline: pipelineResults,
      message: `Processamento automático concluído para caso ${case_id}`
    });

  } catch (err: any) {
    console.error('[AutoTrigger] Erro fatal:', err.message);
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: err.message },
      { status: 500 }
    );
  }
}
