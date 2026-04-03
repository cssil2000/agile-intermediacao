/**
 * Script de Teste: Agente de Scoring & Risco
 * 
 * Uso: npx ts-node -r tsconfig-paths/register scripts/test-agent-scoring.ts <CASE_ID>
 */

import { runRiskScoringAgent } from '../src/lib/services/agents/riskScoringAgent';

async function testScoringAgent() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO AGENTE DE SCORING E RISCO ---');
  
  if (!caseId) {
    console.error('❌ ERRO: Faltou o Case ID.');
    process.exit(1);
  }

  try {
    const response = await runRiskScoringAgent(caseId);
    
    if (response.status === 'erro_interno' as any) {
      console.error('💥 Fallied:', response.warnings.join(' | '));
    } else {
      console.log('\n🔋 CALIBRAGEM CONCLUÍDA!\n');
      console.log('--- REPORT QUANTITATIVO (0-100) ---');
      console.log(`⚖️ Segurança Jurídica:   ${response.result.scores.legal_risk_score} [${response.result.classifications.legal_risk_level.toUpperCase()}]`);
      console.log(`💰 Retabilidade/Financeiro: ${response.result.scores.financial_risk_score} [${response.result.classifications.financial_risk_level.toUpperCase()}]`);
      console.log(`🚀 Prioridade Comercial:  ${response.result.scores.commercial_priority_score} [${response.result.classifications.commercial_priority_level.toUpperCase()}]`);
      console.log(`📄 Qualidade Documental:  ${response.result.scores.documentation_quality_score} [${response.result.classifications.documentation_quality_level.toUpperCase()}]`);
      
      console.log('\n======================================');
      console.log(`⚡ OVERALL OPERATIONAL SCORE: ${response.result.scores.overall_operational_score} ⚡`);
      console.log(`🏷️ Priority Label: ${response.result.classifications.priority_label.toUpperCase()}`);
      console.log('======================================\n');
      
      console.log('📝 Resumo Dinâmico (risk_summary):');
      console.log(response.result.risk_summary);

      if (response.warnings && response.warnings.length > 0) {
          console.log('\n⚠️ Avisos Finais:');
          response.warnings.forEach(w => console.log('  -', w));
      }
    }
  } catch (err: any) {
    console.error('💥 Erro:', err);
  }
}

testScoringAgent();
