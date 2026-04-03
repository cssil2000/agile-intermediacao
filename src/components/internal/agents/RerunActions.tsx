'use client';

import React, { useState } from 'react';
import { Play, FastForward, RotateCcw } from 'lucide-react';
import { RerunConfirmModal } from './RerunConfirmModal';
import { useRouter } from 'next/navigation';

interface RerunActionsProps {
  caseId: string;
  agentName: string;
}

export function RerunActions({ caseId, agentName }: RerunActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rerunType, setRerunType] = useState<'single' | 'pipeline'>('single');
  const router = useRouter();

  const handleOpenModal = (type: 'single' | 'pipeline') => {
    setRerunType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
      <button
        onClick={() => handleOpenModal('single')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-all border border-slate-700 uppercase tracking-wider"
      >
        <RotateCcw className="w-3 h-3 text-[#cca43b]" />
        Reexecutar Agente
      </button>

      <button
        onClick={() => handleOpenModal('pipeline')}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#cca43b]/10 hover:bg-[#cca43b]/20 text-[#cca43b] text-[11px] font-semibold transition-all border border-[#cca43b]/20 uppercase tracking-wider"
      >
        <FastForward className="w-3 h-3" />
        Seguir Pipeline
      </button>

      <RerunConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        caseId={caseId}
        agentName={agentName}
        type={rerunType}
        onSuccess={() => {
          setIsModalOpen(false);
          router.refresh(); // Atualiza a Server Page para mostrar o novo log
        }}
      />
    </div>
  );
}
