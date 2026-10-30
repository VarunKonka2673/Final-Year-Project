import React, { useState } from 'react';
import { useAuth, DEFAULT_ADMIN_EMAIL } from '../context/AuthContext';
import { 
  Crown, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Clock, 
  Lock,
  UserCheck
} from 'lucide-react';

export default function ManageAdminsModal({ isOpen, onClose }) {
  const { currentUser, isAdmin, adminsList, addAdmin, removeAdmin } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen || !isAdmin) return null;

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await addAdmin(newEmail);
      setSuccess(`Administrator clearance granted to ${newEmail}`);
      setNewEmail('');
    } catch (err) {
      setError(err.message || 'Failed to grant admin access.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (emailToRemove) => {
    if (!window.confirm(`Revoke administrator rights from ${emailToRemove}?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await removeAdmin(emailToRemove);
      setSuccess(`Admin clearance revoked for ${emailToRemove}`);
    } catch (err) {
      setError(err.message || 'Failed to revoke admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-[#0a0f1d] border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[1px] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#080d18] rounded-2xl flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              Administrator Access Delegation
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Grant and manage full RBAC administrative permissions
            </p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form to Add New Admin */}
        <form onSubmit={handleAddAdmin} className="space-y-3 mb-6">
          <label className="block text-xs font-semibold text-slate-300">
            Grant Administrator Privileges by Email:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="newadmin@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Admin</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Only authorized Admins can appoint other administrators. Public registrations never receive Admin clearance.
          </p>
        </form>

        {/* Current Admins List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Authorized Administrator Roster</span>
            <span className="text-[10px] font-mono text-purple-400">
              {adminsList.length || 1} Registered Admin(s)
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {/* Default Master Admin */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{DEFAULT_ADMIN_EMAIL}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Primary Master Admin
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Protected Default Administrator</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Permanent</span>
            </div>

            {/* Other Appointed Admins */}
            {adminsList
              .filter(a => a.email?.toLowerCase() !== DEFAULT_ADMIN_EMAIL.toLowerCase())
              .map(admin => (
                <div key={admin.email} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <UserCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{admin.email}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Appointed by: {admin.added_by}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAdmin(admin.email)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                    title="Revoke Admin Access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
