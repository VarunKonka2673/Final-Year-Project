import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  Network, 
  FileSpreadsheet, 
  Radio, 
  Database, 
  BookOpen, 
  Activity 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus }) {
  const navItems = [
    { id: 'scanner', label: 'Predict / Inspector', icon: ShieldCheck, tag: 'Core' },
    { id: 'arena', label: 'Model Arena', icon: BarChart3, tag: '6 Models' },
    { id: 'clusters', label: 'Bot Rings & Clusters', icon: Network, tag: 'DBSCAN' },
    { id: 'batch', label: 'Batch CSV Audit', icon: FileSpreadsheet, tag: 'Bulk' },
    { id: 'stream', label: 'Live Sentinel Feed', icon: Radio, tag: 'Stream' },
    { id: 'dataset', label: 'Dataset Explorer', icon: Database, tag: '6K Samples' },
    { id: 'paper', label: 'IEEE Research Paper', icon: BookOpen, tag: 'Docs' }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl">
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
                  ML + NLP v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Fraudulent Social Account Sentinel & Anomaly Matrix
              </p>
            </div>
          </div>

          {/* System Health Status Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${apiStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-xs font-mono text-slate-300">
              API Engine: <span className={apiStatus === 'online' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>{apiStatus}</span>
            </span>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2.5 border-t border-slate-800/40">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
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
  );
}
