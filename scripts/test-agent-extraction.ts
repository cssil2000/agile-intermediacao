/**
 * Script de Teste: Agente de Extração Jurídica e Documental
 * 
 * Uso: npx ts-node scripts/test-agent-extraction.ts <CASE_ID>
 */

import { runLegalExtractionAgent } from '../src/lib/services/agents/legalExtractionAgent';

async function testExtractionAgent() {
  const caseId = process.argv[2];

  console.log('--- TESTE DO AGENTE MESTRE: EXTRAÇÃO JURÍDICA ---');
  
  if (!caseId) {
    console.error('❌ ERRO: É obrigatório fornecer um Case ID.');
    console.log('Uso: npx ts-node -r tsconfig-paths/register scripts/test-agent-extraction.ts <CASE_ID>');
    process.exit(1);
  }

  try {
    console.log(`Iniciando o leitor de APIs e Documentos para o caso: ${caseId}...`);
    const response = await runLegalExtractionAgent(caseId);
    
    if (response.status === 'erro_interno' as any) {
      console.error('❌ Agente falhou com erro.');
      console.error('Mensagem:', response.log_message);
    } else {
      console.log('✅ Extração Concluída!');
      console.log('Log System:', response.log_message);
      console.log('Grau de Confiança Geral:', response.result.extraction_confidence);
      
      console.log('\nFontes Utilizadas com Sucesso:');
      console.log(`- Supabase interno: ${response.result.source_summary.supabase ? 'Sim' : 'Não'}`);
      console.log(`- Escavador API: ${response.result.source_summary.escavador ? 'Sim' : 'Não'}`);
      console.log(`- Leitor de Documentos (PDF/Mock): ${response.result.source_summary.documents ? 'Sim' : 'Não'}`);
      
      console.log('\nDados Faltantes Críticos:', response.result.missing_critical_fields.join(', ') || 'Nenhum');
      if (response.result.conflicting_fields.length > 0) {
          console.log('⚠️ CONFLITOS DETETADOS (Forms vs Escavador/Docs):', response.result.conflicting_fields.join(', '));
      } else {
          console.log('Conflitos de Dados:', 'Nenhum');
      }

      console.log('\n--- DADOS EXTRAÍDOS RESULTANTES ---');
      console.log(JSON.stringify(response.result.extracted_fields, null, 2));

      if (response.needs_human_review) {
         console.warn('\n⚠️ O caso exige revisão humana antes de prosseguir (Possível Conflito ou Baixa Confiança).');
      }
    }
    
  } catch (err: any) {
    console.error('💥 Excepção Fatal:', err);
  }
}

testExtractionAgent();
