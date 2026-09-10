import React, { useState } from 'react';
import { User, Shield, KeyRound, LogOut, CheckCircle2, Factory, Mail, BadgeCheck, Settings } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess(true);
    setTimeout(() => {
      setPassSuccess(false);
      setShowPasswordModal(false);
      setOldPass('');
      setNewPass('');
    }, 1800);
  };

  const handleLogout = () => {
    if (confirm("Sign out of SAIL Material Management Module (Salem Steel Plant)?")) {
      alert("Session securely ended. Ready for next operator login.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F0F4F8] tracking-tight">
          User Profile & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-[#B8C4D0] mt-1">
          Salem Steel Plant Operator Authentication & Access Control
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="glass-card rounded-2xl p-8 border border-[#435568] shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[#435568]">
          <div className="w-24 h-24 rounded-2xl bg-[#16232D] border-2 border-[#A9C9EE] flex items-center justify-center text-[#A9C9EE] shadow-inner shrink-0">
            <User className="w-12 h-12" />
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F0F4F8]">
                Er. Rajesh Kumar
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 self-center sm:self-auto">
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified Officer
              </span>
            </div>
            <p className="text-sm font-semibold text-[#A9C9EE]">
              Senior Manager (Procurement & Materials Management)
            </p>
            <p className="text-xs text-[#B8C4D0] flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <Factory className="w-3.5 h-3.5 text-[#A9C9EE]" />
              Steel Melting Shop (SMS) & Materials Division • Salem Steel Plant
            </p>
          </div>
        </div>

        {/* Profile Details Grid (Section 14) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-4 bg-[#16232D] rounded-xl border border-[#435568]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[#B8C4D0] uppercase tracking-wider">Employee ID</span>
            <p className="text-sm font-bold font-mono text-[#F0F4F8]">SSP-78294</p>
          </div>

          <div className="p-4 bg-[#16232D] rounded-xl border border-[#435568]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[#B8C4D0] uppercase tracking-wider">Department</span>
            <p className="text-sm font-bold text-[#F0F4F8]">SMS Operation & Procurement</p>
          </div>

          <div className="p-4 bg-[#16232D] rounded-xl border border-[#435568]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[#B8C4D0] uppercase tracking-wider">Designation</span>
            <p className="text-sm font-bold text-[#F0F4F8]">Senior Manager (Procurement)</p>
          </div>

          <div className="p-4 bg-[#16232D] rounded-xl border border-[#435568]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[#B8C4D0] uppercase tracking-wider">Official Email</span>
            <p className="text-sm font-bold font-mono text-[#A9C9EE] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              rajesh.kumar@sail.in
            </p>
          </div>

          <div className="p-4 bg-[#16232D] rounded-xl border border-[#435568]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[#B8C4D0] uppercase tracking-wider">Role & Authority</span>
            <p className="text-sm font-bold text-[#F0F4F8]">Chief Materials Officer / Approver (Level 3)</p>
          </div>

          <div className="p-4 bg-[#16232D] rounded-xl border border-[#435568]/60 space-y-1">
            <span className="text-[11px] font-semibold text-[#B8C4D0] uppercase tracking-wider">Plant Clearance</span>
            <p className="text-sm font-bold text-emerald-400">Class 1 Enterprise Clearance</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#435568]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn-steel px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#A9C9EE]" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => alert("Profile Settings: All operator access profiles are managed centrally via SAIL ERP Directory.")}
              className="btn-steel px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#A9C9EE]" />
              <span>Profile Settings</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-red-950/40 text-red-300 border border-red-800/80 hover:bg-red-900/60 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card bg-[#16232D] border border-[#435568] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-[#F0F4F8] pb-3 border-b border-[#435568]">
              Change Operator Password
            </h3>

            {passSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-700 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-emerald-300">Password Updated Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#B8C4D0]">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    className="w-full px-3 py-2 bg-[#24313C] border border-[#435568] rounded-lg text-sm text-[#F0F4F8] focus:outline-none focus:border-[#A9C9EE]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#B8C4D0]">New Enterprise Password</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 bg-[#24313C] border border-[#435568] rounded-lg text-sm text-[#F0F4F8] focus:outline-none focus:border-[#A9C9EE]"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#435568]">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="btn-steel px-4 py-2 rounded-lg text-xs font-semibold text-[#B8C4D0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-accent px-5 py-2 rounded-lg text-xs font-bold"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
