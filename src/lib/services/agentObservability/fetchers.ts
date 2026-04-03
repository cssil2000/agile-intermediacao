import { supabase } from '@/lib/supabase';

// 1. Fetch KPI Overview
export async function fetchAgentOverviewKPIs() {
   // Obtém todas as exceções globais ou erros nos agent_runs
   const { data: runs, error } = await supabase
       .from('agent_runs')
       .select('run_status, needs_human_review, agent_name, warnings');

   if (error || !runs) return null;

   const totalRuns = runs.length;
   const errorsCount = runs.filter(r => r.run_status === 'error' || r.run_status === 'erro_interno').length;
   const reviewCount = runs.filter(r => r.needs_human_review === true).length;
   
   // Falhas frequentes (Top Agent com erros)
   const errorFreq: Record<string, number> = {};
   runs.forEach(r => {
      if (r.run_status !== 'success') {
         errorFreq[r.agent_name] = (errorFreq[r.agent_name] || 0) + 1;
      }
   });
   
   const mostFailingAgent = Object.entries(errorFreq).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Nenhum';

   return { totalRuns, errorsCount, reviewCount, mostFailingAgent };
}

// 2. Tabela de Casos (Estado dos Agentes)
export async function fetchCasesAgentBoard() {
  const { data: cases, error } = await supabase
      .from('cases')
      .select(`
         id,
         internal_reference,
         asset_type,
         eligibility_status,
         commercial_status,
         ready_for_commercial,
         needs_human_review,
         leads ( full_name, estimated_value ),
         risk_scores ( priority_label ),
         agent_runs ( agent_name, run_status, updated_at )
      `)
      .order('created_at', { ascending: false });

  if (error || !cases) return [];

  // Mapear agentes para rápida vista
  return cases.map((c: any) => {
      const runs = c.agent_runs || [];
      const latestRun = runs.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
      
      const statusMap = {
         capture: runs.find((r: any) => r.agent_name === 'capture_agent')?.run_status || 'not_run',
         extraction: runs.find((r: any) => r.agent_name === 'legal_extraction_agent')?.run_status || 'not_run',
         eligibility: runs.find((r: any) => r.agent_name === 'eligibility_agent')?.run_status || 'not_run',
         scoring: runs.find((r: any) => r.agent_name === 'risk_scoring_agent')?.run_status || 'not_run',
         summary: runs.find((r: any) => r.agent_name === 'executive_summary_agent')?.run_status || 'not_run',
         commercial: runs.find((r: any) => r.agent_name === 'commercial_notification_agent')?.run_status || 'not_run',
         pending: runs.find((r: any) => r.agent_name === 'pending_recontact_agent')?.run_status || 'not_run'
      };

      return {
         id: c.id,
         ref: c.internal_reference,
         client: c.leads?.full_name || 'Desconhecido',
         asset: c.asset_type,
         value: c.leads?.estimated_value || 0,
         eligibility_status: c.eligibility_status,
         commercial_status: c.commercial_status,
         priority: c.risk_scores?.[0]?.priority_label || '-',
         needs_review: c.needs_human_review,
         latest_agent: latestRun ? latestRun.agent_name : 'Nenhum',
         statusMap
      };
  });
}

// 3. Puxar Pipeline Especifico
export async function fetchPipelineDetail(caseId: string) {
   const { data: runs, error } = await supabase
       .from('agent_runs')
       .select('*')
       .eq('case_id', caseId)
       .order('created_at', { ascending: true }); // Cronológico

   return error ? [] : runs;
}

// 4. Exceções Reais Requerendo Ação
export async function fetchExceptionQueue() {
   const { data: exceptions, error } = await supabase
       .from('agent_runs')
       .select(`
           *,
           cases ( internal_reference, asset_type, leads ( full_name ) )
       `)
       .or('run_status.eq.error,needs_human_review.eq.true')
       .order('created_at', { ascending: false });

   return error ? [] : exceptions;
}
