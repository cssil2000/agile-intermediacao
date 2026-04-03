/**
 * Script de Teste: Agente de Captura e Normalização
 * 
 * Uso: npx ts-node scripts/test-agent-capture.ts <CASE_ID>
 */

import { runCaptureNormalizationAgent } from '../src/lib/services/agents/captureNormalizationAgent';

async function testCaptureAgent() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO AGENTE: CAPTURA E NORMALIZAÇÃO ---');
  
  if (!caseId) {
    console.error('❌ ERRO: É obrigatório fornecer um Case ID.');
    console.log('Uso: npx ts-node -r tsconfig-paths/register scripts/test-agent-capture.ts <CASE_ID>');
    process.exit(1);
  }

  try {
    console.log(`Iniciando agente para o caso: ${caseId}...`);
    const response = await runCaptureNormalizationAgent(caseId);
    
    if (response.status === 'erro_interno') {
      console.error('❌ Agente falhou com erro.');
      console.error('Mensagem:', response.log_message);
    } else {
      console.log('✅ Agente concluído!');
      console.log('Status de Normalização:', response.log_message);
      console.log('Completeness Score:', `${response.result.completeness_score}/100 (${response.result.completeness_level})`);
      
      console.log('\nDados Faltantes (Obrigatórios):', response.result.missing_required_fields.join(', ') || 'Nenhum');
      console.log('Dados Faltantes (Recomendados):', response.result.missing_recommended_fields.join(', ') || 'Nenhum');
      console.log('Problemas de Formato:', response.result.format_issues.join(', ') || 'Nenhum');
      
      if (response.needs_human_review) {
         console.warn('\n⚠️ Atenção: O agente identificou problemas que podem necessitar de revisão humana.');
      }
      if (response.result.ready_for_next_step) {
         console.log('\n🟢 Caso pronto para a próxima etapa (Ex: Extração/Elegibilidade)!');
      } else {
         console.log('\n🟡 Caso bloqueado. Requer preenchimento de dados.');
      }
      
      console.log('\n--- DADOS NORMALIZADOS OBTIDOS ---');
      console.log(JSON.stringify(response.result.normalized_data, null, 2));
    }
    
  } catch (err: any) {
    console.error('💥 Excepção Fatal:', err);
  }
}

testCaptureAgent();
