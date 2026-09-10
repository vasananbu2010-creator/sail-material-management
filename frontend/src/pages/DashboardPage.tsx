import React from 'react';
import { DashboardData, DocumentListItem } from '../types';
import { ModuleStatusCard } from '../components/ModuleStatusCard';
import { RecentActivityPanel } from '../components/RecentActivityPanel';
import {
  FileText,
  Package,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface DashboardPageProps {
  data: DashboardData | null;
  onSelectDocument: (docId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ data, onSelectDocument }) => {
  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-[#B8C4D0]">
        Loading dashboard metrics...
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Documents Processed',
      value: data.total_documents,
      icon: FileText,
      color: 'text-[#A9C9EE]',
      bg: 'bg-[#16232D]',
      border: 'border-[#435568]',
    },
    {
      title: 'Total Materials Extracted',
      value: data.total_materials,
      icon: Package,
      color: 'text-emerald-400',
      bg: 'bg-[#16232D]',
      border: 'border-[#435568]',
    },
    {
      title: 'Documents This Month',
      value: data.documents_this_month,
      icon: Calendar,
      color: 'text-blue-400',
      bg: 'bg-[#16232D]',
      border: 'border-[#435568]',
    },
    {
      title: 'Pending Verification',
      value: data.pending_verification,
      icon: AlertCircle,
      color: data.pending_verification > 0 ? 'text-amber-400' : 'text-emerald-400',
      bg: 'bg-[#16232D]',
      border: 'border-[#435568]',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F0F4F8] tracking-tight">
          System Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[#B8C4D0] mt-1">
          Salem Steel Plant Operations • Real-time OCR & Materials Metrics
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-card rounded-xl p-5 border border-[#435568] shadow-md flex items-center justify-between transition-transform hover:-translate-y-1"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#B8C4D0] uppercase tracking-wider">
                  {kpi.title}
                </p>
                <p className={`text-2xl sm:text-3xl font-extrabold font-mono ${kpi.color}`}>
                  {kpi.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg} border ${kpi.border} ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Documents & Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recently Processed Documents Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card rounded-xl border border-[#435568] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#435568]/60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F0F4F8] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#A9C9EE]" />
                Recently Uploaded Documents
              </h3>
              <span className="text-xs text-[#B8C4D0]">
                {data.recent_documents.length} recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#16232D] border-b border-[#435568] text-[11px] font-bold text-[#A9C9EE] uppercase tracking-wider">
                    <th className="py-3 px-3">Document Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Materials</th>
                    <th className="py-3 px-3">Confidence</th>
                    <th className="py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#435568]/40">
                  {data.recent_documents.length > 0 ? (
                    data.recent_documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#1D2A35] transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#F0F4F8] max-w-xs truncate">
                          {doc.original_name}
                        </td>
                        <td className="py-3 px-3 text-[#B8C4D0]">
                          {doc.document_type}
                        </td>
                        <td className="py-3 px-3 text-[#B8C4D0] font-mono">
                          {doc.file_size_formatted}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                          {doc.materials_count}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#A9C9EE]">
                          {doc.overall_confidence}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => onSelectDocument(doc.id)}
                            className="btn-steel px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 hover:border-[#A9C9EE]"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3 text-[#A9C9EE]" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#B8C4D0]">
                        No documents processed yet. Upload a PDF to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Module Status & Recent Activity Panel */}
        <div className="lg:col-span-4 space-y-6">
          <ModuleStatusCard status={data.module_status} />
          <RecentActivityPanel activities={data.recent_activities} />
        </div>
      </div>
    </div>
  );
};
