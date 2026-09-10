import React from 'react';
import { Eye, BrainCircuit, Database, Cpu } from 'lucide-react';

interface ModuleStatusCardProps {
  status: {
    ocr_engine: string;
    ai_analysis: string;
    database: string;
    document_processing: string;
  };
}

export const ModuleStatusCard: React.FC<ModuleStatusCardProps> = ({ status }) => {
  const modules = [
    { name: 'OCR Engine', key: 'ocr_engine', icon: Eye, val: status.ocr_engine },
    { name: 'AI Analysis', key: 'ai_analysis', icon: BrainCircuit, val: status.ai_analysis },
    { name: 'Database', key: 'database', icon: Database, val: status.database },
    { name: 'Document Processing', key: 'document_processing', icon: Cpu, val: status.document_processing },
  ];

  const getStatusColor = (val: string) => {
    switch (val.toLowerCase()) {
      case 'online':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800';
      case 'processing':
        return 'text-blue-400 bg-blue-950/40 border-blue-800 animate-pulse';
      case 'needs attention':
        return 'text-amber-400 bg-amber-950/40 border-amber-800';
      default:
        return 'text-red-400 bg-red-950/40 border-red-800';
    }
  };

  return (
    <div className="glass-card rounded-xl border border-[#435568] p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#435568]/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A9C9EE]">
          Module Status
        </h4>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
      </div>

      <div className="space-y-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.key} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center space-x-2.5 text-[#F0F4F8]">
                <Icon className="w-4 h-4 text-[#A9C9EE]" />
                <span className="font-medium">{m.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full font-semibold border text-[11px] ${getStatusColor(m.val)}`}>
                {m.val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
