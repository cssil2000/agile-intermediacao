'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  Loader2, 
  RotateCcw, 
  FastForward,
  CheckCircle2
} from 'lucide-react';
import { triggerAgentRerun, triggerPipelineRerun } from '@/lib/actions/agent-actions';

interface RerunConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  agentName: string;
  type: 'single' | 'pipeline';
  onSuccess?: () => void;
}

export function RerunConfirmModal({ 
  isOpen, 
  onClose, 
  caseId, 
  agentName, 
  type,
  onSuccess 
}: RerunConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Por favor, indique um motivo para a reexecução.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Nota: Num cenário real, o email viria da sessão. Aqui simulamos o user atual.
      const userEmail = 'analista.operacional@agile.pt'; 
      
      let res;
      if (type === 'single') {
        res = await triggerAgentRerun(caseId, agentName, reason, userEmail);
      } else {
        res = await triggerPipelineRerun(caseId, agentName, reason, userEmail);
      }

      if (res.success) {
        setIsComplete(true);
        setTimeout(() => {
          onSuccess?.();
          reset();
        }, 1500);
      } else {
        setError(res.error || 'Ocorreu um erro ao disparar o agente.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function reset() {
    setReason('');
    setError(null);
    setIsComplete(false);
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#141414] border border-[#cca43b]/20 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-[#cca43b]/10 flex items-center justify-center">
                {type === 'single' ? <RotateCcw className="w-5 h-5 text-[#cca43b]" /> : <FastForward className="w-5 h-5 text-[#cca43b]" />}
             </div>
             <div>
                <h3 className="font-bold text-white tracking-wide">Confirmar Reexecução</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Garantia de Auditoria Operacional</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isComplete ? (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
               <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
               <h4 className="text-xl font-bold text-white mb-2">Comando Executado!</h4>
               <p className="text-slate-400 text-sm">Os logs serão atualizados em instantes na timeline.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Você está prestes a <span className="text-white font-bold">{type === 'single' ? 'REEXECUTAR' : 'REINICIAR O PIPELINE'}</span> a partir do agente 
                  <span className="text-[#cca43b] font-mono mx-1 px-1.5 py-0.5 bg-[#cca43b]/10 rounded">{agentName}</span>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                   Motivo da Reexecução <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Novos documentos anexados, correção de dados cadastrais pelo analista..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#cca43b]/40 focus:border-[#cca43b]/40 min-h-[100px] transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-400 leading-normal">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:bg-slate-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-3 px-6 py-2.5 rounded-lg bg-[#cca43b] hover:bg-[#d4b04d] text-black text-sm font-bold shadow-lg shadow-[#cca43b]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Ação'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
