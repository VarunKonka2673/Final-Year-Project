import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import SingleScanner from './components/SingleScanner';
import HistoryViewer from './components/HistoryViewer';
import ModelArena from './components/ModelArena';
import BotClusterVisualizer from './components/BotClusterVisualizer';
import BatchScanner from './components/BatchScanner';
import LiveSentinelStream from './components/LiveSentinelStream';
import DatasetExplorer from './components/DatasetExplorer';
import AuthPortal from './components/AuthPortal';
import { ShieldCheck, Lock, Crown, ArrowRight, ShieldAlert } from 'lucide-react';
import { API_BASE } from './config';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [apiStatus, setApiStatus] = useState('checking...');
  const { currentUser, isAdmin, loading } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/models/evaluation`);
        if (res.ok) {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (err) {
        setApiStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // 1. "Don't show the website directly. Every normal user has to register first except the default admin."
  // If no user is logged in, show the full-screen secure Auth Portal
  if (!currentUser) {
    return <AuthPortal />;
  }

  // 2. Admin-only tabs list
  const adminOnlyTabs = ['arena', 'clusters', 'batch', 'stream', 'dataset'];
  const isCurrentTabRestricted = adminOnlyTabs.includes(activeTab) && !isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Sticky Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiStatus={apiStatus} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* RBAC Access Restricted Guard Fallback */}
        {isCurrentTabRestricted ? (
          <div className="glass-panel p-12 rounded-3xl border border-purple-500/30 text-center max-w-2xl mx-auto my-8 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-bold uppercase">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Clearance Required</span>
              </div>
              <h2 className="text-xl font-bold text-white">Restricted Forensics Section</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                This forensic intelligence module is strictly reserved for administrators.
                Standard user accounts have access to the <strong className="text-slate-200">Predict / Inspector</strong> and <strong className="text-slate-200">Search History</strong> sections.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('scanner')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Return to Predict / Inspector
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'scanner' && <SingleScanner />}
            {activeTab === 'history' && <HistoryViewer />}
            {activeTab === 'arena' && <ModelArena />}
            {activeTab === 'clusters' && <BotClusterVisualizer />}
            {activeTab === 'batch' && <BatchScanner />}
            {activeTab === 'stream' && <LiveSentinelStream />}
            {activeTab === 'dataset' && <DatasetExplorer />}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">SocialGuard AI</span>
            <span>— Hybrid ML + NLP Fraud Detection Framework with RBAC</span>
          </div>

          <div className="flex items-center space-x-6 font-mono text-[11px]">
            <span>FastAPI Backend: :8000</span>
            <span>React Sentinel: :5173</span>
            <span className="text-cyan-400">RBAC Secured</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
