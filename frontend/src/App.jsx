import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SingleScanner from './components/SingleScanner';
import ModelArena from './components/ModelArena';
import BotClusterVisualizer from './components/BotClusterVisualizer';
import BatchScanner from './components/BatchScanner';
import LiveSentinelStream from './components/LiveSentinelStream';
import DatasetExplorer from './components/DatasetExplorer';
import { ShieldCheck } from 'lucide-react';
import { API_BASE } from './config';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [apiStatus, setApiStatus] = useState('checking...');

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

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Sticky Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiStatus={apiStatus} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scanner' && <SingleScanner />}
        {activeTab === 'arena' && <ModelArena />}
        {activeTab === 'clusters' && <BotClusterVisualizer />}
        {activeTab === 'batch' && <BatchScanner />}
        {activeTab === 'stream' && <LiveSentinelStream />}
        {activeTab === 'dataset' && <DatasetExplorer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-300">SocialGuard AI</span>
            <span>— Hybrid ML + NLP Fraud Detection Framework</span>
          </div>

          <div className="flex items-center space-x-6 font-mono text-[11px]">
            <span>FastAPI Backend: :8000</span>
            <span>React Sentinel: :5173</span>
            <span className="text-cyan-400">Final Year Project</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
