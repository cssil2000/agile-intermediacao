import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface AgentStatusBadgeProps {
  status: string;
  needsReview?: boolean;
}

export const AgentStatusBadge: React.FC<AgentStatusBadgeProps> = ({ status, needsReview }) => {
  if (needsReview) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        Human Review
      </span>
    );
  }

  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5" />
          Success
        </span>
      );
    case 'error':
    case 'erro_interno':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" />
          Failed
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Clock className="w-3.5 h-3.5 animate-spin-slow" />
          Running
        </span>
      );
    case 'not_run':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Pending
        </span>
      );
  }
};
