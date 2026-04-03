/**
 * Script de Teste: Agente de Elegibilidade
 * 
 * Uso: npx ts-node scripts/test-agent-eligibility.ts <CASE_ID>
 */

import { runEligibilityAgent } from '../src/lib/services/agents/eligibilityAgent';

async function testEligibilityAgent() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO AGENTE MESTRE: ELEGIBILIDADE ---');
  
  if (!caseId) {
    console.error('❌ ERRO: É obrigatório fornecer um Case ID.');
    console.log('Uso: npx ts-node -r tsconfig-paths/register scripts/test-agent-eligibility.ts <CASE_ID>');
    process.exit(1);
  }

  try {
    console.log(`Iniciando a leitura do funil e regras de negócio para o caso: ${caseId}...`);
    const response = await runEligibilityAgent(caseId);
    
    if (response.status === 'erro_interno' as any) {
      console.error('❌ Agente falhou com erro sintático ou exceção.');
      if (response.warnings.length) console.error('Mensagem:', response.warnings.join(' | '));
    } else {
      console.log('\n✅ Cérebro da Elegibilidade Concluído!\n');
      console.log('Tipo de Ativo:', response.result.asset_type.toUpperCase());
      console.log('Decisão Final:', response.result.eligibility_status.toUpperCase());
      
      console.log('\n📝 Motivo Principal:');
      console.log('>>', response.result.primary_reason);
      
      console.log('\n🎯 Flags Estratégicos Acionados:');
      if (response.result.flags.length > 0) {
         response.result.flags.forEach(f => console.log('  [X]', f));
      } else {
         console.log('  (Nenhum flag acionado)');
      }

      console.log('\n⚙️ Próxima Ação Delineada:', response.result.next_action);
      console.log(`👤 Exige Revisão Humana OBRIGATÓRIA? ${response.result.needs_human_review ? 'SIM 🔴' : 'NÃO 🟢'}`);
      
      if (response.warnings && response.warnings.length > 0) {
          console.log('\n⚠️ Alertas do Sistema:');
          response.warnings.forEach(w => console.log('  -', w));
      }
    }
  } catch (err: any) {
    console.error('💥 Excepção Fatal:', err);
  }
}

testEligibilityAgent();
