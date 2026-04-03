/**
 * Script de Teste: Agente de Resumo Executivo
 * 
 * Uso: npx ts-node -r tsconfig-paths/register scripts/test-agent-summary.ts <CASE_ID>
 */

import { runExecutiveSummaryAgent } from '../src/lib/services/agents/executiveSummaryAgent';

async function testSummaryAgent() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO AGENTE: RESUMO EXECUTIVO ---');
  
  if (!caseId) {
    console.error('❌ ERRO: Faltou o Case ID.');
    process.exit(1);
  }

  try {
    const response = await runExecutiveSummaryAgent(caseId);
    
    if (response.status === 'erro_interno' as any) {
      console.error('💥 Fallied:', response.warnings.join(' | '));
    } else {
      console.log('\n🎙️ DISCURSO GERADO COM SUCESSO!\n');
      
      console.log('--- 1. SHORT SUMMARY (Para Cards/Grids) ---');
      console.log(response.result.executive_summary_short);
      
      console.log('\n--- 2. FULL SUMMARY (Para Detalhe do Caso) ---');
      console.log(response.result.executive_summary_full);
      
      console.log('\n--- 3. KEY ATTENTION POINTS ---');
      if (response.result.key_attention_points.length === 0) {
           console.log(' N/A');
      } else {
           response.result.key_attention_points.forEach(k => console.log(' ⚠️', k));
      }

      console.log('\n======================================');
      console.log(`🎯 PRÓXIMO PASSO RECOMENDADO DA MÁQUINA:`);
      console.log(`>> [ ${response.result.recommended_next_action?.toUpperCase()} ]`);
      console.log('======================================\n');
      

      if (response.warnings && response.warnings.length > 0) {
          console.log('\n⚠️ Avisos Finais:');
          response.warnings.forEach(w => console.log('  -', w));
      }
    }
  } catch (err: any) {
    console.error('💥 Erro:', err);
  }
}

testSummaryAgent();
