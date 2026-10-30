import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitPredictionFeedback } from '../services/historyService';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  Cpu, 
  RefreshCw, 
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert
} from 'lucide-react';

export default function FeedbackCard({ 
  result, 
  profileUrl = '', 
  username = '', 
  platform = 'Generic',
  historyId = null,
  onFeedbackSubmitted = null
}) {
  const { currentUser } = useAuth();
  const [selectedVerdict, setSelectedVerdict] = useState(null); // 'correct' | 'false_positive' | 'false_negative'
  const [notes, setNotes] = useState('');
  const [autoRetrain, setAutoRetrain] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!result) return null;

  const isModelFake = result.is_fake === 1;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedVerdict) {
      setErrorMessage('Please select whether this prediction is correct or incorrect.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const isCorrect = selectedVerdict === 'correct';
      // If user says correct: ground truth = model's prediction
      // If user says false_positive: ground truth = 0 (Genuine)
      // If user says false_negative: ground truth = 1 (Fake/Malicious)
      let userVerifiedFake = isModelFake ? 1 : 0;
      if (selectedVerdict === 'false_positive') userVerifiedFake = 0;
      if (selectedVerdict === 'false_negative') userVerifiedFake = 1;

      const res = await submitPredictionFeedback({
        historyId: historyId || result.historyId,
        username: username || result.account_username || result.extracted_username || 'scanned_account',
        profileUrl: profileUrl || result.profile_url,
        platform: platform || result.platform || 'Generic',
        features: result.extracted_features || result.raw_extracted_features || {},
        modelPredictedFake: isModelFake ? 1 : 0,
        userVerifiedFake: userVerifiedFake,
        isCorrect: isCorrect,
        feedbackNotes: notes,
        user: currentUser,
        autoRetrain: autoRetrain
      });

      setSubmittedData(res);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(res);
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      setErrorMessage(err.message || 'Failed to submit verification feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-[#090e1a]/90 relative overflow-hidden animate-fadeIn">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Community Ground-Truth & Model Retraining
            </h4>
            <p className="text-[11px] text-slate-400">
              Help train our AI models by confirming if this prediction is accurate
            </p>
          </div>
        </div>

        {submittedData && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Logged & Synced
          </span>
        )}
      </div>

      {submittedData ? (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Thank you for verifying! Your feedback has been saved.</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Profile features and verified ground-truth label have been appended to the SocialGuard dataset.
            {submittedData.retrained && (
              <span className="block mt-1 text-cyan-300 font-mono text-[10px]">
                ⚡ AI Models dynamically retrained on {submittedData.dataset_size} samples. Current Best Classifier: {submittedData.best_model}
              </span>
            )}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-300 mb-2">
              Is this prediction correct for <strong className="text-cyan-300">@{username || result.account_username || 'this account'}</strong>?
            </p>

            {/* Verification buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setSelectedVerdict('correct'); setErrorMessage(null); }}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedVerdict === 'correct'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Yes, Accurate</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedVerdict('false_positive'); setErrorMessage(null); }}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedVerdict === 'false_positive'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>No, It's Genuine</span>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedVerdict('false_negative'); setErrorMessage(null); }}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedVerdict === 'false_negative'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>No, Malicious Bot</span>
              </button>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Feedback Notes or Discrepancy Details (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Real human artist with newly created portfolio account..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/40"
            />
          </div>

          {/* Auto retrain toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRetrain}
                onChange={(e) => setAutoRetrain(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
              />
              <span className="flex items-center gap-1.5 text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Include link in dataset & trigger model retraining
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !selectedVerdict}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Retraining AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
