import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Filter, 
  Sliders, 
  SlidersHorizontal,
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function DatasetExplorer() {
  const [datasetData, setDatasetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [retraining, setRetraining] = useState(false);
  const [retrainParams, setRetrainParams] = useState({
    num_samples: 6000,
    fake_ratio: 0.28,
    smote_ratio: 0.85
  });
  const [retrainSuccess, setRetrainSuccess] = useState(null);

  const fetchDataset = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/dataset/sample`);
      const json = await res.json();
      setDatasetData(json);
    } catch (e) {
      console.error("Failed to load dataset sample", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const handleRetrain = async (e) => {
    e.preventDefault();
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retrainParams)
      });
      const data = await res.json();
      setRetrainSuccess("Pipeline and models successfully retrained and serialized!");
      fetchDataset();
    } catch (err) {
      console.error("Retrain error", err);
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400">Loading SocialGuard Dataset Explorer...</span>
      </div>
    );
  }

  const records = datasetData?.records || [];
  const filteredRecords = records.filter(r => 
    r.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.bot_archetype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Dataset & Distribution Explorer</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect labeled training corpora, statistical feature profiles, and trigger dynamic retraining.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchDataset}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh Dataset Sample"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Retrain Parameter Matrix */}
      <form onSubmit={handleRetrain} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            On-Demand Pipeline Retraining & SMOTE Tuning
          </span>
          <span className="text-[11px] font-mono text-slate-400">Hyperparameter Control</span>
        </div>

        {retrainSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{retrainSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Total Samples Size</label>
            <input
              type="number"
              min="1000"
              max="20000"
              step="500"
              value={retrainParams.num_samples}
              onChange={(e) => setRetrainParams(p => ({ ...p, num_samples: parseInt(e.target.value) || 6000 }))}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Raw Minority Fake Ratio (e.g. 0.28)</label>
            <input
              type="number"
              min="0.1"
              max="0.5"
              step="0.01"
              value={retrainParams.fake_ratio}
              onChange={(e) => setRetrainParams(p => ({ ...p, fake_ratio: parseFloat(e.target.value) || 0.28 }))}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">SMOTE Resampling Strategy Ratio</label>
            <input
              type="number"
              min="0.5"
              max="1.0"
              step="0.05"
              value={retrainParams.smote_ratio}
              onChange={(e) => setRetrainParams(p => ({ ...p, smote_ratio: parseFloat(e.target.value) || 0.85 }))}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={retraining}
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {retraining ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Retraining All 6 Models & SMOTE Pipeline...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Dataset & Retrain Models</span>
            </>
          )}
        </button>
      </form>

      {/* Dataset Sample Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4">
        
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sample usernames or archetypes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Total Dataset: {datasetData?.total_dataset_size || 6000} records | Showing sample
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-950/90 text-slate-400 font-mono border-b border-slate-800 backdrop-blur-md">
              <tr>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Handle</th>
                <th className="py-3 px-4">Archetype</th>
                <th className="py-3 px-4 text-right">Followers</th>
                <th className="py-3 px-4 text-right">Following</th>
                <th className="py-3 px-4 text-right">Posts/Day</th>
                <th className="py-3 px-4 text-right">Spam Lexicon</th>
                <th className="py-3 px-4 text-center">Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRecords.map((r, idx) => {
                const isFake = r.is_fake === 1;
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 text-slate-300">
                    <td className="py-3 px-4 font-mono text-slate-400">{r.account_id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">@{r.username}</td>
                    <td className="py-3 px-4 font-sans text-cyan-300">{r.bot_archetype}</td>
                    <td className="py-3 px-4 text-right">{r.follower_count}</td>
                    <td className="py-3 px-4 text-right">{r.following_count}</td>
                    <td className="py-3 px-4 text-right">{r.posting_frequency_per_day}</td>
                    <td className="py-3 px-4 text-right text-indigo-300">{r.spam_keyword_score}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFake ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {isFake ? 'FAKE' : 'GENUINE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
