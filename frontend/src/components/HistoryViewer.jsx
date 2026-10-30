import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { fetchScanHistory, deleteHistoryRecord, clearAllHistory, submitPredictionFeedback } from '../services/historyService';
import { API_BASE } from '../config';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  User, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Cpu, 
  RefreshCw, 
  Download, 
  Crown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3
} from 'lucide-react';

export default function HistoryViewer({ onSelectScanForInspect = null }) {
  const { currentUser, isAdmin, role, openAuthModal } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all'); // 'all' | 'fake' | 'genuine'
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [retrainingAll, setRetrainingAll] = useState(false);
  const [retrainNotice, setRetrainNotice] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchScanHistory(currentUser, isAdmin);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser, isAdmin]);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this history record?')) return;
    try {
      const updated = await deleteHistoryRecord(id, currentUser);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearAll = async () => {
    const confirmMsg = isAdmin 
      ? 'Clear ALL system history records for all users?' 
      : 'Clear your personal search history?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await clearAllHistory(currentUser, isAdmin);
      setHistory([]);
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  const handleRetrainFromAllFeedback = async () => {
    setRetrainingAll(true);
    setRetrainNotice(null);
    try {
      const res = await fetch(`${API_BASE}/api/feedback/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRetrainNotice(`SocialGuard pipeline retrained on ${data.dataset_size} samples. Best model: ${data.best_model}`);
    } catch (err) {
      console.error('Retrain error:', err);
      setRetrainNotice('Retraining failed: ' + (err.message || 'Unknown error'));
    } finally {
      setRetrainingAll(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `socialguard_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter records
  const filteredRecords = history.filter(item => {
    const matchesSearch = 
      (item.target || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.predicted_archetype || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.platform || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVerdict = 
      filterVerdict === 'all' ? true :
      filterVerdict === 'fake' ? item.is_fake === 1 :
      item.is_fake === 0;

    const matchesPlatform = 
      filterPlatform === 'all' ? true :
      (item.platform || '').toLowerCase() === filterPlatform.toLowerCase();

    return matchesSearch && matchesVerdict && matchesPlatform;
  });

  // Calculate stats
  const totalScans = history.length;
  const fakeScans = history.filter(h => h.is_fake === 1).length;
  const genuineScans = totalScans - fakeScans;
  const verifiedCount = history.filter(h => h.feedback !== null && h.feedback !== undefined).length;

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isAdmin 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {isAdmin ? 'ADMIN MASTER AUDIT LOG' : 'USER SEARCH HISTORY'}
              </span>
              {currentUser?.email && (
                <span className="text-xs font-mono text-slate-400">
                  Account: <strong className="text-slate-200">{currentUser.email}</strong>
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mt-2">
              <History className="w-5 h-5 text-cyan-400" />
              {isAdmin ? 'System-Wide Forensic Audit & Search History' : 'My Account Search History'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isAdmin 
                ? 'Full telemetry and classification ledger across all user queries, link submissions, and ground-truth feedback.'
                : 'Review your previously inspected accounts, verified feedback submissions, and risk score assessments.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={loadHistory}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleRetrainFromAllFeedback}
                disabled={retrainingAll}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{retrainingAll ? 'Retraining All Models...' : 'Retrain on All Feedback'}</span>
              </button>
            )}

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            {totalScans > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Clear All System History' : 'Clear My History'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Retrain Notification */}
        {retrainNotice && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{retrainNotice}</span>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Logged Scans</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalScans}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-rose-400 uppercase">Fraudulent Bots Flagged</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{fakeScans}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-emerald-400 uppercase">Genuine Verified</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{genuineScans}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="text-[11px] font-mono text-cyan-400 uppercase">Feedback Submissions</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{verifiedCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAdmin ? "Search by username, URL, user email, or archetype..." : "Search your scanned usernames or URLs..."}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40 cursor-pointer"
          >
            <option value="all">All Verdicts</option>
            <option value="fake">Fraudulent / Bots</option>
            <option value="genuine">Genuine Accounts</option>
          </select>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40 cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="X / Twitter">X / Twitter</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="YouTube">YouTube</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading audit ledger...</span>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">No Search Records Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || filterVerdict !== 'all' || filterPlatform !== 'all' 
                ? 'Try adjusting your search filters.' 
                : 'Run an analysis in the Predict / Inspector tab to start logging telemetry.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((item) => {
            const isFake = item.is_fake === 1;
            const isExpanded = expandedId === item.id;
            const hasFeedback = Boolean(item.feedback);

            return (
              <div 
                key={item.id}
                className={`glass-panel rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isFake ? 'border-rose-500/30 bg-slate-900/40' : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                {/* Summary Row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/30 transition"
                >
                  {/* Left info */}
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isFake ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isFake ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">
                          {item.target || 'Target Account'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {item.platform || 'Generic'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isFake ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {item.verdict || (isFake ? 'FRAUDULENT' : 'GENUINE')}
                        </span>
                        {hasFeedback && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            {item.feedback.is_correct ? 'Verified Correct' : 'User Corrected'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                        </span>
                        <span>
                          Risk: <strong className={isFake ? 'text-rose-400' : 'text-emerald-400'}>{Math.round(item.risk_score)}/100</strong>
                        </span>
                        {isAdmin && item.user_email && (
                          <span className="flex items-center gap-1 text-purple-300">
                            <User className="w-3 h-3" />
                            {item.user_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-2 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Breakdown */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 bg-[#060a14] space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-slate-400 mb-1">Archetype Classification</div>
                        <div className="font-bold text-cyan-300">{item.predicted_archetype || 'N/A'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-slate-400 mb-1">Ensemble Confidence</div>
                        <div className="font-bold text-white">{item.confidence_pct}%</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-slate-400 mb-1">Scan Mode</div>
                        <div className="font-bold text-slate-200 uppercase">{item.scan_mode || 'URL / Profile'}</div>
                      </div>
                    </div>

                    {/* Feedback Status or Inline Feedback submission */}
                    {hasFeedback ? (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>User Verified Feedback:</span>
                        </div>
                        <p className="text-slate-400">
                          Status: <strong className="text-white">{item.feedback.is_correct ? 'Prediction Confirmed Correct' : 'Reported as Discrepancy'}</strong>
                          {item.feedback.notes && <span className="block mt-1 italic text-slate-300">"{item.feedback.notes}"</span>}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <span className="text-slate-300">
                          Ground-truth not yet verified for this search.
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              await submitPredictionFeedback({
                                historyId: item.id,
                                username: item.target,
                                profileUrl: item.profile_url,
                                platform: item.platform,
                                features: item.extracted_features || {},
                                modelPredictedFake: item.is_fake,
                                userVerifiedFake: item.is_fake,
                                isCorrect: true,
                                user: currentUser,
                                autoRetrain: true
                              });
                              loadHistory();
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-[11px] font-semibold transition"
                          >
                            Mark as Accurate ✅
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
