import React from 'react';
import Link from 'next/link';
import { fetchExceptionQueue } from '@/lib/services/agentObservability/fetchers';
import { ShieldAlert, ArrowLeft, ExternalLink } from 'lucide-react';
import { JsonViewer } from '@/components/internal/agents/JsonViewer';

export default async function AgentsExceptionsPage() {
  const exceptions = await fetchExceptionQueue();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      <div className="mb-8">
        <Link href="/internal/agents" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#cca43b] transition-colors mb-4 text-xs tracking-wider uppercase">
           <ArrowLeft className="w-3 h-3" /> Dashboard Principal
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
          Fila de Intervenção Humana
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl">
          Visão focada nos pipelines que desencadearam a flag <code className="bg-rose-500/10 text-rose-400 px-1 py-0.5 rounded text-xs border border-rose-500/20">needs_human_review</code> ou onde as máquinas falharam catastroficamente e requerem relançamento.
        </p>
      </div>

      <div className="space-y-4 max-w-5xl">
        {exceptions.map((ex: any) => (
          <div key={ex.id} className={`p-5 rounded-lg border bg-[#141414] ${ex.run_status === 'error' ? 'border-rose-500/30' : 'border-amber-500/30'}`}>
             <div className="flex justify-between items-start mb-4">
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg text-white">{ex.cases?.leads?.full_name || 'Desconhecido'}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                         {ex.cases?.asset_type}
                      </span>
                      {ex.run_status === 'error' ? (
                         <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded text-xs font-semibold">Engine Crash</span>
                      ) : (
                         <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-semibold">Humano Requisitado</span>
                      )}
                   </div>
                   <p className="text-xs text-slate-400 font-mono">Ref: {ex.cases?.internal_reference} | Agente Travado: <span className="text-white">{ex.agent_name}</span></p>
                </div>
                
                <Link 
                   href={`/internal/agents/${ex.case_id}`}
                   className="flex items-center gap-2 bg-[#cca43b]/10 text-[#cca43b] hover:bg-[#cca43b]/20 px-4 py-2 rounded-md transition-colors text-xs font-semibold uppercase border border-[#cca43b]/20"
                >
                   Inspecionar Pipeline <ExternalLink className="w-3 h-3" />
                </Link>
             </div>

             <div className="bg-black/30 p-4 rounded border border-white/5">
                <p className="text-sm text-slate-300">
                   <strong>Motivo Formal:</strong> {ex.error_message || (ex.warnings && ex.warnings.length > 0 ? ex.warnings.join(' | ') : 'Decisão arquitetural do Agente exigiu revisão manual baseada nas métricas.')}
                </p>
             </div>

             <JsonViewer data={ex.output_payload} title={`Consultar Restituição JSON do Agente (${ex.agent_name})`} />
          </div>
        ))}
        
        {exceptions.length === 0 && (
          <div className="bg-[#141414] border border-[#cca43b]/20 p-12 rounded-lg text-center">
             <ShieldAlert className="w-12 h-12 text-[#cca43b]/50 mx-auto mb-4" />
             <h3 className="text-lg font-medium text-white mb-2">Fila Asséptica</h3>
             <p className="text-slate-400 text-sm">Não existem processos parados aguardando revisão humana na camada operacional.</p>
          </div>
        )}
      </div>

    </div>
  );
}
