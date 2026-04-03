/**
 * Script de Teste: Orquestrador Central
 * 
 * Uso: npx ts-node scripts/test-orchestrator.ts <CASE_ID>
 */

// Como os caminhos com '@' dependem da resolução do Next/Webpack, 
// para executar via ts-node diretamente pode ser necessário usar tsconfig-paths
// Ex: npx ts-node -r tsconfig-paths/register scripts/test-orchestrator.ts <CASE_ID>

import { runOrchestrator } from '../src/lib/services/orchestrator/orchestrator';

async function testOrchestrator() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO ORQUESTRADOR CENTRAL ---');
  
  if (!caseId) {
    console.error('❌ ERRO: É obrigatório fornecer um Case ID.');
    console.log('Uso: npx ts-node -r tsconfig-paths/register scripts/test-orchestrator.ts <CASE_ID>');
    process.exit(1);
  }

  try {
    console.log(`Iniciando orquestração para o case: ${caseId}...`);
    const result = await runOrchestrator(caseId);
    
    if (result.status === 'erro_interno') {
      console.error('❌ Orquestração falhou com erro interno.');
      console.error('Mensagem:', result.log_message);
    } else {
      console.log('✅ Orquestração concluída!');
      console.log('Pipeline Escolhida:', result.pipeline_selected || 'Nenhuma');
      console.log('Status Atualizado:', result.status);
      console.log('Próximos Passos (Agentes):', result.next_steps.join(', ') || 'Nenhum');
      console.log('Dados Faltantes:', result.missing_data.join(', ') || 'Nenhum');
      if (result.needs_human_review) {
         console.warn('⚠️ Atenção: Este caso foi marcado para revisão humana.');
      }
      console.log('\nRetorno Bruto:', JSON.stringify(result, null, 2));
    }
    
  } catch (err: any) {
    console.error('💥 Excepção Fatal:', err);
  }
}

testOrchestrator();
