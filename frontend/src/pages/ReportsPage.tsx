import React, { useState, useEffect } from 'react';
import { ReportsData } from '../types';
import { api } from '../services/api';
import { BarChart3, PieChart, ShieldCheck, DollarSign, Building2, Package, RefreshCw } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading || !reports) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#B8C4D0]">
        Generating enterprise procurement reports...
      </div>
    );
  }

  const kpis = [
    { title: 'Total Documents Analyzed', val: reports.total_documents, icon: BarChart3, color: 'text-[#A9C9EE]' },
    { title: 'Total Items Extracted', val: reports.total_materials, icon: Package, color: 'text-emerald-400' },
    { title: 'Total Estimated Value', val: reports.total_estimated_value, icon: DollarSign, color: 'text-amber-400' },
    { title: 'Average OCR Confidence', val: reports.average_confidence, icon: ShieldCheck, color: 'text-purple-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F0F4F8] tracking-tight">
            Procurement & Extraction Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#B8C4D0] mt-1">
            Salem Steel Plant Operations • Material summaries, spend analytics & OCR confidence
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#A9C9EE] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-card rounded-xl p-5 border border-[#435568] shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#B8C4D0] uppercase tracking-wider">{kpi.title}</p>
                <p className={`text-2xl font-extrabold font-mono mt-1 ${kpi.color}`}>{kpi.val}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#16232D] border border-[#435568]">
                <Icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytical Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Material Categories Distribution */}
        <div className="glass-card rounded-xl p-6 border border-[#435568] shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#A9C9EE] flex items-center gap-2 pb-3 border-b border-[#435568]/60">
            <Package className="w-4 h-4" />
            Materials by Category
          </h3>
          <div className="space-y-4 pt-2">
            {reports.materials_by_category.map((c, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#F0F4F8]">{c.category}</span>
                  <span className="text-[#A9C9EE] font-mono">{c.count} items ({c.percentage}%)</span>
                </div>
                <div className="w-full bg-[#16232D] h-2.5 rounded-full overflow-hidden border border-[#435568]/60">
                  <div
                    className="bg-gradient-to-r from-[#7CA7DB] to-[#A9C9EE] h-full rounded-full"
                    style={{ width: `${Math.max(c.percentage, 10)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Material Status Distribution */}
        <div className="glass-card rounded-xl p-6 border border-[#435568] shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#A9C9EE] flex items-center gap-2 pb-3 border-b border-[#435568]/60">
            <PieChart className="w-4 h-4" />
            Procurement Lifecycle Status
          </h3>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {reports.materials_by_status.map((st, i) => (
              <div key={i} className="bg-[#16232D] border border-[#435568] rounded-xl p-4 space-y-1">
                <span className="text-xs font-semibold text-[#B8C4D0] uppercase tracking-wider block">
                  {st.status}
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {st.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Department Indents & Spend */}
        <div className="glass-card rounded-xl p-6 border border-[#435568] shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#A9C9EE] flex items-center gap-2 pb-3 border-b border-[#435568]/60">
            <Building2 className="w-4 h-4" />
            Department Indent Activity
          </h3>
          <div className="space-y-3 pt-2">
            {reports.procurement_by_dept.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#16232D] border border-[#435568] rounded-lg text-xs">
                <span className="font-semibold text-[#F0F4F8]">{d.department}</span>
                <span className="px-2.5 py-1 rounded-full bg-[#24313C] border border-[#435568] text-[#A9C9EE] font-mono font-bold">
                  {d.count} {d.count === 1 ? 'document' : 'documents'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: OCR Confidence Levels */}
        <div className="glass-card rounded-xl p-6 border border-[#435568] shadow-lg space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#A9C9EE] flex items-center gap-2 pb-3 border-b border-[#435568]/60">
            <ShieldCheck className="w-4 h-4" />
            OCR & AI Confidence Distribution
          </h3>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-400">High Confidence (&ge; 90%)</span>
                <span className="font-mono text-[#F0F4F8]">{reports.confidence_distribution.high} docs</span>
              </div>
              <div className="w-full bg-[#16232D] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-400">Medium Confidence (70% - 89%)</span>
                <span className="font-mono text-[#F0F4F8]">{reports.confidence_distribution.medium} docs</span>
              </div>
              <div className="w-full bg-[#16232D] h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '10%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-red-400">Requires Verification (&lt; 70%)</span>
                <span className="font-mono text-[#F0F4F8]">{reports.confidence_distribution.low} docs</span>
              </div>
              <div className="w-full bg-[#16232D] h-2 rounded-full overflow-hidden">
                <div className="bg-red-400 h-full rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
