/**
 * Script de Teste: Agente Comercial e Notificações
 * 
 * Uso: npx ts-node -r tsconfig-paths/register scripts/test-agent-commercial.ts <CASE_ID>
 */

import { runCommercialNotificationAgent } from '../src/lib/services/agents/commercialNotificationAgent';

async function testCommercialAgent() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO AGENTE: COMERCIAL & NOTIFICAÇÕES ---');
  
  if (!caseId) {
    console.error('❌ ERRO: Faltou o Case ID.');
    process.exit(1);
  }

  try {
    const response = await runCommercialNotificationAgent(caseId);
    
    if (response.status === 'erro_interno' as any) {
      console.error('💥 Falha Crítica:', response.warnings.join(' | '));
    } else {
      
      const r = response.result;

      if (r.should_create_alert) {
          console.log('\n🚨 [ALERTA ATIVADO] A IA REQUER ATENÇÃO! 🚨\n');
          console.log(`📡 Tipo de Disparo: ${r.alert_type.toUpperCase()}`);
          console.log(`🔥 Prioridade Urgência: ${r.alert_priority.toUpperCase()}`);
          console.log(`👥 Destinatários Internos: [ ${r.notify_roles.join(' • ').toUpperCase()} ]`);
          
          console.log('\n--- MOTIVO DO DISPARO ---');
          console.log(`>> ${r.alert_reason}`);

          console.log('\n--- PAYLOAD SNAPSHOT MOCKUP PARA A EQUIPA ---');
          if (r.commercial_summary) {
             const s = r.commercial_summary;
             console.log(` | Lead: ${s.lead_name} (${s.asset_type.toUpperCase()})`);
             console.log(` | Alvo Judicial: ${s.entity}`);
             console.log(` | Risco Avaliado: ${s.risk.toUpperCase()}`);
             console.log(` | Sumário Rápido: ${s.summary}`);
             console.log(` | Valor Potencial: R$ ${(s.value / 1000).toFixed(0)} Milhões / Milhares`);
             console.log(` | Acão Obrigatória de Receção: ${s.next_step.toUpperCase()}`);
          }
          
      } else {
          console.log('\n🔇 [SILENCIADOR ATIVO] CASO FECHADO PARA ALERTAS 🔇\n');
          console.log(`Motivo Mestre: ${r.alert_reason}`);
          console.log(`Fluxo Operacional atualizado para: ${r.commercial_status}`);
      }

      console.log('\n======================================');
      console.log(`Estatuto Final a gravar na DB 'cases': ${r.commercial_status.toUpperCase()}`);
      console.log('======================================\n');
      
      if (response.warnings && response.warnings.length > 0) {
          console.log('\n⚠️ Avisos Finais:');
          response.warnings.forEach(w => console.log('  -', w));
      }
    }
  } catch (err: any) {
    console.error('💥 Erro Interno:', err);
  }
}

testCommercialAgent();
