import React from 'react';
import { ActivityItem } from '../types';
import { Clock, CheckCircle2, Upload, FileSearch, Sparkles, RefreshCw } from 'lucide-react';

interface RecentActivityPanelProps {
  activities: ActivityItem[];
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({ activities }) => {
  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'UPLOAD':
        return <Upload className="w-3.5 h-3.5 text-[#A9C9EE]" />;
      case 'OCR':
      case 'ANALYSIS':
        return <FileSearch className="w-3.5 h-3.5 text-emerald-400" />;
      case 'STATUS_UPDATE':
        return <RefreshCw className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="glass-card rounded-xl border border-[#435568] p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-[#435568]/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A9C9EE] flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h4>
        <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800">
          Live Feed
        </span>
      </div>

      <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
        {activities.length > 0 ? (
          activities.map((a) => (
            <div key={a.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-[#16232D] transition-colors">
              <div className="p-1.5 rounded-md bg-[#16232D] border border-[#435568]/60 shrink-0 mt-0.5">
                {getIcon(a.action_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#F0F4F8] leading-tight font-medium break-words">
                  {a.message}
                </p>
                <span className="text-[10px] text-[#B8C4D0]/70 font-mono mt-0.5 block">
                  {a.relative_time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-[#B8C4D0] text-center py-6">No recent activities logged.</p>
        )}
      </div>
    </div>
  );
};
