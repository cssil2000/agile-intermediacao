import React from 'react';
import Link from 'next/link';
import { fetchAgentOverviewKPIs, fetchCasesAgentBoard } from '@/lib/services/agentObservability/fetchers';
import { AgentStatusBadge } from '@/components/internal/agents/AgentStatusBadge';
import { Activity, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export default async function AgentsOverviewPage() {
  const kpis = await fetchAgentOverviewKPIs();
  const casesBoard = await fetchCasesAgentBoard();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#e5c46e] to-[#cca43b] bg-clip-text text-transparent">
            Cockpit Operacional IA
          </h1>
          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-semibold text-[10px]">
             Painel Mestre de Agentes Especialistas da Agile Intermediação
          </p>
        </div>
        <div className="flex gap-4">
           <Link href="/internal/agents/exceptions" className="flex items-center gap-2 px-4 py-2 border border-red-500/30 bg-red-500/10 text-red-500 rounded-md text-sm font-medium hover:bg-red-500/20 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]">
             <ShieldAlert className="w-4 h-4" />
             Fila de Exceções ({kpis?.reviewCount || 0})
           </Link>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
         <div className="bg-[#141414] border border-[#cca43b]/20 p-5 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Cpu className="w-16 h-16 text-[#cca43b]" />
            </div>
            <p className="text-xs text-[#cca43b] uppercase tracking-wider font-semibold mb-1">Execuções Totais</p>
            <p className="text-3xl font-light text-white">{kpis?.totalRuns || 0}</p>
         </div>

         <div className="bg-[#141414] border border-[#cca43b]/20 p-5 rounded-lg relative overflow-hidden group">
            <p className="text-xs text-rose-500 uppercase tracking-wider font-semibold mb-1">Erros na Malha</p>
            <p className="text-3xl font-light text-white">{kpis?.errorsCount || 0}</p>
         </div>

         <div className="bg-[#141414] border border-[#cca43b]/20 p-5 rounded-lg relative overflow-hidden group">
            <p className="text-xs text-amber-500 uppercase tracking-wider font-semibold mb-1">A Aguardar Humanos</p>
            <p className="text-3xl font-light text-white">{kpis?.reviewCount || 0}</p>
         </div>

         <div className="bg-[#141414] border border-[#cca43b]/20 p-5 rounded-lg relative overflow-hidden group">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Principal Ofensor (Falhas)</p>
            <p className="text-xl mt-2 font-mono text-white/80 line-clamp-1">{kpis?.mostFailingAgent || 'A Apurar'}</p>
         </div>
      </div>

      {/* Tabela de Dissecção Visual */}
      <div className="bg-[#141414] border border-[#cca43b]/10 rounded-lg overflow-hidden shadow-2xl">
         <div className="p-4 border-b border-[#cca43b]/10 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#cca43b]" />
            <h2 className="text-sm font-semibold text-white tracking-widest uppercase">Tubos de Ensaio Operacionais</h2>
         </div>
         
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-300">
               <thead className="bg-[#0A0A0A] text-xs uppercase bg-opacity-80">
                  <tr>
                     <th className="px-6 py-4 font-semibold text-[#cca43b]">Ref & Ativo</th>
                     <th className="px-6 py-4 font-semibold text-[#cca43b]">Cliente</th>
                     <th className="px-6 py-4 font-semibold text-[#cca43b]">Status Financeiro</th>
                     <th className="px-6 py-4 font-semibold text-[#cca43b] text-center" colSpan={7}>Pipeline Diagnóstico (E-S-R-C-P)</th>
                     <th className="px-6 py-4 font-semibold text-[#cca43b] text-right">Ação</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#cca43b]/5">
                  {casesBoard.map((c) => (
                    <tr key={c.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                       <td className="px-6 py-4">
                          <p className="font-mono text-xs text-slate-400 mb-1">{c.ref}</p>
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                             {c.asset}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <p className="font-medium text-white truncate max-w-[150px]">{c.client}</p>
                          <p className="text-xs text-slate-500 mt-1">R$ {(c.value / 1000).toFixed(0)}k Estimado</p>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                             <div className="text-xs text-white bg-slate-800 px-2 py-1 rounded inline-block">{c.commercial_status || 'desconhecido'}</div>
                             <div className="text-[10px] uppercase font-semibold text-[#cca43b]">{c.priority}</div>
                          </div>
                       </td>
                       
                       {/* Pipeline Visual Array */}
                       <td className="pl-6 py-4"><AgentStatusBadge status={c.statusMap.eligibility} /></td>
                       <td className="py-4"><AgentStatusBadge status={c.statusMap.scoring} /></td>
                       <td className="py-4"><AgentStatusBadge status={c.statusMap.summary} /></td>
                       <td className="py-4"><AgentStatusBadge status={c.statusMap.commercial} /></td>
                       <td className="pr-6 py-4"><AgentStatusBadge status={c.statusMap.pending} /></td>

                       <td className="px-6 py-4 text-right">
                          <Link href={`/internal/agents/${c.id}`} className="text-[#cca43b] hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest border border-[#cca43b]/30 px-3 py-1.5 rounded bg-[#cca43b]/5 hover:bg-[#cca43b]/20">
                             Ver Pipeline
                          </Link>
                       </td>
                    </tr>
                  ))}

                  {casesBoard.length === 0 && (
                     <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                           A grelha de operações encontra-se asséptica no momento.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
      
    </div>
  );
}
