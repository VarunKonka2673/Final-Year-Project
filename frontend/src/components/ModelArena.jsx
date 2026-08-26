import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';
import { 
  Trophy, 
  BarChart3, 
  Layers, 
  Activity, 
  RefreshCw, 
  SlidersHorizontal,
  CheckCircle2,
  Target,
  TrendingUp,
  Gauge,
  Zap
} from 'lucide-react';

export default function ModelArena() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const detailRef = useRef(null);
  const tableRef = useRef(null);

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

  const handleSelectModel = (modelName) => {
    setSelectedModel(modelName);
    // Scroll so the bottom of the leaderboard table comes into view,
    // revealing the metric cards just below without a jarring jump.
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 80);
  };

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
  const activeDetail = selectedModel ? (detailedMetrics[selectedModel] || null) : null;
  const featureImportances = benchmarks?.feature_importances || [];
  const selectedSummary = comparisonList.find(m => m.model_name === selectedModel) || null;

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
      <div ref={tableRef} className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Comparative Model Performance Leaderboard
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Click <strong className="text-cyan-400">Select</strong> to inspect a model&apos;s deep-dive metrics below
          </span>
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
                    className={`transition-colors ${
                      isSelected ? 'bg-cyan-500/10 text-cyan-200' : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-semibold">
                      <div className="flex items-center gap-2">
                        {m.is_best && <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                        <span>{m.model_name}</span>
                        {m.is_best && (
                          <span className="text-[10px] uppercase font-mono px-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Best
                          </span>
                        )}
                        {isSelected && !m.is_best && (
                          <span className="text-[10px] uppercase font-mono px-2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Viewing
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">{m.accuracy}%</td>
                    <td className="py-3 px-4 text-right text-slate-200">{m.precision}%</td>
                    <td className="py-3 px-4 text-right text-slate-200">{m.recall}%</td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-300">{m.f1_score}%</td>
                    <td className="py-3 px-4 text-right text-indigo-300">{m.roc_auc}%</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleSelectModel(m.model_name)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold transition-all duration-200 inline-flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50 cursor-default'
                            : 'bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/40 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <Activity className="w-3 h-3" />
                            Select
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Deep Dive */}
      {activeDetail && selectedSummary && (
        <div ref={detailRef} className="space-y-6">

          {/* Model Identity Banner */}
          <div className="glass-panel px-5 py-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-500">Deep-Dive Analysis</p>
                <h3 className="text-lg font-bold text-slate-100">{selectedModel}</h3>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              Evaluated on 20% holdout test split
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

            {/* Accuracy */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Accuracy</span>
                <Target className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-300">
                {selectedSummary.accuracy}<span className="text-lg text-emerald-500">%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-700"
                     style={{ width: `${selectedSummary.accuracy}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Overall correct classifications</p>
            </div>

            {/* Precision */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 hover:border-blue-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Precision</span>
                <Gauge className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-blue-300">
                {selectedSummary.precision}<span className="text-lg text-blue-500">%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-700"
                     style={{ width: `${selectedSummary.precision}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">TP / (TP + FP) - Low false alarms</p>
            </div>

            {/* Recall */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 hover:border-amber-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Recall</span>
                <TrendingUp className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-amber-300">
                {selectedSummary.recall}<span className="text-lg text-amber-500">%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
                     style={{ width: `${selectedSummary.recall}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">TP / (TP + FN) - Bot capture rate</p>
            </div>

            {/* F1-Score */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 hover:border-cyan-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">F1-Score</span>
                <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-cyan-300">
                {selectedSummary.f1_score}<span className="text-lg text-cyan-500">%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-700"
                     style={{ width: `${selectedSummary.f1_score}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Harmonic mean of P and R</p>
            </div>

            {/* ROC-AUC */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col gap-2 hover:border-indigo-500/40 transition-colors group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">ROC-AUC</span>
                <BarChart3 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-3xl font-extrabold font-mono text-indigo-300">
                {selectedSummary.roc_auc}<span className="text-lg text-indigo-500">%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full transition-all duration-700"
                     style={{ width: `${selectedSummary.roc_auc}%` }} />
              </div>
              <p className="text-[10px] text-slate-500">Discriminative power - AUC</p>
            </div>

          </div>

          {/* Confusion Matrix + Feature Importances */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Confusion Matrix */}
            <div className="lg:col-span-6 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Confusion Matrix Heatmap
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Model: {selectedModel}</p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Total: {(
                    activeDetail.confusion_matrix.true_negative +
                    activeDetail.confusion_matrix.false_positive +
                    activeDetail.confusion_matrix.false_negative +
                    activeDetail.confusion_matrix.true_positive
                  ).toLocaleString()} samples
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">True Negatives (TN)</span>
                  <div className="text-2xl font-extrabold font-mono text-emerald-300 my-1">
                    {activeDetail.confusion_matrix.true_negative.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Correctly identified Genuine users</span>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">False Positives (FP)</span>
                  <div className="text-2xl font-extrabold font-mono text-amber-300 my-1">
                    {activeDetail.confusion_matrix.false_positive.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Type I Error (Genuine flagged as fake)</span>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-rose-400 uppercase font-semibold">False Negatives (FN)</span>
                  <div className="text-2xl font-extrabold font-mono text-rose-300 my-1">
                    {activeDetail.confusion_matrix.false_negative.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Type II Error (Missed bot/fraud)</span>
                </div>

                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">True Positives (TP)</span>
                  <div className="text-2xl font-extrabold font-mono text-cyan-300 my-1">
                    {activeDetail.confusion_matrix.true_positive.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-400">Correctly detected Fraudulent bots</span>
                </div>
              </div>
            </div>

            {/* Feature Importances */}
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
        </div>
      )}

    </div>
  );
}
