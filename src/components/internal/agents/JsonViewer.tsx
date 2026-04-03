"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code } from 'lucide-react';

export const JsonViewer: React.FC<{ data: any; title?: string }> = ({ data, title = 'Ver Payload Bruto JSON' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 border border-[#cca43b]/20 rounded-md overflow-hidden bg-[#0A0A0A]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-[#141414] hover:bg-[#1a1a1a] transition-colors border-b border-[#cca43b]/10 text-xs font-semibold text-[#cca43b]"
      >
        <span className="flex items-center gap-2">
          <Code className="w-4 h-4" />
          {title}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="p-4 overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
          <pre className="text-[11px] text-slate-300 font-mono leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
