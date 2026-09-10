import React, { useState, useMemo } from 'react';
import { MaterialItem } from '../types';
import { Search, Filter, Layers, ArrowUpDown, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface MaterialTableViewProps {
  materials: MaterialItem[];
}

export const MaterialTableView: React.FC<MaterialTableViewProps> = ({ materials }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Extract unique grades & statuses for filter dropdowns
  const uniqueGrades = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.grade && m.grade !== 'Not Available') set.add(m.grade);
    });
    return Array.from(set);
  }, [materials]);

  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.status) set.add(m.status);
    });
    return Array.from(set);
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        searchTerm === '' ||
        m.material_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.material_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.remarks.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = gradeFilter === 'all' || m.grade === gradeFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [materials, searchTerm, gradeFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    const st = status || 'Pending';
    switch (st.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-700/60';
      case 'under review':
        return 'bg-blue-950/60 text-blue-300 border-blue-700/60';
      case 'procurement':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/60';
      case 'received':
        return 'bg-teal-950/60 text-teal-300 border-teal-700/60';
      case 'needs verification':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/60';
      default:
        return 'bg-[#16232D] text-[#B8C4D0] border-[#435568]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="glass-card rounded-xl p-4 border border-[#435568] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#B8C4D0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search material code, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#16232D] border border-[#435568] rounded-lg text-xs text-[#F0F4F8] placeholder-[#B8C4D0]/60 focus:outline-none focus:border-[#A9C9EE]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {uniqueGrades.length > 0 && (
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 bg-[#16232D] border border-[#435568] rounded-lg text-xs text-[#F0F4F8] focus:outline-none focus:border-[#A9C9EE]"
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}

          {uniqueStatuses.length > 0 && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#16232D] border border-[#435568] rounded-lg text-xs text-[#F0F4F8] focus:outline-none focus:border-[#A9C9EE]"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <div className="text-xs text-[#B8C4D0] whitespace-nowrap">
            Showing <span className="text-[#A9C9EE] font-bold">{filteredMaterials.length}</span> of {materials.length} items
          </div>
        </div>
      </div>

      {/* Dynamic Materials Table */}
      <div className="glass-card rounded-xl border border-[#435568] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#16232D] border-b border-[#435568] text-[11px] font-bold text-[#A9C9EE] uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16">Sl.No</th>
                <th className="py-3.5 px-4">Material Code</th>
                <th className="py-3.5 px-4">Material Description</th>
                <th className="py-3.5 px-4">Specification</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Grade</th>
                <th className="py-3.5 px-4">Make / Brand</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#435568]/40 text-xs">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((m, idx) => (
                  <tr key={m.id || idx} className="hover:bg-[#1D2A35] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#B8C4D0]">{m.sl_no || idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-medium text-[#F0F4F8]">
                      {m.material_code === 'Not Available' ? (
                        <span className="text-[#B8C4D0]/50 italic">Not Available</span>
                      ) : (
                        m.material_code
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#F0F4F8] max-w-xs break-words">
                      {m.material_description}
                    </td>
                    <td className="py-3 px-4 text-[#B8C4D0] max-w-xs truncate" title={m.specification}>
                      {m.specification}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#F0F4F8] font-bold">
                      {m.quantity}
                    </td>
                    <td className="py-3 px-4 text-[#A9C9EE] font-mono">
                      {m.unit}
                    </td>
                    <td className="py-3 px-4 text-[#B8C4D0]">
                      {m.grade}
                    </td>
                    <td className="py-3 px-4 text-[#B8C4D0]">
                      {m.make_brand}
                    </td>
                    <td className="py-3 px-4 text-[#B8C4D0] max-w-xs truncate" title={m.remarks}>
                      {m.remarks}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(m.status)}`}>
                        {m.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-[#B8C4D0]">
                    No materials matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
