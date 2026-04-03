import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestCase() {
  console.log('--- Criando Caso de Teste para Reruns ---');
  
  // 1. Criar Lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      full_name: 'António Rerun Teste',
      email: 'rerun.test@agile.pt',
      phone: '+351912345678',
      lead_type: 'usuario_comum',
      source: 'teste_manual'
    })
    .select()
    .single();

  if (leadError) {
    console.error('Erro ao criar lead:', leadError);
    return;
  }

  // 2. Criar Caso
  const { data: kase, error: caseError } = await supabase
    .from('cases')
    .insert({
      lead_id: lead.id,
      asset_type: 'trabalhista',
      process_number: '1234567-89.2023.5.04.0001',
      internal_reference: 'TR-RERUN-001',
      case_status: 'recebido'
    })
    .select()
    .single();

  if (caseError) {
    console.error('Erro ao criar caso:', caseError);
    return;
  }

  // 3. Criar uma rodada de agente para aparecer na lista
  const { error: runError } = await supabase
    .from('agent_runs')
    .insert({
      case_id: kase.id,
      agent_name: 'capture_normalization_agent',
      run_status: 'success',
      input_payload: { caseId: kase.id },
      output_payload: { status: 'em_analise', result: { completeness_score: 85 } }
    });

  if (runError) {
    console.error('Erro ao criar run:', runError);
    return;
  }

  console.log('✅ Caso de teste criado com Sucesso!');
  console.log('ID do Caso:', kase.id);
  console.log('Aceda a: http://localhost:3000/internal/agents/' + kase.id);
}

createTestCase();
