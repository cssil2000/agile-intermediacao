/**
 * Script de Teste: Agente de Pendências & Recontacto
 * 
 * Uso: npx ts-node -r tsconfig-paths/register scripts/test-agent-pending.ts <CASE_ID>
 */

import { runPendingRecontactAgent } from '../src/lib/services/agents/pendingRecontactAgent';

async function testPendingAgent() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO AGENTE: PENDÊNCIAS E RECONTACTO (NLP & ROI) ---');
  
  if (!caseId) {
    console.error('❌ ERRO: Faltou o Case ID.');
    process.exit(1);
  }

  try {
    const response = await runPendingRecontactAgent(caseId);
    
    if (response.status === 'erro_interno' as any) {
      console.error('💥 Falha Crítica:', response.warnings.join(' | '));
    } else {
      
      const r = response.result;

      if (r.recommended_pending_action === 'ignorar_nao_pendente') {
          console.log('\n🟢 O Processo fluiu imaculadamente na triagem.');
          console.log('Motivo: Sem sinalização de falta de provas ou cimentado pela IA como completo.');
      } else if (r.recommended_pending_action === 'ignorar_baixo_valor') {
          console.log('\n🔴 [FALHAS DETETADAS MAS IGNORADAS POR BAIXO ROI] 🔴\n');
          console.log(`Documentação Ausente: ${r.pending_items.join(' + ')}`);
          console.log(`O Avaliador de ROI marcou o esforço de recontacto com Rentabilidade NULA. Arquivado preventivamente.`);
      } else {
          console.log('\n🟡 ALARME DOCUMENTAL - ROI ELEVADO 🟡\n');
          console.log(`O motor identificou falha do tipo: [${r.pending_type.toUpperCase()}]`);
          console.log(`Peças em Falta: ${r.pending_items.join(', ')}\n`);

          console.log('--- RECOMENDAÇÃO OPERACIONAL ---');
          console.log(`Canal de Disparo Recomendado: ${r.recommended_pending_action.toUpperCase()} (Rentabilidade Aparente: ${r.pending_recovery_worth.toUpperCase()})\n`);

          console.log('--- MENSAGERIA NLP GERADA PRONTA A DISPARAR ---');
          console.log(`[ASSUNTO] ${r.pending_request_subject}`);
          console.log(`\n[WHATSAPP PUSH / SHORT MSG]\n${r.pending_request_message_short}`);
          console.log(`\n[EMAIL FORMAL / LONG MSG]\n${r.pending_request_message_full}`);
      }

      console.log('\n======================================');
      if (response.warnings && response.warnings.length > 0) {
          console.log('\n⚠️ Avisos Finais:');
          response.warnings.forEach(w => console.log('  -', w));
      }
    }
  } catch (err: any) {
    console.error('💥 Erro Interno do Sistema Back-End:', err);
  }
}

testPendingAgent();
