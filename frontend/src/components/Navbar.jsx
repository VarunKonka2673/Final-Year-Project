import React, { useState } from 'react';
import { useAuth, DEFAULT_ADMIN_EMAIL } from '../context/AuthContext';
import ManageAdminsModal from './ManageAdminsModal';
import { 
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  Network, 
  FileSpreadsheet, 
  Radio, 
  Database, 
  History,
  Crown,
  User,
  LogOut,
  LogIn,
  Sparkles,
  ChevronDown,
  UserPlus
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus }) {
  const { currentUser, isAdmin, role, openAuthModal, logout, quickDemoLogin } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [isManageAdminsOpen, setIsManageAdminsOpen] = useState(false);

  // Define tabs available based on RBAC role
  const allNavItems = [
    { id: 'scanner', label: 'Predict / Inspector', icon: ShieldCheck, tag: 'Core', adminOnly: false },
    { id: 'history', label: isAdmin ? 'Audit & History' : 'My History', icon: History, tag: 'Ledger', adminOnly: false },
    { id: 'arena', label: 'Model Arena', icon: BarChart3, tag: '6 Models', adminOnly: true },
    { id: 'clusters', label: 'Bot Rings & Clusters', icon: Network, tag: 'DBSCAN', adminOnly: true },
    { id: 'batch', label: 'Batch CSV Audit', icon: FileSpreadsheet, tag: 'Bulk', adminOnly: true },
    { id: 'stream', label: 'Live Sentinel Feed', icon: Radio, tag: 'Stream', adminOnly: true },
    { id: 'dataset', label: 'Dataset Explorer', icon: Database, tag: '6K Samples', adminOnly: true }
  ];

  // Filter items: Normal user only gets Predict/Inspector and My History
  const visibleNavItems = allNavItems.filter(item => {
    if (!item.adminOnly) return true;
    return isAdmin;
  });

  return (
    <>
    <ManageAdminsModal isOpen={isManageAdminsOpen} onClose={() => setIsManageAdminsOpen(false)} />
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('scanner')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  SocialGuard
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  ML + NLP
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Fraudulent Social Account Sentinel & Anomaly Matrix
              </p>
            </div>
          </div>

          {/* Right Side: Status Indicator + RBAC User Profile Controls */}
          <div className="flex items-center space-x-3">

            {/* Admin Management Button (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsManageAdminsOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 text-xs font-semibold shadow-sm shadow-purple-500/10 transition cursor-pointer"
                title="Manage Authorized Administrators"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Manage Admins</span>
              </button>
            )}

            {/* System Health Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${apiStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${apiStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-mono text-slate-300">
                API: <span className={apiStatus === 'online' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>{apiStatus}</span>
              </span>
            </div>

            {/* Auth / User Profile Widget */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {isAdmin ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <User className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>

                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-slate-200 leading-none">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                        isAdmin 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}>
                        {isAdmin ? 'ADMIN (Full Access)' : 'USER (Inspector)'}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#090e1a] border border-slate-700/80 shadow-2xl p-2 z-50 animate-fadeIn"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-800/80">
                      <p className="text-xs font-bold text-white truncate">{currentUser.displayName || 'User'}</p>
                      <p className="text-[11px] font-mono text-slate-400 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                          isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {isAdmin ? 'Admin Rights' : 'Standard User'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => { setActiveTab('history'); }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-lg flex items-center gap-2 transition"
                      >
                        <History className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isAdmin ? 'System Audit Ledger' : 'My Search History'}</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsManageAdminsOpen(true)}
                          className="w-full text-left px-3 py-2 text-xs text-purple-300 hover:bg-purple-500/10 rounded-lg flex items-center gap-2 transition"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Manage Admin Accounts</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2.5 border-t border-slate-800/40">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.tag && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
    </>
  );
}


