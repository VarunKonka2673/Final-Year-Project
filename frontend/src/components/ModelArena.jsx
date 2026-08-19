import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { 
  Trophy, 
  BarChart3, 
  Layers, 
  HelpCircle, 
  Activity, 
  RefreshCw, 
  ChevronRight, 
  SlidersHorizontal 
} from 'lucide-react';

export default function ModelArena() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState("Random Forest");

  const fetchEvaluation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/models/evaluation`);
      const json = await res.json();
      setData(json);
      if (json?.benchmarks?.best_model) {
        setSelectedModel(json.benchmarks.best_model);
      }
    } catch (e) {
      console.error("Failed to load evaluation metadata", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-slate-400">Loading Multi-Model Evaluation Matrix...</span>
      </div>
    );
  }

  const benchmarks = data?.benchmarks || {};
  const comparisonList = benchmarks?.models_comparison || [];
  const detailedMetrics = benchmarks?.detailed_metrics || {};
  const activeDetail = detailedMetrics[selectedModel] || null;
  const featureImportances = benchmarks?.feature_importances || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Multi-Model Classification Arena</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Benchmark 6 diverse ML classifiers evaluated on 20% holdout test split with SMOTE class balancing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Champion Model: <strong className="text-cyan-400 font-bold">{benchmarks.best_model || 'Random Forest'}</strong>
          </div>
          <button
            onClick={fetchEvaluation}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Benchmarks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Leaderboard Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Comparative Model Performance Leaderboard
          </span>
          <span className="text-[11px] font-mono text-slate-400">Sorted by F1-Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Classifier Architecture</th>
                <th className="py-3 px-4 text-right">Accuracy</th>
                <th className="py-3 px-4 text-right">Precision</th>
                <th className="py-3 px-4 text-right">Recall</th>
                <th className="py-3 px-4 text-right">F1-Score</th>
                <th className="py-3 px-4 text-right">ROC-AUC</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {comparisonList.map((m) => {
                const isSelected = selectedModel === m.model_name;
                return (
                  <tr 
                    key={m.model_name}
                    onClick={() => setSelectedModel(m.model_name)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-500/10 text-cyan-200' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-semibold flex items-center gap-2">
                      {m.is_best && <Trophy className="w-4 h-4 text-amber-400" />}
                      <span>{m.model_name}</span>
                      {m.is_best && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Best
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">{m.accuracy}%</td>
                    <td className="py-3 px-4 text-right text-slate-200">{m.precision}%</td>
                    <td className="py-3 px-4 text-right text-slate-200">{m.recall}%</td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-300">{m.f1_score}%</td>
                    <td className="py-3 px-4 text-right text-indigo-300">{m.roc_auc}%</td>
                    <td className="py-3 px-4 text-center">
                      <button className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-[11px] font-sans transition">
                        Select
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Deep Dive: Confusion Matrix + ROC Curve */}
      {activeDetail && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Confusion Matrix Heatmap (6 cols) */}
          <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Confusion Matrix Heatmap
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Model: {selectedModel}</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Total Test Split: 1,200</span>
            </div>

            {/* 2x2 Matrix Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              
              {/* True Negative */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">True Negatives (TN)</span>
                <div className="text-2xl font-extrabold font-mono text-emerald-300 my-1">
                  {activeDetail.confusion_matrix.true_negative}
                </div>
                <span className="text-[10px] text-slate-400">Correctly identified Genuine users</span>
              </div>

              {/* False Positive */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">False Positives (FP)</span>
                <div className="text-2xl font-extrabold font-mono text-amber-300 my-1">
                  {activeDetail.confusion_matrix.false_positive}
                </div>
                <span className="text-[10px] text-slate-400">Type I Error (Genuine flagged as fake)</span>
              </div>

              {/* False Negative */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-rose-400 uppercase font-semibold">False Negatives (FN)</span>
                <div className="text-2xl font-extrabold font-mono text-rose-300 my-1">
                  {activeDetail.confusion_matrix.false_negative}
                </div>
                <span className="text-[10px] text-slate-400">Type II Error (Missed bot/fraud)</span>
              </div>

              {/* True Positive */}
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between">
                <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">True Positives (TP)</span>
                <div className="text-2xl font-extrabold font-mono text-cyan-300 my-1">
                  {activeDetail.confusion_matrix.true_positive}
                </div>
                <span className="text-[10px] text-slate-400">Correctly detected Fraudulent bots</span>
              </div>

            </div>
          </div>

          {/* Right: Global Feature Importances (6 cols) */}
          <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  Top Discriminative Feature Importances
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ensemble Gini Importance Ranking</p>
              </div>
              <span className="text-xs font-mono text-slate-400">Relative Weight (%)</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {featureImportances.slice(0, 9).map((f, i) => (
                <div key={f.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 truncate max-w-[200px]">
                      {i + 1}. {f.feature}
                    </span>
                    <span className="font-mono text-cyan-400 font-semibold">{f.importance_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, f.importance_pct * 3.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
