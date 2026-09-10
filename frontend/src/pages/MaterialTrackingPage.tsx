import React, { useState, useEffect } from 'react';
import { MaterialItem } from '../types';
import { api } from '../services/api';
import { Search, Filter, RefreshCw, CheckCircle2, Clock, AlertTriangle, Edit2, ShieldAlert } from 'lucide-react';

export const MaterialTrackingPage: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.getMaterials({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setMaterials(res.materials);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMaterials();
  };

  const handleUpdateStatus = async () => {
    if (!editingItem || !newStatus) return;
    setSaving(true);
    try {
      await api.updateMaterial(editingItem.id!, { status: newStatus });
      setEditingItem(null);
      fetchMaterials();
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F0F4F8] tracking-tight">
            Material Procurement Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#B8C4D0] mt-1">
            Track extracted steel items, indents, delivery schedules & approval lifecycle
          </p>
        </div>

        <button
          onClick={fetchMaterials}
          className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#A9C9EE] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search & Filter Header */}
      <div className="glass-card rounded-xl p-4 border border-[#435568] flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#B8C4D0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search material description, vendor, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#16232D] border border-[#435568] rounded-lg text-xs text-[#F0F4F8] placeholder-[#B8C4D0]/60 focus:outline-none focus:border-[#A9C9EE]"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <span className="text-xs text-[#B8C4D0] hidden sm:inline">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#16232D] border border-[#435568] rounded-lg text-xs text-[#F0F4F8] focus:outline-none focus:border-[#A9C9EE]"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Procurement">Procurement</option>
            <option value="Received">Received</option>
            <option value="Needs Verification">Needs Verification</option>
          </select>

          <span className="text-xs text-[#A9C9EE] font-mono">
            {materials.length} records
          </span>
        </div>
      </div>

      {/* Materials Tracking Table */}
      <div className="glass-card rounded-xl border border-[#435568] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#16232D] border-b border-[#435568] text-[11px] font-bold text-[#A9C9EE] uppercase tracking-wider">
                <th className="py-3.5 px-4">Material Code</th>
                <th className="py-3.5 px-4">Material Description</th>
                <th className="py-3.5 px-4">Specification</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Required Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#435568]/40">
              {materials.length > 0 ? (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-[#1D2A35] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#F0F4F8]">
                      {m.material_code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#F0F4F8] max-w-xs">
                      {m.material_description}
                    </td>
                    <td className="py-3.5 px-4 text-[#B8C4D0] max-w-xs truncate" title={m.specification}>
                      {m.specification}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#F0F4F8]">
                      {m.quantity}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#A9C9EE]">
                      {m.unit}
                    </td>
                    <td className="py-3.5 px-4 text-[#B8C4D0] max-w-[150px] truncate" title={m.vendor}>
                      {m.vendor}
                    </td>
                    <td className="py-3.5 px-4 text-[#B8C4D0]">
                      {m.required_date}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => { setEditingItem(m); setNewStatus(m.status); }}
                        className="btn-steel p-1.5 rounded hover:border-[#A9C9EE] text-[#A9C9EE] cursor-pointer"
                        title="Update Status"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#B8C4D0]">
                    {loading ? 'Fetching tracking data...' : 'No material records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card bg-[#16232D] border border-[#435568] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <h3 className="text-base font-bold text-[#F0F4F8] pb-3 border-b border-[#435568]">
              Update Material Status
            </h3>

            <div className="space-y-1">
              <p className="text-xs text-[#B8C4D0]">Material:</p>
              <p className="text-sm font-semibold text-[#F0F4F8]">{editingItem.material_description}</p>
              <p className="text-xs font-mono text-[#A9C9EE]">{editingItem.material_code}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#B8C4D0] uppercase tracking-wider">
                Select Lifecycle Status:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#24313C] border border-[#435568] rounded-lg text-sm text-[#F0F4F8] focus:outline-none focus:border-[#A9C9EE]"
              >
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Procurement">Procurement</option>
                <option value="Received">Received</option>
                <option value="Needs Verification">Needs Verification</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#435568]">
              <button
                onClick={() => setEditingItem(null)}
                className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold text-[#B8C4D0]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                className="btn-accent px-5 py-2 rounded-lg text-xs font-bold"
              >
                {saving ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
