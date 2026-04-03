/**
 * Script de Teste: Integração Jusbrasil
 * Este script simula uma consulta por CNJ associada a um Case ID.
 * 
 * Uso: npx ts-node scripts/test-jusbrasil-integration.ts <CASE_ID> <CNJ>
 */

import { queryJusbrasilByCNJ } from '../src/lib/tools/legal-tools';

async function testQuery() {
  const caseId = process.argv[2];
  const cnj = process.argv[3] || '0000000-00.2023.8.26.0000'; // Exemplo fictício

  console.log('--- TESTE DE INTEGRAÇÃO JUSBRASIL ---');
  
  if (!caseId) {
    console.warn('⚠️ Nenhum Case ID fornecido. A consulta não será associada a um processo no Supabase.');
  }

  try {
    const result = await queryJusbrasilByCNJ(cnj, caseId);
    
    if (result.success) {
      console.log('✅ Sucesso!');
      console.log('Retorno:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ Erro:', result.error);
    }
  } catch (err) {
    console.error('💥 Excepção:', err);
  }
}

testQuery();
