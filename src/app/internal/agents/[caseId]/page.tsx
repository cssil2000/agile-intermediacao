import React from 'react';
import Link from 'next/link';
import { fetchPipelineDetail } from '@/lib/services/agentObservability/fetchers';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, AlertTriangle, FileJson } from 'lucide-react';
import { AgentStatusBadge } from '@/components/internal/agents/AgentStatusBadge';
import { JsonViewer } from '@/components/internal/agents/JsonViewer';
import { RerunActions } from '@/components/internal/agents/RerunActions';

export default async function PipelineCaseDetailPage({ params }: { params: { caseId: string } }) {
  const caseId = params.caseId;

  // Busca dados de cabeçalho (Opcional poderiamos colocar num fetcher, mas fazemos query direto para agilizar a Page)
  const { data: bCase } = await supabase.from('cases').select('internal_reference, asset_type, eligibility_status').eq('id', caseId).single();
  
  const timeline = await fetchPipelineDetail(caseId);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      <div className="mb-10 border-b border-[#cca43b]/20 pb-6">
        <Link href="/internal/agents" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#cca43b] transition-colors mb-4 text-xs tracking-wider uppercase">
           <ArrowLeft className="w-3 h-3" /> Dashboard Principal
        </Link>
        <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  <FileJson className="w-6 h-6 text-[#cca43b]" />
                  Pipeline Inspector
               </h1>
               <p className="text-slate-400 mt-1 text-sm font-mono">
                  Ref: <span className="text-white">{bCase?.internal_reference || caseId}</span> | Ativo: <span className="uppercase text-[#cca43b]">{bCase?.asset_type || 'Desconhecido'}</span>
               </p>
            </div>
            <div className="text-right">
               <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Status Oficial do Processo</p>
               <span className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded text-sm font-semibold">{bCase?.eligibility_status || 'desconhecido'}</span>
            </div>
        </div>
      </div>

      <div className="max-w-4xl">
         <h2 className="text-lg font-semibold text-[#cca43b] mb-6 tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4" /> Timeline Cronológica de Execução
         </h2>

         <div className="relative border-l border-[#cca43b]/20 ml-3 space-y-8 pb-12">
            {timeline.map((run: any, idx: number) => (
               <div key={run.id} className="relative pl-8">
                  {/* Ponto da Timeline */}
                  <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-4 ring-[#0A0A0A] ${run.run_status === 'success' ? 'bg-emerald-500/20' : run.run_status === 'error' ? 'bg-rose-500/20' : 'bg-[#cca43b]/20'}`}>
                     <div className={`w-2 h-2 rounded-full ${run.run_status === 'success' ? 'bg-emerald-500' : run.run_status === 'error' ? 'bg-rose-500' : 'bg-[#cca43b]'}`}></div>
                  </span>

                  <div className="bg-[#141414] border border-[#cca43b]/10 rounded-lg p-5 shadow-lg">
                     <div className="flex justify-between items-start mb-3">
                        <div>
                           <h3 className="font-semibold text-white tracking-wide">{run.agent_name}</h3>
                           <p className="text-[10px] text-slate-500 font-mono mt-1">
                              {new Date(run.created_at).toLocaleString('pt-PT')}
                           </p>
                        </div>
                        <AgentStatusBadge status={run.run_status} needsReview={run.needs_human_review} />
                     </div>

                     {/* Warnings Section */}
                     {run.warnings && run.warnings.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3 mb-4">
                           <div className="flex items-center gap-2 text-amber-500 mb-2">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs font-semibold uppercase tracking-wider">Avisos da Máquina</span>
                           </div>
                           <ul className="list-disc pl-5 text-slate-300 text-xs space-y-1">
                              {run.warnings.map((w: string, i: number) => (
                                 <li key={i}>{w}</li>
                              ))}
                           </ul>
                        </div>
                     )}

                     {run.error_message && (
                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-3 mb-4 text-xs text-rose-400">
                           <strong className="block mb-1">Fatal Error:</strong>
                           {run.error_message}
                        </div>
                     )}

                     <JsonViewer data={run.output_payload} title="Inspecionar Retorno Estruturado" />
                     
                     <RerunActions 
                        caseId={caseId} 
                        agentName={run.agent_name} 
                     />
                  </div>
               </div>
            ))}

            {timeline.length === 0 && (
               <div className="pl-8 text-slate-500 text-sm italic">
                  Nenhum rasto de Agentes detectado neste processo.
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
